---
phase: 04-landing-page-quality-audit
reviewed: 2026-07-04T15:50:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - src/pages/Landing.tsx
  - src/components/landing/Hero.tsx
  - src/components/landing/Navbar.tsx
  - src/components/landing/PromoBar.tsx
  - src/components/landing/Steps.tsx
  - src/components/landing/PainPoints.tsx
  - src/components/landing/Features.tsx
  - src/components/landing/Pricing.tsx
  - src/components/landing/Testimonials.tsx
  - src/components/landing/ComparisonTable.tsx
  - src/components/landing/FAQ.tsx
  - src/components/landing/FinalCTA.tsx
  - src/components/landing/Footer.tsx
  - src/components/landing/WhatsAppFAB.tsx
  - src/components/landing/Reveal.tsx
  - src/components/landing/CheckoutModal.tsx
  - src/components/landing/AppMock.tsx
  - src/styles/tokens.css
  - src/styles/base.css
  - src/styles/landing.css
  - src/styles/layout.css
  - src/styles/components.css
findings:
  critical: 2
  warning: 12
  info: 8
  total: 22
status: issues_found
---

# Phase 04: Landing Page Quality Audit (Re-Audit)

**Reviewed:** 2026-07-04T15:50:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Audit Health Score

| Dimension | Previous | Current | Δ | Notes |
|---|---|---|---|---|
| **Accessibility (A11y)** | 2/4 | 3/4 | +1 | CheckoutModal has solid ARIA; landing page still lacks `<nav>`, focus styles, and alt on avatar cluster |
| **Performance** | 3/4 | 3/4 | — | Lazy loading present; no layout thrashing; minor concern with `filter: drop-shadow` on FAB |
| **Theming** | 1/4 | 3/4 | +2 | `--brand-green` fully eliminated; `--gradient-brand` and `--radius-btn` added; some hardcoded rgba(157,255,47,...) remains in inline styles |
| **Responsive Design** | 2/4 | 3/4 | +1 | Grid breakpoints solid; comparison table has mobile scroll; tiny-action sizing fixed |
| **Anti-Patterns** | 2/4 | 3/4 | +1 | Removed duplicate CSS vars; card grids differentiated by content; gradient text still pervasive |
| **TOTAL** | **10/20** | **15/20** | **+5** | Significant improvement. Remaining gaps are polish-level. |

### Anti-Patterns Verdict

**Gradient text overuse**: `text-gradient-brand` appears in Hero, Steps, PainPoints, Features, Pricing, Testimonials, FAQ, FinalCTA, and Footer — 9 sections. While appropriate for hero-level headings, using it on every section heading dilutes its impact and reads as "AI slop." The landing page has a consistent visual language now (green accent, glassmorphism cards, gradient buttons) but the sheer density of identical card layouts (Steps, PainPoints, Features, Testimonials) creates visual monotony.

**Overall**: The codebase has moved past generic AI-slop territory into intentional design. The remaining issues are polish gaps, not structural problems.

---

## Summary

This re-audit follows polish fixes that eliminated `--brand-green`, standardized button classes, fixed ConfirmationDialog tokens, and corrected Pricing CTA class usage. The token system is now unified and the visual language is consistent across 22 files. The score improvement from 10/20 to 15/20 reflects meaningful progress, primarily in theming and accessibility. The remaining findings are a mix of security (hardcoded API key), accessibility gaps (focus indicators, missing `<nav>` semantic), and inline style proliferation that should be migrated to CSS utility classes.

---

## Critical Issues

### CR-01: Hardcoded MercadoPago Public Key in Source Code

**File:** `src/components/landing/CheckoutModal.tsx:230`
**Issue:** The MercadoPago public API key `APP_USR-8b185660-9eba-4246-826b-0e71a9428388` is hardcoded directly in the component. While this is a *public* key (SDK-side, not a secret), hardcoding it means: (a) rotating the key requires a code change and redeploy, (b) the key is bundled into every client build and visible in source maps, and (c) it violates the principle of not embedding infrastructure identifiers in application code. The same key also appears in `src/pages/Checkout.tsx:125`.
**Fix:**
```typescript
// src/lib/supabase.ts or src/config.ts
export const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY

// CheckoutModal.tsx
const mp = new (window as any).MercadoPago(MERCADOPAGO_PUBLIC_KEY)
```

### CR-02: `<a href>` Used as Navigation Instead of `<button>` or `<Link>`

**File:** `src/components/landing/Hero.tsx:33-39`, `src/components/landing/FinalCTA.tsx:27-33`
**Issue:** CTA buttons are `<a href="/signup">` with `onClick={(e) => { e.preventDefault(); navigate('/signup') }}`. This pattern: (a) prevents keyboard activation via Enter in some screen readers, (b) creates confusing semantics (link that doesn't navigate like a link), and (c) bypasses React Router's `Link` component which handles prefetching and accessibility correctly. The pattern is used 7 times across Hero, Navbar, and FinalCTA.
**Fix:**
```tsx
// Replace <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup') }}>
// With:
import { Link } from 'react-router-dom'
<Link to="/signup" className="inline-flex items-center justify-center h-14 ...">
  Liberar poder ilimitado
</Link>
```

---

## Warnings

### WR-01: No Focus Indicator Styles for Interactive Elements

**File:** `src/styles/components.css` (global), `src/styles/tokens.css`
**Issue:** There is no `:focus-visible` style defined anywhere in the CSS. The only `:focus` rule is for inputs/selects (`components.css:293`). Buttons, links, and the FAQ accordion have no visible focus ring. This means keyboard users cannot see where focus is on buttons, nav links, FAQ items, or the WhatsApp FAB. WCAG 2.1 SC 2.4.7 requires visible focus indicators.
**Fix:**
```css
/* tokens.css or base.css */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### WR-02: Landing Page Lacks `<nav>` Semantic Landmark

**File:** `src/components/landing/Navbar.tsx:36`
**Issue:** The desktop navigation links use `<nav className="hidden items-center gap-1 lg:flex">` which is correct, but the mobile hamburger menu content (lines 88-120) renders links inside a `<div>` without a `<nav>` wrapper. Screen readers won't identify the mobile menu as navigation. Additionally, the `aria-label` on the hamburger button says "Abrir menu" but doesn't update to "Fechar menu" when open.
**Fix:**
```tsx
// Line 78: Update aria-label dynamically
aria-label={open ? "Fechar menu" : "Abrir menu"}

// Lines 88-120: Wrap mobile links in <nav aria-label="Menu de navegação">
```

### WR-03: Missing `alt` Text on Avatar Cluster Images

**File:** `src/components/landing/Hero.tsx:52-59`
**Issue:** The avatar images use `alt=""` (empty alt), which marks them as decorative. While this is acceptable for decorative images, these avatars are part of a social proof signal ("+800 criadores ativos"). The empty alt means screen readers will skip all 5 images entirely, making the social proof inaccessible.
**Fix:**
```tsx
// Add meaningful alt or use aria-hidden on the decorative avatars
<div className="flex -space-x-2" role="img" aria-label="Foto de 5 criadores que usam o Ultra Chat">
  {avatars.map((src, i) => (
    <img key={i} src={src} alt="" loading="lazy" ... />
  ))}
</div>
```

### WR-04: `rgba(157, 255, 47, ...)` Hardcoded in Inline Styles (20+ Instances)

**File:** Multiple landing components (Hero, Navbar, Steps, Features, FinalCTA, WhatsAppFAB, CheckoutModal)
**Issue:** While the `--brand-green` CSS variable was successfully eliminated from stylesheets, 20+ inline `style={{ boxShadow: '0 0 30px rgba(157, 255, 47, 0.2)' }}` remain in JSX. These bypass the token system entirely — if the accent color changes, these shadows won't update. The token `--accent-glow` exists but is underutilized.
**Fix:** Create a CSS utility class for accent glow shadows:
```css
.shadow-accent-glow { box-shadow: 0 0 30px var(--accent-glow); }
.shadow-accent-glow-lg { box-shadow: 0 10px 40px var(--accent-glow); }
```
Then replace `style={{ boxShadow: '...' }}` with `className="shadow-accent-glow"`.

### WR-05: FAQ Items Missing ARIA States

**File:** `src/components/landing/FAQ.tsx:31-41`
**Issue:** The FAQ accordion buttons don't have `aria-expanded` or `aria-controls` attributes. Screen readers won't know whether an FAQ item is open or closed, or which content panel it controls. This is a WCAG 4.1.2 violation (Name, Role, Value).
**Fix:**
```tsx
<button
  aria-expanded={openIdx === i}
  aria-controls={`faq-answer-${i}`}
  ...
>
<div id={`faq-answer-${i}`} role="region">
```

### WR-06: Comparison Table Uses `<div>` Grid Instead of Semantic `<table>`

**File:** `src/components/landing/ComparisonTable.tsx:31-60`
**Issue:** The comparison table is built with `div className="grid grid-cols-12"` instead of `<table>`. Screen readers cannot navigate it as a table, and the relationship between row headers and cell values is lost. This is a significant accessibility gap for a data-dense comparison.
**Fix:** Use a real `<table>` element with `<th scope="col">` and `<th scope="row">`. The mobile responsive layout in `layout.css` already handles table display, so the semantic markup would work with existing responsive CSS.

### WR-07: `appmock.tsx` Not Rendered — Dead Code

**File:** `src/components/landing/AppMock.tsx`
**Issue:** `AppMock` is not imported or used anywhere in the codebase (not in Landing.tsx, not in any other component). This is 141 lines of dead code that ships to production and increases bundle size.
**Fix:** Remove `AppMock.tsx` or confirm it's needed for future use.

### WR-08: `Reveal` Animation Not Gated Behind `prefers-reduced-motion`

**File:** `src/components/landing/Reveal.tsx`
**Issue:** While `tokens.css` has a `prefers-reduced-motion: reduce` media query that forces `animation-duration: 0.01ms`, the `Reveal` component uses Tailwind's `transition-all duration-700` class, not CSS `animation`. The global reduced-motion rule targets `animation-duration` and `transition-duration`, but `transition-all` applies many properties. The 700ms transition will be reduced to 0.01ms by the token rule, which is correct behavior — but only if the CSS specificity is high enough. The `!important` in tokens.css should override, so this is technically handled but fragile.
**Fix:** No immediate action needed, but consider using the `useReducedMotion` hook to skip the IntersectionObserver entirely for reduced-motion users.

### WR-09: `console.log` and `console.error` Left in Production Code

**File:** `src/components/landing/CheckoutModal.tsx:92-93, 241, 244, 248`, `src/components/landing/Pricing.tsx:39`
**Issue:** 6 console statements remain in production code. While not a security risk per se, `console.log('[MP SDK] Criando token do cartão...')` at line 241 logs that a card token is being created, and `console.error('[MP SDK] Erro ao criar token:', err)` at line 248 may log card-related error details. These should be removed or gated behind a debug flag.
**Fix:** Remove all `console.log` statements. For error tracking, use a proper error reporting service.

### WR-10: Landing Page Root Has Inline Style Bypassing CSS Classes

**File:** `src/pages/Landing.tsx:28`
**Issue:** The root `<div>` uses `style={{ background: 'linear-gradient(180deg, #050b12 0%, #03070d 100%)', color: 'var(--text)' }}` with hardcoded hex colors. The `landing.css` already defines `.landing-page` and `.landing-new` classes with the same gradient, but neither is applied here. This creates a maintenance risk (two sources of truth for the same gradient) and duplicates the hex colors that should use tokens.
**Fix:**
```tsx
<div className="min-h-screen landing-new" style={{ color: 'var(--text)' }}>
```

### WR-11: `tiny-action` Has `min-height: 32px` Below Touch Target Guideline

**File:** `src/styles/components.css:209`
**Issue:** `.tiny-action` has `min-height: 32px`, which is below the 44x44px WCAG touch target minimum. While these are intentionally smaller secondary actions, on mobile they may be difficult to tap. The mobile override in `layout.css:70` sets `min-height: 36px` which is still below 44px.
**Fix:** If these buttons appear on mobile, increase to at least 44px. If they're desktop-only, document this intent.

### WR-12: `CheckoutModal` Step State Doesn't Reset Auth State Properly

**File:** `src/components/landing/CheckoutModal.tsx:331-337`
**Issue:** `resetState()` resets all checkout-related state but doesn't clear `product`. If the modal is closed and reopened with a different product slug, the old product data may briefly flash before the new product loads. The `useEffect` at line 98-107 handles loading, but `product` retains stale data during the loading period.
**Fix:** Add `setProduct(null)` to `resetState()` or set it in the `useEffect` when `isOpen` changes.

---

## Info

### IN-01: Hardcoded `#07110a` Dark-on-Accent Color (10 Instances)

**File:** `src/styles/landing.css:70,115,245,247`, `src/styles/components.css:296,458`
**Issue:** The color `#07110a` is used as dark text on accent-colored backgrounds (badges, active tabs, step numbers). This should be a token like `--text-on-accent` for maintainability.
**Fix:** Add `--text-on-accent: #07110a;` to tokens.css and reference it.

### IN-02: Inline Styles Proliferation (100+ Instances)

**File:** All landing components
**Issue:** There are 100+ inline `style={{...}}` attributes across landing components, mostly for colors that should use CSS classes or Tailwind utilities. This makes the codebase harder to maintain and prevents CSS-level theming.
**Fix:** Create utility classes in `landing.css` for common patterns: `.text-muted`, `.text-accent`, `.border-subtle`, `.bg-card-subtle`.

### IN-03: Footer Copyright Year Is 2025

**File:** `src/components/landing/Footer.tsx:64`
**Issue:** `© 2025 Lovable Ultra Chat` — should be 2026 or use dynamic year.
**Fix:** `© {new Date().getFullYear()} Lovable Ultra Chat`

### IN-04: Testimonial Stars Use Unicode Character, Not Accessible Rating

**File:** `src/components/landing/Testimonials.tsx:52-55`
**Issue:** Stars are rendered as `<span className="text-base">★</span>` repeated 5 times with no `aria-label` or semantic rating markup. Screen readers will read "star star star star star" or skip them entirely.
**Fix:** Add `aria-label="5 de 5 estrelas"` to the stars container.

### IN-05: `Pricing` Component Fetches All Plans Without Limit

**File:** `src/components/landing/Pricing.tsx:30-34`
**Issue:** The Supabase query uses `.select('*')` without column selection. This fetches all columns from `products_endcustomer`, including fields not displayed. Should use `.select('id, name, slug, description, days, price_cents, devices, has_priority_support, is_featured, sort_order')`.

### IN-06: Missing `<label>` Association for Card Inputs

**File:** `src/components/landing/CheckoutModal.tsx:492-496`
**Issue:** Card number, name, expiry, and CVV inputs use `<label><span>Número do cartão</span><input ...>` which visually works but the `<span>` inside `<label>` doesn't use `htmlFor`/`id` pairing. The label wrapping is correct for click targeting, but adding `id` attributes would improve programmatic association.

### IN-07: Hero Section Uses `id="top"` But Link Uses `href="#top"`

**File:** `src/components/landing/Hero.tsx:12`
**Issue:** Hero has `id="top"` but Navbar and Footer link to `#top`. This works, but the scroll-to-top behavior relies on browser native smooth scrolling (set in `base.css:2`). If smooth scrolling is disabled by `prefers-reduced-motion`, clicking "Lovable Ultra Chat" in the nav won't scroll to top smoothly.

### IN-08: `CheckoutModal` Polling Never Cleans Up on Unmount

**File:** `src/components/landing/CheckoutModal.tsx:300-318`
**Issue:** `startPolling` creates a `setInterval` that runs up to 120 times (10 minutes). If the modal is closed during polling, the interval continues running because there's no cleanup in the `useEffect` return. The `handleClose` function doesn't clear the interval.
**Fix:** Store the interval ID in a ref and clear it in the cleanup function of the `useEffect` at line 98.

---

## Positive Findings

1. **Token system is unified** — `--brand-green` is completely eliminated from all CSS files. The `--accent` and `--gradient-brand` tokens are consistently used across all stylesheets.

2. **Button standardization is complete** — All CTAs now use `primary-action` class with `var(--gradient-brand)`, white text, 12px radius, and 44px min-height. The visual inconsistency from the previous audit is resolved.

3. **CheckoutModal has strong ARIA** — `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Escape handling, and `role="radiogroup"` for payment methods. This is well-implemented.

4. **`prefers-reduced-motion` is respected** — The global token override at `tokens.css:61-67` correctly disables all animations for users who prefer reduced motion.

5. **Light mode tokens exist** — `tokens.css` defines a complete light mode palette via `@media (prefers-color-scheme: light)`, showing forward-thinking theming.

6. **`Reveal` component is performant** — Uses IntersectionObserver with `threshold: 0.1` and unobserves after intersection, avoiding unnecessary re-renders.

7. **Images use `loading="lazy"`** — Both Hero images have lazy loading, preventing unnecessary eager loading below the fold.

8. **Form validation is present** — CheckoutModal validates CPF (11 digits), WhatsApp (10-13 digits), and required fields before submission.

9. **Responsive breakpoints are consistent** — The use of `clamp()` for typography and spacing, plus `sm:`, `md:`, `lg:` Tailwind prefixes, provides smooth responsive transitions.

10. **No `!important` overuse in landing CSS** — The `!important` declarations are confined to `layout.css` mobile overrides and `tokens.css` reduced-motion, both justified use cases.

---

## Recommended Actions

| Priority | Action | Effort | Impact |
|---|---|---|---|
| P0 | Extract MercadoPago key to env var | 30 min | Security hygiene |
| P0 | Replace `<a>` + `preventDefault` with `<Link>` | 1 hr | Correct semantics |
| P1 | Add `:focus-visible` styles globally | 30 min | Keyboard accessibility |
| P1 | Add `aria-expanded`/`aria-controls` to FAQ | 30 min | Screen reader UX |
| P1 | Convert ComparisonTable to semantic `<table>` | 1 hr | Table accessibility |
| P1 | Add `<nav>` wrapper to mobile menu | 15 min | Landmark navigation |
| P2 | Extract inline rgba(157,255,47) to utility classes | 2 hr | Theme maintenance |
| P2 | Remove AppMock.tsx (dead code) | 5 min | Bundle size |
| P2 | Remove console.log statements | 15 min | Production cleanliness |
| P3 | Add `--text-on-accent` token | 15 min | Token completeness |
| P3 | Fix footer copyright year | 5 min | Polish |
| P3 | Add `aria-label` to testimonial stars | 10 min | A11y completeness |

---

_Reviewed: 2026-07-04T15:50:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
