---
phase: payment-flow-review
reviewed: 2026-07-03T00:00:00Z
depth: deep
files_reviewed: 7
files_reviewed_list:
  - supabase/functions/customer-create-payment/index.ts
  - supabase/functions/customer-webhook-mp/index.ts
  - supabase/functions/mercadopago-webhook/index.ts
  - supabase/functions/check-payment-status/index.ts
  - supabase/functions/customer-check-payment/index.ts
  - supabase/functions/reseller-buy-credits/index.ts
  - supabase/functions/process-extension-payment/index.ts
findings:
  critical: 5
  warning: 8
  info: 3
  total: 16
status: issues_found
---

# Payment Flow: Deep Code Review Report

**Reviewed:** 2026-07-03T00:00:00Z
**Depth:** deep (cross-file, call-chain tracing)
**Files Reviewed:** 7
**Status:** issues_found

## Summary

This review covers the complete MercadoPago payment flow: payment creation, two webhook handlers, payment status checking, reseller credit purchases, and M-Pesa/e-Mola extension payments. The codebase shows evidence of prior security reviews (comments like "CRIT-004 FIX", "HIGH-003 FIX") but several critical defects remain across the payment lifecycle. The most severe issues are: (1) a broken database query in `reseller-buy-credits` referencing non-existent columns, (2) race conditions in the credit-adding webhook that can silently lose credits, (3) CHECK constraint violations from unmapped MercadoPago statuses that silently drop notifications, and (4) data loss from JSONB overwrites in the customer webhook.

## Critical Issues

### CR-01: reseller-buy-credits queries non-existent columns on product_pricing

**File:** `supabase/functions/reseller-buy-credits/index.ts:60-65`
**Issue:** The query references two columns that do not exist on the `product_pricing` table:
- `.eq('product_slug', 'lifetime-key')` — column `product_slug` does not exist
- `.eq('active', true)` — column is named `is_active`, not `active`

The migration 008 schema defines: `id, min_quantity, max_quantity, unit_price, discount_percent, is_active, created_at, updated_at, created_by`. No `product_slug` column exists anywhere.

This means **reseller-buy-credits is completely non-functional**. Every call will fail with a PostgREST error on the nonexistent column, `pricing` will be null, and the function throws "Produto não encontrado ou inativo".

**Fix:**
```typescript
// Option A: If product_pricing is meant to be a generic pricing table,
// add a product_slug column via a new migration:
// ALTER TABLE public.product_pricing ADD COLUMN product_slug TEXT;

// Option B (immediate fix): Remove the product_slug filter and use
// quantity-based pricing tiers, which is what the table actually supports:
const { data: pricing } = await supabaseClient
  .from('product_pricing')
  .select('unit_price, min_quantity, max_quantity')
  .eq('is_active', true)
  .lte('min_quantity', quantity)
  .or(`max_quantity.is.null,max_quantity.gte.${quantity}`)
  .order('min_quantity', { ascending: false })
  .limit(1)
  .single()
```

### CR-02: Optimistic locking race condition in mercadopago-webhook can silently lose credits

**File:** `supabase/functions/mercadopago-webhook/index.ts:99-127`
**Issue:** After the atomic lock on `credit_purchases` succeeds (which only prevents the SAME payment being processed twice), the code uses a read-then-write optimistic lock on `resellers.credits`:

```typescript
// Read current credits
const { data: reseller } = await supabaseAdmin
  .from('resellers').select('credits, total_credits_purchased').eq('user_id', userId).single()

// Write with WHERE condition
await supabaseAdmin
  .from('resellers')
  .update({ credits: reseller.credits + quantity, ... })
  .eq('user_id', userId)
  .eq('credits', reseller.credits)  // optimistic lock
```

If two DIFFERENT credit purchase webhooks arrive concurrently for the same reseller (e.g., reseller buys credits twice in quick succession):
1. Webhook A reads `credits = 5`
2. Webhook B reads `credits = 5`
3. Webhook A updates: `credits = 5 + 10 = 15` (WHERE credits=5 matches) → success
4. Webhook B updates: `credits = 5 + 5 = 10` (WHERE credits=5 doesn't match — credits is now 15)

Step 4 updates 0 rows. Supabase does NOT return an error for 0-row updates. The function logs `✅ 5 créditos adicionados` but **no credits were added**. The reseller paid for credits that were never credited.

**Fix:** Use an atomic SQL function instead of read-then-write:
```sql
CREATE OR REPLACE FUNCTION add_reseller_credits(
  p_user_id UUID,
  p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.resellers
  SET
    credits = credits + p_quantity,
    total_credits_purchased = total_credits_purchased + p_quantity
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reseller not found: %', p_user_id;
  END IF;
END;
$$;
```
Then call via: `await supabaseAdmin.rpc('add_reseller_credits', { p_user_id: userId, p_quantity: quantity })`

### CR-03: Unmapped MercadoPago statuses silently violate CHECK constraints

**File:** `supabase/functions/customer-webhook-mp/index.ts:163-177`
**File:** `supabase/functions/mercadopago-webhook/index.ts:137-143`
**Issue:** Both webhooks have incomplete status mappings for non-approved statuses.

**customer-webhook-mp** (lines 164-176):
```typescript
const statusMap: Record<string, string> = {
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
  refunded: 'refunded',
}
const mappedStatus = statusMap[payment.status] || payment.status
// If payment.status = 'in_process' → mappedStatus = 'in_process'
```

**mercadopago-webhook** (lines 138-143):
```typescript
await supabaseAdmin
  .from('credit_purchases')
  .update({ status: payment.status }) // Raw MP status, no mapping
  .eq('payment_id', paymentId)
```

The database CHECK constraints are:
- `customer_purchases.payment_status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')`
- `credit_purchases.status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')`

MercadoPago sends intermediate statuses like `in_process`, `authorized`, `in_mediation`, `charged_back`. When these arrive:
1. The raw or unmapped status violates the CHECK constraint
2. The Supabase update throws an error
3. In `customer-webhook-mp`: the error at line 173 is unhandled, propagates to the catch block at line 180, which returns 200 to MP — **the notification is permanently lost**
4. In `mercadopago-webhook`: same pattern — error propagates, catch returns 200

If MP later sends the final `approved` notification and it arrives, the payment is processed. But if MP considers the intermediate notification as the only one (or stops retrying), the purchase remains in `pending` forever with no license created.

**Fix:** Add comprehensive status mapping and handle unknown statuses gracefully:
```typescript
// For both webhooks - use the same mapping:
const statusMap: Record<string, string> = {
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
  refunded: 'refunded',
  in_process: 'pending',       // Map intermediate to pending
  authorized: 'pending',       // Authorized but not captured yet
  in_mediation: 'pending',     // Under dispute
  charged_back: 'rejected',    // Chargeback = rejected
}

const mappedStatus = statusMap[payment.status]
if (!mappedStatus) {
  console.log('Status desconhecido ignorado:', payment.status)
  return new Response('Unknown status ignored', { status: 200 })
}
```

### CR-04: payment_data JSONB overwritten destroying metadata on webhook approval

**File:** `supabase/functions/customer-webhook-mp/index.ts:144-157`
**Issue:** When the webhook processes an approved payment, it sets:

```typescript
const { error: updateError } = await supabaseAdmin
  .from('customer_purchases')
  .update({
    license_key: licenseKey,
    approved_at: new Date().toISOString(),
    payment_data: { mp_status: payment.status, mp_status_detail: payment.status_detail }, // LINE 150
  })
  .eq('payment_id', paymentId)
```

This **replaces** the entire `payment_data` JSONB column. The original data stored by `customer-create-payment` (lines 123-130) included: `transaction_amount, description, payer info, metadata with user_id, product_id, product_slug, buyer_name, buyer_email, buyer_whatsapp, buyer_cpf, payment_method`. All of this is destroyed and replaced with just `{ mp_status, mp_status_detail }`.

This data loss impacts:
- Admin dashboards that display purchase details
- Refund processing that needs original payment info
- Audit trails
- Support investigations

**Fix:** Merge instead of replace:
```typescript
const { data: existing } = await supabaseAdmin
  .from('customer_purchases')
  .select('payment_data')
  .eq('payment_id', paymentId)
  .single()

await supabaseAdmin
  .from('customer_purchases')
  .update({
    license_key: licenseKey,
    approved_at: new Date().toISOString(),
    payment_data: {
      ...existing?.payment_data,
      mp_status: payment.status,
      mp_status_detail: payment.status_detail,
    },
  })
  .eq('payment_id', paymentId)
```

### CR-05: Unsafe property access on MP response can orphan purchase records

**File:** `supabase/functions/customer-create-payment/index.ts:142-143, 231-234`
**Issue:** After inserting the purchase record (line 146), the code accesses deeply nested properties without null checks:

```typescript
// Line 142-143 (inside insert preparation):
insertPayload.pix_qr_code = mpResult.point_of_interaction.transaction_data.qr_code
insertPayload.pix_qr_code_base64 = mpResult.point_of_interaction.transaction_data.qr_code_base64

// Line 231-234 (response construction):
responsePayload.pix = {
  qr_code: mpResult.point_of_interaction.transaction_data.qr_code,
  qr_code_base64: mpResult.point_of_interaction.transaction_data.qr_code_base64,
  ticket_url: mpResult.point_of_interaction.transaction_data.ticket_url,
}
```

If MercadoPago returns a 201 but with `point_of_interaction` as undefined or null (which happens with certain payment method configurations), this throws a TypeError. The purchase record is already inserted in the DB at line 146, but no QR code data is saved and the client receives a generic error. The payment is stuck: money may be collected but the purchase record has no QR code and no license.

**Fix:** Add null-safe access:
```typescript
const txData = mpResult.point_of_interaction?.transaction_data
if (!isCreditCard && txData) {
  insertPayload.pix_qr_code = txData.qr_code
  insertPayload.pix_qr_code_base64 = txData.qr_code_base64
}

// Similarly for response:
if (!isCreditCard && txData) {
  responsePayload.pix = {
    qr_code: txData.qr_code,
    qr_code_base64: txData.qr_code_base64,
    ticket_url: txData.ticket_url,
  }
}
```

## Warnings

### WR-01: No idempotency key sent to MercadoPago

**File:** `supabase/functions/customer-create-payment/index.ts:103-110`
**File:** `supabase/functions/reseller-buy-credits/index.ts:98-105`
**Issue:** Neither payment creation function sends an `X-Idempotency-Key` header. If the MP API call succeeds but the response fails to reach the client (network timeout, Supabase function timeout), the user may retry and create a duplicate payment. MercadoPago supports idempotency keys to prevent this.

**Fix:**
```typescript
const idempotencyKey = crypto.randomUUID()
const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Idempotency-Key': idempotencyKey,
  },
  body: JSON.stringify(paymentPayload),
})
```

### WR-02: credit_purchases insert error not checked in reseller-buy-credits

**File:** `supabase/functions/reseller-buy-credits/index.ts:115-127`
**Issue:** The `credit_purchases` insert does not check for errors:
```typescript
await supabaseClient.from('credit_purchases').insert({...}) // No error handling
```
If the insert fails (e.g., duplicate `payment_id` due to unique constraint, RLS policy rejection), the user receives QR code data for a payment that was never recorded. When the webhook fires, it will try to update a non-existent row, and credits will never be added.

**Fix:**
```typescript
const { error: insertError } = await supabaseClient.from('credit_purchases').insert({...})
if (insertError) {
  console.error('Erro ao salvar compra de créditos:', insertError)
  throw new Error('Erro ao registrar compra')
}
```

### WR-03: Webhook returns error details in response body

**File:** `supabase/functions/customer-webhook-mp/index.ts:182-184`
**File:** `supabase/functions/mercadopago-webhook/index.ts:148-150`
**Issue:** Error responses include `error.message` in the JSON body. While these endpoints are unauthenticated (no JWT), they are public-facing. Error messages from database operations or internal logic could leak implementation details.

**Fix:** Return generic error messages:
```typescript
return new Response(JSON.stringify({ error: 'Internal processing error' }), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  status: 200
})
```

### WR-04: CORS allows all origins on payment endpoints

**File:** All reviewed functions
**Issue:** `Access-Control-Allow-Origin: '*'` is set on all payment endpoints. For functions handling financial transactions, this should be restricted to the application domain to prevent CSRF-like attacks from malicious sites.

**Fix:** Set the specific origin:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### WR-05: No input validation for CPF format

**File:** `supabase/functions/customer-create-payment/index.ts:39,75-77`
**File:** `supabase/functions/reseller-buy-credits/index.ts:55,86-88`
**Issue:** `buyer_cpf` is required but not validated for format (must be 11 digits). Invalid CPFs are sent directly to MercadoPago, which may reject them, causing confusing error messages for users. In `reseller-buy-credits`, the CPF is sanitized with `.replace(/\D/g, '')` (line 87) but not validated for length.

**Fix:** Add validation:
```typescript
const cleanCpf = buyer_cpf.replace(/\D/g, '')
if (cleanCpf.length !== 11) {
  throw new Error('CPF deve ter 11 dígitos')
}
```

### WR-06: customer-check-payment selects columns it doesn't return

**File:** `supabase/functions/customer-check-payment/index.ts:41-43`
**Issue:** The query selects `pix_qr_code, pix_qr_code_base64` but the response (lines 52-57) only returns `status` and `license_key`. This fetches unnecessary data and confuses future maintainers who may think the QR code data is available from this endpoint.

**Fix:** Either remove the extra selected columns or include them in the response:
```typescript
const { data: purchase } = await supabaseClient
  .from('customer_purchases')
  .select('payment_status, license_key')
  .eq('payment_id', payment_id)
  .eq('user_id', user.id)
  .maybeSingle()
```

### WR-07: No webhook IP/origin validation

**File:** `supabase/functions/customer-webhook-mp/index.ts` (entire file)
**File:** `supabase/functions/mercadopago-webhook/index.ts` (entire file)
**Issue:** Both webhook endpoints are completely unauthenticated and have no IP validation. While MercadoPago does not provide a static IP list or webhook signing in all configurations, anyone who discovers the endpoint URL can forge payment notifications to create licenses or add credits without paying. The URL is predictable: `{SUPABASE_URL}/functions/v1/customer-webhook-mp`.

**Mitigation options:**
1. Add a shared secret in the webhook URL query param: `?secret=${WEBHOOK_SECRET}` and validate it
2. Verify the payment by fetching from MP API before processing (already done — this is partial mitigation)
3. Use MP's webhook signing feature if available for the payment method

### WR-08: License key generation uses random UUID without collision check

**File:** `supabase/functions/customer-create-payment/index.ts:172-173`
**File:** `supabase/functions/customer-webhook-mp/index.ts:107-108`
**Issue:** License keys are generated as `{PREFIX}-{12 random hex chars}` with no uniqueness check against existing keys. While 12 hex chars (48 bits) makes collision unlikely, there's no database UNIQUE constraint on `ts_licenses.license_key` visible in the reviewed migrations (the INSERT would fail silently if there were a collision).

**Fix:** Add a UNIQUE constraint if not present, and catch/retry on collision:
```sql
ALTER TABLE public.ts_licenses ADD CONSTRAINT unique_license_key UNIQUE (license_key);
```

## Info

### IN-01: Duplicate payment status check functions

**File:** `supabase/functions/check-payment-status/index.ts`
**File:** `supabase/functions/customer-check-payment/index.ts`
**Issue:** These two functions do nearly the same thing — both check payment status for a user. `check-payment-status` returns `license_key`, while `customer-check-payment` also selects (but doesn't return) QR code data. Having two functions for the same purpose increases maintenance burden and risk of them diverging.

**Fix:** Consolidate into a single function or clearly differentiate their purposes.

### IN-02: process-extension-payment has a dead payment integration

**File:** `supabase/functions/process-extension-payment/index.ts:252-298`
**Issue:** The `processPayment` function is a stub that always returns `success: false`. The comment at line 289 says "Pagamento desativado (simulação removida)". The function accepts requests, validates them, and then fails at the payment processing step. This is dead code that may confuse developers.

**Fix:** Either implement the real integration or remove the function entirely. If keeping it disabled, add an explicit feature flag check at the top.

### IN-03: console.log used for logging in production functions

**File:** All reviewed webhook functions
**Issue:** Production payment functions use `console.log` for logging. While Deno/Supabase captures these, structured logging with levels (info, warn, error) would improve production debugging.

**Fix:** Consider using a structured logging approach or at minimum prefix log levels consistently.

---

_Reviewed: 2026-07-03T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
