---
phase: 01-landing-page-mobile-responsiveness
reviewed: 2026-07-04T12:00:00Z
depth: deep
files_reviewed: 20
files_reviewed_list:
  - src/components/landing/Hero.tsx
  - src/components/landing/Navbar.tsx
  - src/components/landing/Pricing.tsx
  - src/components/landing/ComparisonTable.tsx
  - src/components/landing/FAQ.tsx
  - src/components/landing/Footer.tsx
  - src/components/landing/Features.tsx
  - src/components/landing/FinalCTA.tsx
  - src/components/landing/PromoBar.tsx
  - src/components/landing/Steps.tsx
  - src/components/landing/Testimonials.tsx
  - src/components/landing/WhatsAppFAB.tsx
  - src/components/landing/PainPoints.tsx
  - src/components/landing/Reveal.tsx
  - src/components/landing/CheckoutModal.tsx
  - src/styles/landing.css
  - src/styles/layout.css
  - src/styles/components.css
  - src/styles/tokens.css
  - src/styles/base.css
findings:
  critical: 1
  warning: 5
  info: 2
  total: 8
status: issues_found
---

# Phase 1: Landing Page Mobile Responsiveness — Code Review Report

**Reviewed:** 2026-07-04T12:00:00Z
**Depth:** deep
**Files Reviewed:** 20
**Status:** issues_found

## Summary

The landing page has a **dual CSS system**: many components use Tailwind utility classes in TSX files while `landing.css` defines parallel CSS classes that are never applied. This creates a large body of dead CSS and causes one critical mobile issue where the comparison table is unusable on phones.

The **comparison table** uses `overflow-hidden` (Tailwind) instead of `overflow-x: auto`, clipping its 3-column content on mobile with no way to scroll. The table becomes unreadable below ~400px viewport width.

Most other sections are well-handled via Tailwind responsive utilities (`flex-col` → `sm:flex-row`, `grid-cols-1` → `md:grid-cols-3`, `clamp()` values, `min-height: 44px` on buttons). The navbar hamburger works correctly with proper 44px touch targets. FAQ accordion functions on mobile. Pricing cards stack to single column. Footer columns stack to 2-col on mobile.

Key architectural concern: `landing.css` defines ~150 lines of responsive rules for classes (`.hero-section`, `.steps-grid`, `.problem-cards`, `.features-grid-new`, `.faq-list`, `.testimonials-grid`, `.final-cta-card`, `.footer-inner-new`) that are **never used** by any TSX component. These are dead code — the actual responsive behavior comes from Tailwind classes in the components.

## Critical Issues

### CR-01: Comparison Table Unusable on Mobile — Content Clipped Without Scroll

**File:** `src/components/landing/ComparisonTable.tsx:30`
**Cross-reference:** `src/styles/layout.css:46-52`

**Issue:** The comparison table wrapper uses Tailwind `overflow-hidden` which clips the 3-column table content on mobile viewports. The mobile-responsive scroll behavior defined in `layout.css` for `.comparison-table-wrap` and `.comparison-table` CSS classes never applies because `ComparisonTable.tsx` doesn't use those class names — it uses only Tailwind utilities.

On a 320px phone: container width = 320px - 32px padding = 288px. The table needs ~300px minimum for 3 columns with padding. The table content is silently clipped, making the comparison feature completely broken on mobile — users cannot read feature labels or see the check/cross indicators.

**Fix:** Replace `overflow-hidden` with `overflow-x: auto` on the wrapper div, or add the `comparison-table-wrap` CSS class:

```tsx
// ComparisonTable.tsx line 30 — BEFORE:
<div className="mt-10 overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>

// AFTER — Option A (Tailwind):
<div className="mt-10 overflow-x-auto rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>

// AFTER — Option B (use existing CSS class + add min-width):
<div className="comparison-table-wrap mt-10 rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
```

Also add `min-width: 40rem` to the `<table>` to ensure it doesn't compress:

```tsx
// ComparisonTable.tsx line 31 — add min-width via style or class:
<table className="comparison-table w-full text-sm" style={{ borderCollapse: 'collapse' }}>
```

## Warnings

### WR-01: WhatsApp FAB Overlaps Bottom Content on Mobile

**File:** `src/components/landing/WhatsAppFAB.tsx:9-38`

**Issue:** The WhatsApp floating action button includes a visible text label ("Falar com o Suporte") below the icon, making the total element ~100px+ tall. Positioned at `fixed bottom-6 right-6`, it overlaps with the FinalCTA section's buttons on mobile. When users try to tap the "Liberar poder ilimitado" or "Testar grátis" CTAs at the bottom of the page, the FAB intercepts the tap.

On iPhones with home indicator (safe area ~34px), `bottom-6` (24px) means the FAB sits just above the home bar, and its text label extends upward into the content area.

**Fix:** Hide the text label on mobile and show only the icon circle:

```tsx
// WhatsAppFAB.tsx — hide label text on small screens:
<span
  className="hidden sm:block" // Add this class
  style={{
    fontSize: '11px',
    // ... rest of styles
  }}
>
  Falar com o Suporte
</span>
```

Or reduce `bottom-6` to `bottom-4` on mobile and ensure the FAB doesn't exceed 56px total height.

### WR-02: Footer Links Have Insufficient Touch Target Size

**File:** `src/components/landing/Footer.tsx:47-55`

**Issue:** Footer links are plain `<a>` tags styled at `text-sm` (14px) with `space-y-2.5` (10px) vertical spacing between items. The actual tap area for each link is only the text height (~20px) plus some padding, well below the 44px minimum recommended by WCAG and Apple HIG. On mobile, users trying to tap "Funcionalidades" or "Planos e Preços" in the footer may accidentally tap adjacent links.

**Fix:** Add padding to each footer link to create adequate touch targets:

```tsx
// Footer.tsx line 51 — BEFORE:
<a href={l.href} className="text-sm transition hover:opacity-80" ...>

// AFTER:
<a href={l.href} className="block py-2 text-sm transition hover:opacity-80" ...>
```

Or increase the `space-y-2.5` to `space-y-3` and add vertical padding to the `<li>` elements.

### WR-03: Dead CSS — Responsive Rules in landing.css Never Apply

**File:** `src/styles/landing.css:28-197`

**Issue:** Multiple responsive CSS class definitions in `landing.css` are never used by any TSX component. These are orphaned from a prior implementation approach (likely the original CSS-based landing page). The dead classes include:

| CSS Class | Defined at line | Used in TSX? |
|-----------|----------------|--------------|
| `.hero-section` | 28-29 | ❌ Hero.tsx uses Tailwind |
| `.hero-container` | 30 | ❌ |
| `.hero-badge` | 31 | ❌ |
| `.hero-title` | 33 | ❌ |
| `.hero-subtitle` | 35 | ❌ |
| `.hero-cta-group` | 36-37 | ❌ |
| `.hero-stats` | 38 | ❌ |
| `.hero-visual` | 42-43 | ❌ |
| `.hero-mockup-window` | 44 | ❌ |
| `.steps-grid` | 66-67 | ❌ Steps.tsx uses Tailwind |
| `.problem-cards` | 77-78 | ❌ PainPoints.tsx uses Tailwind |
| `.features-grid-new` | 89-91 | ❌ Features.tsx uses Tailwind |
| `.testimonials-grid` | 138-139 | ❌ Testimonials.tsx uses Tailwind |
| `.faq-list` | 157 | ❌ FAQ.tsx uses Tailwind |
| `.faq-item` | 158 | ❌ |
| `.faq-question` | 161 | ❌ |
| `.faq-answer` | 164 | ❌ |
| `.final-cta-card` | 168 | ❌ FinalCTA.tsx uses Tailwind |
| `.footer-inner-new` | 176 | ❌ Footer.tsx uses Tailwind |
| `.problem-desc` | 76 | ❌ |
| `.section-heading` | 65 | ❌ |
| `.section-label` | 87 | ❌ |
| `.section-desc` | 88 | ❌ |

This is ~120 lines of dead CSS. The live pricing-related classes (`.pricing-grid-new`, `.pricing-card-new`, `.pricing-btn`, etc.) ARE actively used and their responsive rules are critical.

**Fix:** Remove the dead CSS classes from `landing.css` to prevent confusion and reduce maintenance surface. Keep only the classes actually referenced in TSX files (pricing classes, utility classes like `.text-gradient-brand`, `.bg-gradient-brand`, `.bg-hero-radial`, `.shimmer-band`, `.border-glow`, and the user dashboard classes).

### WR-04: Hero Mockup Pushes CTAs Below Fold on Small Mobile

**File:** `src/components/landing/Hero.tsx:86-94`

**Issue:** The hero mockup image (`w-4/5 max-w-xs`) is displayed on all viewport sizes — it is not hidden on mobile. Combined with `py-16` (64px top/bottom padding) and `gap-12` (48px gap between text and image), the total vertical space on a 667px iPhone 8 is:

- Top padding: 64px
- Badge + title + subtitle + CTAs: ~350px
- Gap: 48px
- Image: ~200px (at w-4/5 of 320px ≈ 256px wide, aspect not set but natural size)

Total: ~662px — the CTA buttons ("Liberar poder ilimitado") land right at the fold boundary. On smaller phones (iPhone SE at 568px), the primary CTA is completely below the fold with no visual cue to scroll.

**Fix:** This is a design trade-off. If the goal is to get users to the CTA above the fold on mobile, consider:

```tsx
// Hero.tsx line 86 — hide mockup on very small screens:
<div className="relative hidden sm:flex items-center justify-center">
```

Or reduce the gap on mobile:

```tsx
// Hero.tsx line 13 — change gap-12 to a responsive value:
gap-8 sm:gap-12
```

### WR-05: Pricing Features Text Below 14px Minimum on Very Small Viewports

**File:** `src/styles/landing.css:125`

**Issue:** `.pricing-features-new li` uses `font-size: clamp(0.8125rem, 2.5vw, 0.875rem)`. At a 320px viewport width, `2.5vw` = 8px, so the clamp resolves to the minimum: `0.8125rem` = 13px. This is below the 14px minimum recommended for body text readability on mobile.

The same pattern appears in several other classes:
- `.mockup-label` (line 51): `clamp(0.75rem, 2vw, 0.8125rem)` → 12px minimum
- `.mockup-section-title` (line 55): `clamp(0.625rem, 1.5vw, 0.6875rem)` → 10px minimum
- `.mockup-tags span` (line 57): `clamp(0.625rem, 1.5vw, 0.6875rem)` → 10px minimum

While the mockup classes are inside a decorative mockup window (dead CSS path), the pricing features list IS live and renders real content.

**Fix:** Increase the minimum clamp value:

```css
/* landing.css line 125 — BEFORE: */
.pricing-features-new li { font-size: clamp(0.8125rem, 2.5vw, 0.875rem); }

/* AFTER: */
.pricing-features-new li { font-size: clamp(0.875rem, 2.5vw, 0.875rem); }
```

## Info

### IN-01: Console.log Debug Artifacts in CheckoutModal

**File:** `src/components/landing/CheckoutModal.tsx:92,93,241,244,248`

**Issue:** Multiple `console.log` and `console.error` statements are present in production code:
- Line 92: `console.log('[MP SDK] Script carregado')`
- Line 93: `console.error('[MP SDK] Erro ao carregar script')`
- Line 241: `console.log('[MP SDK] Criando token do cartão...')`
- Line 244: `console.log('[MP SDK] Token criado com sucesso')`
- Line 248: `console.error('[MP SDK] Erro ao criar token:', err)`

These leak implementation details (SDK loading, token creation flow) to the browser console, which is visible to any user.

**Fix:** Remove debug logs or wrap them in a development-only check:

```tsx
// Replace console.log with conditional logging:
if (import.meta.env.DEV) console.log('[MP SDK] Script carregado')
```

### IN-02: Navbar Mobile Menu Lacks Close-on-Outside-Click

**File:** `src/components/landing/Navbar.tsx:87-121`

**Issue:** The mobile hamburger menu opens/closes only via the hamburger button toggle. There is no close-on-outside-click behavior — tapping outside the menu (e.g., on the page content) does not close it. Users must tap the X button to dismiss. This is a common mobile UX expectation.

The menu is conditionally rendered (`{open && ...}`), not animated, so there's also no transition when it appears/disappears.

**Fix:** Add a click-outside handler or overlay:

```tsx
// Navbar.tsx — add overlay behind menu when open:
{open && (
  <>
    <div className="fixed inset-0 z-30 md:hidden" onClick={() => setOpen(false)} />
    <div className="border-t border-white/5 md:hidden relative z-40" ...>
      {/* ... menu content ... */}
    </div>
  </>
)}
```

---

## Responsive Architecture Summary

| Section | Mobile Approach | Status |
|---------|----------------|--------|
| **Navbar** | Hamburger with toggle, 44px touch target | ✅ Working |
| **PromoBar** | Flex-wrap, text wraps naturally | ✅ Working |
| **Hero** | Tailwind grid-cols-1, flex-col CTAs | ✅ Working (CTA near fold) |
| **PainPoints** | Grid 1-col, Tailwind responsive | ✅ Working |
| **Steps** | Grid 1-col → md:3-col | ✅ Working |
| **Features** | Grid 1-col → md:2-col → lg:3-col | ✅ Working |
| **Pricing** | CSS grid 1-col → 48rem multi-col | ✅ Working |
| **ComparisonTable** | **overflow-hidden clips content** | ❌ **BLOCKED** |
| **Testimonials** | Grid 1-col → md:2-col → lg:3-col | ✅ Working |
| **FAQ** | Accordion with state toggle | ✅ Working |
| **FinalCTA** | Flex-col → sm:flex-row | ✅ Working |
| **Footer** | Grid 2-col, columns stack | ✅ Working (touch targets small) |
| **WhatsAppFAB** | Fixed bottom-right, 56px icon | ⚠️ Label overlaps content |
| **CheckoutModal** | Portal, scroll-locked body | ✅ Working (tight on 320px) |

---

_Reviewed: 2026-07-04T12:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
