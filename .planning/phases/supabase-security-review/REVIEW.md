---
phase: supabase-security-review
reviewed: 2026-07-03T00:00:00Z
depth: deep
files_reviewed: 36
files_reviewed_list:
  - supabase/functions/admin-cleanup-expired-trials/index.ts
  - supabase/functions/admin-create-license/index.ts
  - supabase/functions/admin-create-reseller/index.ts
  - supabase/functions/admin-delete-license/index.ts
  - supabase/functions/admin-get-users/index.ts
  - supabase/functions/admin-list-customer-purchases/index.ts
  - supabase/functions/admin-list-customers/index.ts
  - supabase/functions/admin-list-licenses/index.ts
  - supabase/functions/admin-list-resellers/index.ts
  - supabase/functions/admin-manage-credit-purchase/index.ts
  - supabase/functions/admin-manage-customer-purchase/index.ts
  - supabase/functions/admin-manage-customer/index.ts
  - supabase/functions/admin-manage-reseller/index.ts
  - supabase/functions/admin-renew-license/index.ts
  - supabase/functions/admin-reset-hwid/index.ts
  - supabase/functions/admin-revoke-license/index.ts
  - supabase/functions/check-payment-status/index.ts
  - supabase/functions/create-lovable-project/index.ts
  - supabase/functions/customer-check-payment/index.ts
  - supabase/functions/customer-create-payment/index.ts
  - supabase/functions/customer-webhook-mp/index.ts
  - supabase/functions/mercadopago-webhook/index.ts
  - supabase/functions/optimize-prompt/index.ts
  - supabase/functions/process-extension-payment/index.ts
  - supabase/functions/publish-project/index.ts
  - supabase/functions/remove-watermark/index.ts
  - supabase/functions/reseller-buy-credits/index.ts
  - supabase/functions/reseller-create-license/index.ts
  - supabase/functions/reseller-dashboard/index.ts
  - supabase/functions/reseller-delete-license/index.ts
  - supabase/functions/reseller-list-licenses/index.ts
  - supabase/functions/reseller-register/index.ts
  - supabase/functions/upload-temp-image/index.ts
  - supabase/functions/user-create-trial/index.ts
  - supabase/functions/user-delete-account/index.ts
  - supabase/functions/validate-license/index.ts
findings:
  critical: 4
  warning: 8
  info: 5
status: issues_found
---

# Phase: Supabase Edge Functions Security Review

**Reviewed:** 2026-07-03
**Depth:** deep
**Files Reviewed:** 36
**Status:** issues_found

## Summary

Deep security review of all 36 Supabase Edge Functions in the `supabase/functions/` directory. The codebase implements a license management system with admin, reseller, and customer roles, integrated with Mercado Pago for payments and Lovable for project deployment.

**Key architectural observations:**
- All admin endpoints correctly verify JWT + admin role from `user_roles` table
- Most endpoints use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS (standard for edge functions)
- Payment webhooks (`customer-webhook-mp`, `mercadopago-webhook`) have `verify_jwt = false` as expected for payment provider callbacks
- Audit logging is consistently implemented across admin operations

**Critical concerns:** Webhook endpoints lack Mercado Pago signature verification, enabling payment spoofing. Race conditions in credit management could cause financial loss. An unauthenticated file upload endpoint exists. All 36 functions use wildcard CORS.

---

## Critical Issues

### CR-01: Payment Webhooks Lack Request Signature Verification (Payment Spoofing)

**File:** `supabase/functions/customer-webhook-mp/index.ts:18-65` and `supabase/functions/mercadopago-webhook/index.ts:20-71`
**Issue:** Both Mercado Pago webhook endpoints accept requests without verifying the `x-signature` header that Mercado Pago sends with each webhook. The endpoints are configured with `verify_jwt = false` (necessary for external webhooks) but have NO alternative authentication mechanism. An attacker who discovers a valid `payment_id` can forge a webhook request to approve the payment.

**Impact:** An attacker can:
1. Create a pending payment via `customer-create-payment`
2. Immediately call `customer-webhook-mp` with the known `payment_id`
3. The webhook will fetch the payment from Mercado Pago (which may still be pending), BUT the atomic lock (`eq('payment_status', 'pending')`) means only the first request wins. However, if the attacker calls the webhook BEFORE Mercado Pago's actual webhook arrives, they can race to approve their own payment.

For `mercadopago-webhook`, the forged webhook can add credits to a reseller's account without actual payment.

**Evidence:**
```typescript
// customer-webhook-mp/index.ts - NO signature verification
serve(async (req) => {
  // Reads paymentId from query params or body - no signature check
  const url = new URL(req.url)
  let topic = url.searchParams.get('topic')
  let id = url.searchParams.get('id')
  // ...
  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` }
  })
  // Trusts payment.status from Mercado Pago API, but the request itself is unauthenticated
```

**Fix:** Add Mercado Pago webhook signature verification:
```typescript
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

// Verify x-signature header from Mercado Pago
const signature = req.headers.get('x-signature')
const secret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET')
if (!signature || !secret) {
  return new Response('Unauthorized', { status: 401 })
}

// Parse and verify HMAC signature
const body = await req.text()
const expectedSig = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(secret),
  { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
)
const sig = await crypto.subtle.sign('HMAC', expectedSig, new TextEncoder().encode(body))
const computedSignature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
if (signature !== computedSignature) {
  return new Response('Invalid signature', { status: 401 })
}
```

---

### CR-02: Unauthenticated File Upload Endpoint (Storage Abuse / Potential XSS)

**File:** `supabase/functions/upload-temp-image/index.ts:34-171`
**Issue:** The `upload-temp-image` endpoint has NO authentication requirement. Any anonymous user can upload files up to 20MB. While file type validation exists (MIME type check), it only checks the `Content-Type` header which is client-controlled. The actual file content is not inspected for malicious payloads.

**Impact:**
1. **Storage abuse:** Attackers can exhaust Supabase storage by uploading thousands of files
2. **XSS via SVG:** SVG files (not in ALLOWED_TYPES but could be bypassed if type check is circumvented) could contain JavaScript
3. **Malware hosting:** Attacker uploads malware payloads and shares the public URLs
4. **Rate limit bypass:** Rate limiting uses `x-forwarded-for` header which can be spoofed

**Evidence:**
```typescript
// upload-temp-image/index.ts - No auth check
serve(async (req) => {
  // Only rate limiting by IP (spoofable)
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(clientIP)) { ... }
  
  // File type check based on client-provided Content-Type (not magic bytes)
  if (!ALLOWED_TYPES.includes(file.type)) { ... }
  
  // Uploads to public bucket
  const { data: urlData } = supabase.storage
    .from('temp-images')
    .getPublicUrl(fileName)
```

**Fix:** Add authentication and validate file content:
```typescript
// Add authentication
const authHeader = req.headers.get("Authorization");
if (!authHeader) throw new Error("Missing authorization header");
const token = authHeader.replace("Bearer ", "");
const { data: user, error: userError } = await supabaseClient.auth.getUser(token);
if (userError || !user) throw new Error("Unauthorized");

// Validate magic bytes instead of just Content-Type
const buffer = await file.arrayBuffer()
const bytes = new Uint8Array(buffer.slice(0, 8))
const magicBytes = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header
}
// Verify magic bytes match declared type
```

---

### CR-03: Race Condition in Credit Purchase Approval (Financial Loss)

**File:** `supabase/functions/admin-manage-credit-purchase/index.ts:62-97`
**Issue:** The credit approval and refund operations use a read-then-write pattern without atomic updates or optimistic locking. If two admin requests process the same purchase concurrently, credits can be duplicated or lost.

**Impact:**
- **Credit duplication:** Two concurrent `approve` requests read `credits: 10`, both write `credits: 11` (instead of 12)
- **Refund bypass:** Two concurrent `refund` requests both read `credits: 10`, both write `credits: 9` (instead of 8), but only one purchase is refunded

**Evidence:**
```typescript
// admin-manage-credit-purchase/index.ts - Race condition
// Step 1: Read current credits
const { data: resellerData } = await adminClient
  .from("resellers")
  .select("credits, total_credits_purchased")
  .eq("user_id", purchase.reseller_id)
  .single()

// Step 2: Write new credits (between read and write, another request can change credits)
await adminClient
  .from("resellers")
  .update({
    credits: resellerData.credits + purchase.quantity, // Uses stale value
    total_credits_purchased: resellerData.total_credits_purchased + purchase.quantity,
  })
  .eq("user_id", purchase.reseller_id)
```

**Fix:** Use atomic increment via RPC or optimistic locking:
```typescript
// Option 1: Use Supabase RPC for atomic increment
await adminClient.rpc('increment_reseller_credits', {
  reseller_user_id: purchase.reseller_id,
  amount: purchase.quantity
})

// Option 2: Optimistic locking
const { error } = await adminClient
  .from("resellers")
  .update({
    credits: resellerData.credits + purchase.quantity,
  })
  .eq("user_id", purchase.reseller_id)
  .eq("credits", resellerData.credits) // Fails if credits changed since read
```

---

### CR-04: Admin Sets Password for Reseller Without Secure Transmission

**File:** `supabase/functions/admin-create-reseller/index.ts:38-63`
**Issue:** The admin provides a password in the request body to create a reseller account. This password is transmitted in the request body, logged in error messages if creation fails, and the admin knows the user's password. There's no mechanism for the reseller to change it on first login.

**Impact:**
1. Admin knows all reseller passwords (insider threat)
2. Password visible in any request logging/proxy
3. No forced password change on first login
4. If admin account is compromised, all reseller accounts are at risk

**Evidence:**
```typescript
// admin-create-reseller/index.ts
const { name, email, whatsapp, password, initial_credits = 0, status = "active" } = await req.json();

// Password sent directly to create user
const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
  email,
  password,  // Admin-provided password
  email_confirm: true
});
```

**Fix:** Generate a temporary password and force reset:
```typescript
// Generate temporary password
const tempPassword = crypto.randomUUID().slice(0, 12)
const { data: newUser } = await adminClient.auth.admin.createUser({
  email,
  password: tempPassword,
  email_confirm: true
})

// Send temp password via secure channel (email)
await sendWelcomeEmail(email, tempPassword)

// Force password change on first login via user_metadata flag
await adminClient.auth.admin.updateUserById(newUser.user.id, {
  user_metadata: { must_change_password: true }
})
```

---

## Warnings

### WR-01: Wildcard CORS on All Endpoints Including Admin Functions

**Files:** All 36 edge functions
**Issue:** Every edge function uses `"Access-Control-Allow-Origin": "*"`. This allows any website to make cross-origin requests. While admin endpoints require JWT authentication (mitigating most risk), this configuration is overly permissive and could facilitate CSRF-like attacks if combined with other vulnerabilities.

**Impact:** A malicious website could trigger requests to admin endpoints if an admin user visits the site while authenticated. The browser would include the JWT token automatically.

**Fix:** Restrict CORS to known origins:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "https://yourdomain.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

---

### WR-02: Non-Atomic Refund in admin-manage-customer-purchase

**File:** `supabase/functions/admin-manage-customer-purchase/index.ts:62-86`
**Issue:** The refund operation updates `payment_status` to "refunded" but does NOT reverse any license activation or device binding. A refunded purchase may still have an active license.

**Impact:** Customer pays, gets license, requests refund, keeps active license.

**Fix:** When refunding, also suspend/revoke the associated license:
```typescript
if (action === "refund") {
  // Update purchase status
  await adminClient.from("customer_purchases")
    .update({ payment_status: "refunded" })
    .eq("id", purchase_id);
  
  // Also revoke the license
  if (purchase.license_key) {
    await adminClient.from("ts_licenses")
      .update({ status: "suspended" })
      .eq("license_key", purchase.license_key);
  }
}
```

---

### WR-03: In-Memory Rate Limiting Not Effective in Distributed Environment

**Files:** `validate-license/index.ts`, `optimize-prompt/index.ts`, `create-lovable-project/index.ts`, `publish-project/index.ts`, `remove-watermark/index.ts`, `process-extension-payment/index.ts`, `upload-temp-image/index.ts`
**Issue:** Rate limiting uses in-memory `Map` objects. Supabase Edge Functions run on Deno Deploy which distributes requests across multiple instances. Rate limits are per-instance, not global, making them easily bypassed.

**Impact:** An attacker can bypass rate limits by sending requests that hit different instances. The rate limit of 20 requests/minute for `validate-license` could effectively be 20 × N instances.

**Fix:** Use Supabase database for rate limiting:
```typescript
// Use a database table for distributed rate limiting
const { data } = await supabase
  .from('rate_limits')
  .select('count')
  .eq('key', clientIP)
  .eq('window', Math.floor(Date.now() / 60000))
  .single()

if (data && data.count >= RATE_LIMIT_MAX) {
  return new Response('Rate limit exceeded', { status: 429 })
}

await supabase.rpc('increment_rate_limit', {
  p_key: clientIP,
  p_window: Math.floor(Date.now() / 60000)
})
```

---

### WR-04: Error Messages Leak Internal Details in Production

**Files:** `optimize-prompt/index.ts:136`, `process-extension-payment/index.ts:241`, `validate-license/index.ts:245`, `upload-temp-image/index.ts:131,163`, `create-lovable-project/index.ts:159`, `publish-project/index.ts:163`, `remove-watermark/index.ts:144`
**Issue:** Several functions return `error.message` directly to the client in error responses. This can leak internal implementation details, stack traces, or database errors.

**Impact:** Attackers can use error messages to understand the system's internal structure, identify vulnerabilities, or craft targeted attacks.

**Evidence:**
```typescript
// optimize-prompt/index.ts
return new Response(
  JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
  //                                                    ^^^^^^^^^^^^^^^^^^^^ Leaks internal error
)

// validate-license/index.ts
return new Response(
  JSON.stringify({ valid: false, message: 'Erro interno do servidor', error: error.message }),
  //                                                                ^^^^^^^^^^^^^^^^^^^^^^ Leaks
)
```

**Fix:** Return generic messages, log details server-side:
```typescript
console.error('Internal error:', error) // Log server-side
return new Response(
  JSON.stringify({ error: 'An internal error occurred' }),
  { status: 500 }
)
```

---

### WR-05: No Input Validation on license_key Format

**Files:** `admin-delete-license/index.ts:35`, `admin-renew-license/index.ts:32`, `admin-revoke-license/index.ts:26`, `admin-reset-hwid/index.ts:26`, `reseller-delete-license/index.ts:37`, `reseller-create-license/index.ts:54`
**Issue:** License key inputs are not validated against expected format (`TS-XXXXXXXXXX` or `PREFIX-XXXXXXXXXXXX`). Any string is accepted and passed directly to database queries.

**Impact:** While Supabase parameterized queries prevent SQL injection, invalid format could lead to unexpected behavior or log pollution.

**Fix:** Add format validation:
```typescript
function isValidLicenseKey(key: string): boolean {
  return /^TS-[0-9A-F]{20}$|^(TRY7|ULTRA15|ULTRA30)-[0-9A-F]{12}$/i.test(key)
}

if (!license_key || !isValidLicenseKey(license_key)) {
  throw new Error("Formato de license_key inválido")
}
```

---

### WR-06: Race Condition in reseller-delete-license Credit Refund

**File:** `supabase/functions/reseller-delete-license/index.ts:67-84`
**Issue:** Credit refund uses `reseller.total_licenses_created - 1` which reads a potentially stale value. If two licenses are deleted concurrently, the counter can be decremented incorrectly.

**Impact:** License creation counter becomes inaccurate, potentially allowing resellers to exceed their limits or showing incorrect statistics.

**Fix:** Use atomic decrement:
```typescript
await adminClient.rpc('decrement_reseller_counter', {
  reseller_id: reseller.id,
  field: 'total_licenses_created'
})
```

---

### WR-07: validate-license Exposes license_key in Response to Unauthenticated Callers

**File:** `supabase/functions/validate-license/index.ts:113-128`
**Issue:** The `validate-license` endpoint (configured with `verify_jwt = false`) returns license details including `user_name`, `expires_at`, and other metadata to anyone who provides a valid license key. While the key itself is required, this leaks PII.

**Impact:** If a license key is leaked (e.g., in logs, client-side storage), an attacker can enumerate license details.

**Fix:** Return only minimal validation status, not user details:
```typescript
// Return only what's needed for validation
const response = {
  valid: true,
  message: 'Licença válida',
  expires_at: license.expires_at,
  // Don't return: user_name, email, device_id, session_id
}
```

---

### WR-08: No Request Body Size Limit on Any Endpoint

**Files:** All 36 edge functions
**Issue:** No endpoint limits the size of the request body. An attacker could send a very large JSON payload to consume memory and potentially cause denial of service.

**Impact:** Denial of service via memory exhaustion, especially on endpoints that parse `req.json()`.

**Fix:** Add request body size validation:
```typescript
const contentLength = parseInt(req.headers.get('content-length') || '0')
if (contentLength > 1024 * 1024) { // 1MB limit
  return new Response('Request too large', { status: 413 })
}
```

---

## Info

### IN-01: debug/console.error Statements in Production

**Files:** `customer-webhook-mp/index.ts:39,45,66,83,95,140,155,159,181`, `mercadopago-webhook/index.ts:43,49,73,90,110,125,129,147`, `customer-create-payment/index.ts:58,115,151,203,245`, `create-lovable-project/index.ts:154`, `publish-project/index.ts:158`, `remove-watermark/index.ts:109,139`, `optimize-prompt/index.ts:134`, `process-extension-payment/index.ts:236,291`, `upload-temp-image/index.ts:125,158`, `validate-license/index.ts:240`
**Issue:** Multiple `console.log` and `console.error` statements throughout the codebase. While useful for debugging, they can leak sensitive information in production logs and consume resources.

**Fix:** Use a structured logger with log levels, or remove debug logs in production.

---

### IN-02: Inconsistent Error Response Format

**Files:** Multiple functions
**Issue:** Error responses use inconsistent formats:
- Some return `{ success: false, error: message }`
- Some return `{ valid: false, message: message }`
- Some return `{ error: message }`
- Some return `{ status: 'falha', error: message }`

**Fix:** Standardize error response format across all functions:
```typescript
interface ErrorResponse {
  success: false
  error: string
  code?: string
}
```

---

### IN-03: Duplicate License Key Generation Logic

**Files:** `admin-create-license/index.ts:27-31`, `reseller-create-license/index.ts:9-13`, `user-create-trial/index.ts:16-23`, `customer-webhook-mp/index.ts:106-108`, `customer-create-payment/index.ts:171-173`
**Issue:** License key generation is implemented independently in 5 different functions with slightly different formats (`TS-`, `TRY7-`, `ULTRA15-`, `ULTRA30-`). This duplication increases the risk of inconsistencies.

**Fix:** Extract to a shared utility module:
```typescript
// _shared/license.ts
export function generateLicenseKey(prefix: string = 'TS'): string {
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  return `${prefix}-${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}
```

---

### IN-04: Missing HTTP Method Restrictions

**Files:** `admin-cleanup-expired-trials/index.ts`, `admin-create-reseller/index.ts`, `admin-delete-license/index.ts`, `admin-get-users/index.ts`, `admin-list-customer-purchases/index.ts`, `admin-list-customers/index.ts`, `admin-list-resellers/index.ts`, `admin-manage-customer-purchase/index.ts`, `admin-manage-customer/index.ts`, `admin-manage-reseller/index.ts`, `admin-renew-license/index.ts`, `admin-reset-hwid/index.ts`, `admin-revoke-license/index.ts`, `reseller-create-license/index.ts`, `reseller-dashboard/index.ts`, `reseller-delete-license/index.ts`, `reseller-list-licenses/index.ts`, `reseller-register/index.ts`, `user-create-trial/index.ts`, `user-delete-account/index.ts`
**Issue:** These functions only check for `OPTIONS` method but don't reject non-POST methods. A GET request would be processed as a normal request.

**Fix:** Add explicit method check:
```typescript
if (req.method !== 'POST') {
  return new Response('Method not allowed', { status: 405, headers: corsHeaders })
}
```

---

### IN-05: Hardcoded Magic Numbers

**Files:** `admin-cleanup-expired-trials/index.ts:43` (3 minutes), `admin-renew-license/index.ts:87` (max days), `reseller-register/index.ts:77` (R$ 300), `optimize-prompt/index.ts:85` (10 chars minimum)
**Issue:** Business logic constants are hardcoded. Should be extracted to configuration or environment variables for easier maintenance.

**Fix:** Extract to constants or environment variables:
```typescript
const TRIAL_GRACE_PERIOD_MS = parseInt(Deno.env.get('TRIAL_GRACE_PERIOD_MS') || '180000') // 3 minutes
const RESELLER_ACTIVATION_FEE = parseFloat(Deno.env.get('RESELLER_ACTIVATION_FEE') || '300.00')
```

---

_Reviewed: 2026-07-03T00:00:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
