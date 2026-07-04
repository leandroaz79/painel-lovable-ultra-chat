---
phase: 06-security-review
reviewed: 2026-07-03T12:00:00Z
depth: deep
files_reviewed: 7
files_reviewed_list:
  - src/components/landing/CheckoutModal.tsx
  - src/pages/Checkout.tsx
  - src/lib/supabase.ts
  - src/hooks/useAuth.ts
  - supabase/functions/customer-create-payment/index.ts
  - supabase/functions/customer-check-payment/index.ts
  - supabase/functions/customer-webhook-mp/index.ts
findings:
  critical: 1
  warning: 4
  info: 2
status: issues_found
---

# Phase 06: Security Review Report — Frontend Payment Flow

**Reviewed:** 2026-07-03
**Depth:** deep (cross-file analysis: frontend + edge functions)
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the complete payment flow across two frontend checkout components (`CheckoutModal.tsx`, `Checkout.tsx`), the Supabase client config, the `useAuth` hook, and three backend edge functions that handle payment creation, polling, and MercadoPago webhooks.

The payment architecture is fundamentally sound: card tokenization happens client-side via MercadoPago SDK (no raw card data touches the backend), the backend re-validates product pricing server-side, and the webhook endpoint uses an atomic update guard to prevent duplicate license creation. However, several concrete security defects were identified, including a hardcoded third-party API key, PCI-scoped data logged to the console, and wide-open CORS on payment endpoints.

---

## Critical Issues

### CR-01: Hardcoded MercadoPago Public Key in Source Code

**File:** `src/components/landing/CheckoutModal.tsx:230` and `src/pages/Checkout.tsx:125`
**Issue:** The MercadoPago public key `APP_USR-8b185660-9eba-4246-826b-0e71a9428388` is hardcoded directly in the source code in two separate locations, instead of being sourced from an environment variable.

**Why this is Critical:** While `APP_USR-` prefix indicates a public (client-side) key, hardcoding it means:
- It is baked into every build artifact and visible in version control history permanently
- Key rotation requires a code change and redeployment — no hot-swap possible
- Cannot differ between environments (staging vs. production) without code duplication
- If the key is ever compromised or needs revocation, every deployed instance is vulnerable until redeployed

**Evidence:**
```typescript
// CheckoutModal.tsx:230
const mp = new (window as any).MercadoPago('APP_USR-8b185660-9eba-4246-826b-0e71a9428388')

// Checkout.tsx:125
const mp = new (window as any).MercadoPago('APP_USR-8b185660-9eba-4246-826b-0e71a9428388')
```

**Fix:** Move to environment variable and define once:
```typescript
// src/lib/supabase.ts
export const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY

// Both CheckoutModal.tsx and Checkout.tsx
import { MP_PUBLIC_KEY } from '../../lib/supabase'
const mp = new (window as any).MercadoPago(MP_PUBLIC_KEY)
```
Add `VITE_MP_PUBLIC_KEY=APP_USR-...` to `.env.example` and `.env`.

---

## Warnings

### WR-01: PCI-Scoped Card Data Logged to Console

**File:** `src/components/landing/CheckoutModal.tsx:241`
**Issue:** The first 6 digits of the card number (the BIN/IIN) are logged to the browser console during token creation. Under PCI DSS, even partial card data (PAN) should not be logged. Browser console logs are accessible to any code running on the page (including browser extensions) and persist in DevTools.

**Evidence:**
```typescript
console.log('[MP SDK] Criando token do cartão...', { cardNumber: cardData.cardNumber.slice(0, 6) + '...' })
```

**Fix:** Remove the log entirely, or replace with a non-sensitive indicator:
```typescript
console.log('[MP SDK] Criando token do cartão...')
```

Note: `Checkout.tsx:125` does NOT have this log — only `CheckoutModal.tsx` does.

### WR-02: Wide-Open CORS on Payment Edge Functions

**File:** `supabase/functions/customer-create-payment/index.ts:5` and `supabase/functions/customer-check-payment/index.ts:7`
**Issue:** Both payment-related edge functions use `Access-Control-Allow-Origin: '*'`, allowing any origin to send requests. While Supabase JWT authentication mitigates unauthorized access, the wildcard CORS means any website could attempt to make authenticated requests if a user has an active session. A malicious page could potentially trigger payment creation on behalf of a logged-in user by loading the Supabase client with the public anon key.

**Evidence:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

**Fix:** Restrict CORS to known origins:
```typescript
const ALLOWED_ORIGINS = [
  Deno.env.get('APP_URL') || 'https://your-domain.com',
]

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.join(','),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### WR-03: Raw SDK Error Messages Exposed to Users

**File:** `src/components/landing/CheckoutModal.tsx:249`
**Issue:** Raw MercadoPago SDK error messages are passed directly to the user via `showToast`. These messages may contain internal implementation details (API endpoint URLs, error codes, internal state) that could aid an attacker in understanding the payment integration.

**Evidence:**
```typescript
const msg = err?.message || err?.error?.message || 'Erro ao validar cartão. Verifique os dados.'
reject(new Error(msg))
```

**Fix:** Sanitize error messages before exposing to users:
```typescript
const msg = err?.message || err?.error?.message || ''
// Only show user-friendly messages, never raw SDK errors
const userMessage = msg.includes('token') ? 'Erro ao validar cartão. Verifique os dados.' : 'Erro ao processar pagamento.'
reject(new Error(userMessage))
```

### WR-04: Missing buyer_whatsapp Validation in Edge Function

**File:** `supabase/functions/customer-create-payment/index.ts:39-41`
**Issue:** The edge function validates `buyer_name`, `buyer_email`, and `buyer_cpf` as required fields, but `buyer_whatsapp` is not validated at all. While the frontend validates the WhatsApp format (10-13 digits), a direct API call could bypass this and inject arbitrary data into the `payer.phone.number` field sent to MercadoPago (line 72) and stored in the database (line 91).

**Evidence:**
```typescript
// Only these are validated:
if (!buyer_name || !buyer_email || !buyer_cpf) {
  throw new Error('buyer_name, buyer_email e buyer_cpf são obrigatórios')
}
// buyer_whatsapp is used without validation:
const userPhone = buyer_whatsapp || user.user_metadata?.whatsapp || ''
```

**Fix:** Add server-side validation for buyer_whatsapp:
```typescript
if (buyer_whatsapp) {
  const cleaned = buyer_whatsapp.replace(/\D/g, '')
  if (cleaned.length < 10 || cleaned.length > 13) {
    throw new Error('buyer_whatsapp inválido')
  }
}
```

---

## Info

### IN-01: Extensive Console Logging in Production Payment Code

**Files:** `src/components/landing/CheckoutModal.tsx:92-93,241,244,248` and multiple edge functions
**Issue:** Multiple `console.log` and `console.error` calls exist throughout the payment flow. While not a direct vulnerability, these logs can leak sensitive information (payment IDs, error details, user IDs) to browser DevTools or server logs that may be aggregated by third-party services.

**Key locations:**
- `CheckoutModal.tsx:92` — SDK load confirmation
- `CheckoutModal.tsx:241` — Card number prefix (addressed in WR-01)
- `CheckoutModal.tsx:244` — Token creation success
- `CheckoutModal.tsx:248` — SDK error details
- `customer-create-payment/index.ts:58,115,151` — Product lookup errors, MP errors, DB errors
- `customer-webhook-mp/index.ts:39,45,66,83,159` — Webhook details, payment status, user IDs

**Fix:** Use a structured logger with log levels. In production, only log `warn` and above. Remove or guard `console.log` calls with environment checks:
```typescript
const isDev = import.meta.env.DEV
if (isDev) console.log('[MP SDK] Token criado')
```

### IN-02: Checkout.tsx Missing MercadoPago SDK Load Error Handling

**File:** `src/pages/Checkout.tsx:77-82`
**Issue:** Unlike `CheckoutModal.tsx` (which has `onerror` handling for the SDK script), `Checkout.tsx` does not handle script load failures. If the MercadoPago CDN is unreachable, `getCardToken()` will fail with an unhandled `(window as any).MercadoPago is not a constructor` error, which is not user-friendly.

**Evidence:**
```typescript
// Checkout.tsx - no error handler
script.src = 'https://sdk.mercadopago.com/js/v2'
script.async = true
document.body.appendChild(script)

// CheckoutModal.tsx - has error handler
script.onerror = () => console.error('[MP SDK] Erro ao carregar script')
```

**Fix:** Add error handling consistent with `CheckoutModal.tsx`:
```typescript
script.onerror = () => console.error('[MP SDK] Erro ao carregar script')
```

---

_Reviewed: 2026-07-03_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
