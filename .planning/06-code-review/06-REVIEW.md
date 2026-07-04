---
phase: 06-code-review
reviewed: 2026-07-04T14:30:00Z
depth: deep
files_reviewed: 22
files_reviewed_list:
  - src/styles/components.css
  - src/styles/base.css
  - src/styles/tokens.css
  - src/styles/landing.css
  - src/components/ui/button.tsx
  - src/components/ThemeCustomizer.tsx
  - src/components/ConfirmationDialog.tsx
  - src/components/TemplateManager.tsx
  - src/components/AdminTopbar.tsx
  - src/components/landing/Pricing.tsx
  - src/components/landing/Hero.tsx
  - src/components/landing/FinalCTA.tsx
  - src/components/landing/Navbar.tsx
  - src/components/landing/CheckoutModal.tsx
  - src/components/landing/AppMock.tsx
  - src/pages/Checkout.tsx
  - src/pages/Login.tsx
  - src/pages/Profile.tsx
  - src/pages/admin/Dashboard.tsx
  - src/pages/admin/CustomerPurchases.tsx
  - src/pages/admin/Sales.tsx
  - src/pages/reseller/Dashboard.tsx
findings:
  critical: 0
  warning: 8
  info: 4
  total: 12
status: issues_found
---

# Phase 6: Code Review Report — Button Style Inconsistencies

**Reviewed:** 2026-07-04T14:30:00Z
**Depth:** deep
**Files Reviewed:** 22
**Status:** issues_found

## Summary

This review analyzes all button styles across the project and reveals significant inconsistencies between the CSS-defined button system (`.primary-action`, `.ghost-action`, etc.) and the inline Tailwind/button patterns used in landing page components. The core issues are: two different gradients with different endpoints, text color mismatch (black vs white) on primary buttons, inconsistent border-radius values, a phantom `.compact` CSS class that is never defined, and duplicate color token systems (`landing.css` re-declares tokens already in `tokens.css`).

---

## Warnings

### WR-01: Two Different Green Gradients on Primary Buttons

**File:** `src/styles/components.css:172` and `src/styles/landing.css:199`
**Issue:** The project has TWO different green-to-X gradients that both serve as "primary brand" backgrounds, applied to different button contexts:

- `.primary-action` (CSS, used by `<Button>` component): `linear-gradient(135deg, #9dff2f, #b7ff7a)` — green → lighter green
- `.bg-gradient-brand` (Tailwind utility, used by landing page CTAs): `linear-gradient(135deg, #9dff2f, #6de8ff)` — green → cyan

This means a user who sees a landing page CTA (green→cyan gradient, white text) and then logs in and sees the admin panel primary button (green→lighter-green gradient, dark text) will experience a visually jarring inconsistency. These are two different visual identities for the same "brand green" action.

**Fix:** Standardize on ONE gradient direction. Recommended: use `bg-gradient-brand` (green→cyan) everywhere, or define a single CSS custom property for the primary action gradient:

```css
/* tokens.css */
--btn-primary-gradient: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);

/* components.css */
.primary-action {
  background: var(--btn-primary-gradient);
}
```

---

### WR-02: Text Color Mismatch — Dark vs White on Primary-Style Buttons

**File:** `src/styles/components.css:173` vs `src/components/landing/*.tsx` (multiple files)
**Issue:** `.primary-action` uses `color: #07110a` (near-black text), but ALL landing page gradient buttons use `text-white`. This creates two visually distinct "primary button" families:

| Context | Background | Text Color |
|---------|-----------|------------|
| CSS `.primary-action` | green→green gradient | `#07110a` (near-black) |
| Landing `bg-gradient-brand` buttons | green→cyan gradient | `white` |
| ThemeCustomizer preview "Botão" | solid `var(--accent)` | `#000` (black) |

The near-black text on the CSS gradient is hard to read at small sizes, while white on the cyan-leaning gradient has better contrast. Users experience different "primary button" identities across admin, user, and landing sections.

**Fix:** Standardize text color on gradient backgrounds. If the gradient goes green→cyan, white text is better for contrast. If green→lighter-green, dark text is acceptable. Pick one:

```css
/* Option A: keep dark text (only if gradient stays green-to-green) */
.primary-action { color: #07110a; }

/* Option B: switch to white text and unify gradient */
.primary-action {
  background: linear-gradient(135deg, var(--accent), var(--brand-cyan));
  color: white;
}
```

---

### WR-03: `.tiny-action` Has Different Border-Radius Than Other Variants

**File:** `src/styles/components.css:213`
**Issue:** `.tiny-action` uses `border-radius: 10px` while `.primary-action`, `.ghost-action`, and `.danger-action` all use `border-radius: 12px` (set in the shared rule at line 163). The 2px difference is subtle but creates inconsistency within the same button family. For example, a "Copiar" button (tiny) next to a "Renovar" button (tiny) vs a "Gerenciar" button (tiny) all have the same 10px, but mixing tiny and non-tiny in a row creates different corner radii.

**Fix:** Align `.tiny-action` to use the same `border-radius` as the rest:

```css
.tiny-action {
  border-radius: 12px; /* was 10px */
}
```

Or, if the smaller radius is intentional for compactness, document it as a deliberate design choice and ensure no tiny buttons appear adjacent to non-tiny buttons.

---

### WR-04: `.compact` Class Used but Never Defined in CSS

**File:** `src/pages/admin/CustomerPurchases.tsx:258`, `src/pages/admin/Sales.tsx:207`
**Issue:** Both files use `className="primary-action compact"`, but no CSS file defines `.compact`. This class does nothing — it's a dead reference. This likely means the developer intended a smaller button variant (similar to `.tiny-action` behavior on a full-size primary button) but the CSS was never implemented.

**Fix:** Either define `.compact` in `components.css`:

```css
.primary-action.compact {
  min-height: 36px;
  padding: 0 16px;
  font-size: 13px;
}
```

Or remove the dead class reference:

```tsx
// Before
<button className="primary-action compact" ...>
// After
<button className="primary-action" ...>
```

---

### WR-05: Pricing CTA Button Completely Bypasses Button System

**File:** `src/components/landing/Pricing.tsx:164-176`
**Issue:** The pricing "Comprar agora" button uses a raw `<button>` element with inline styles that define its own background (`rgba(14, 19, 32, 0.9)` — dark solid), border, and box-shadow. It does not use `.primary-action`, `.ghost-action`, or any class from the button system. This button is:
- Solid dark background (not gradient)
- White text
- `rounded-full` (border-radius: 9999px)
- Dynamic accent-colored border based on plan tier (`${accentColor}66`)

This creates a third visual identity for CTA buttons, distinct from both the CSS `.primary-action` and the landing `bg-gradient-brand` buttons.

**Fix:** Standardize pricing CTA to use the same gradient system:

```tsx
<button
  className="pricing-btn inline-flex w-full items-center justify-center rounded-full bg-gradient-brand px-6 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-white transition-all cursor-pointer"
>
```

Or if the dark solid look is intentional, extract it to a CSS class rather than inline styles.

---

### WR-06: ConfirmationDialog Uses Hardcoded Tailwind Slate Colors, Not Design Tokens

**File:** `src/components/ConfirmationDialog.tsx:82-97`
**Issue:** The `ConfirmationDialog` modal uses hardcoded Tailwind classes and inline styles with specific hex values: `bg-slate-900` (#0f172a), `border-slate-700` (#334155), `text-slate-300` (#cbd5e1). Every other modal in the app (admin modals, checkout modal, reseller modal) uses CSS classes with design tokens (`var(--line)`, `var(--card-strong)`, etc.) defined in `components.css`. This means the ConfirmationDialog visually differs from other modals — different background tone, different border color, different shadow.

Additionally, the ConfirmationDialog defines both Tailwind classes AND inline styles with the same values (redundant), and uses `borderRadius: '0.5rem'` (8px) while all other modals use `border-radius: 24px`.

**Fix:** Refactor to use existing modal CSS classes:

```tsx
<div className="modal-content" role="dialog">
  <div className="modal-close" onClick={onCancel}>×</div>
  <h2>{title}</h2>
  <p>{message}</p>
  {children}
  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
    <Button variant="outline" onClick={onCancel}>{cancelText}</Button>
    <Button variant={isDangerous ? 'destructive' : 'default'} onClick={onConfirm}>{confirmText}</Button>
  </div>
</div>
```

---

### WR-07: Duplicate Color Token Systems Between `tokens.css` and `landing.css`

**File:** `src/styles/tokens.css:14-19` and `src/styles/landing.css:183-187`
**Issue:** `landing.css` re-declares three CSS custom properties that already exist in `tokens.css`:

| Property | `tokens.css` | `landing.css` |
|----------|-------------|---------------|
| Green | `--accent: #9dff2f` | `--brand-green: #9dff2f` |
| Cyan | `--cyan: #6de8ff` | `--brand-cyan: #6de8ff` |
| Deep Green | `--accent-2: #62d11f` | `--brand-accent-deep: #62d11f` |

This means any landing component can use EITHER `var(--accent)` or `var(--brand-green)` for the same color, creating confusion about which to use. If someone changes `--accent` in `tokens.css`, the landing components using `--brand-green` won't update. Some files already mix both — `CheckoutModal.tsx` uses both `var(--accent)` and `var(--brand-green)`.

**Fix:** Remove the duplicate declarations from `landing.css` and standardize on the canonical token names in `tokens.css`. Update all landing references from `--brand-green` → `--accent`, `--brand-cyan` → `--cyan`, `--brand-accent-deep` → `accent-2`:

```css
/* landing.css — REMOVE these lines: */
:root {
  --brand-green: #9dff2f;
  --brand-cyan: #6de8ff;
  --brand-accent-deep: #62d11f;
}
```

```tsx
// Then update all references, e.g.:
// Before: style={{ color: 'var(--brand-green)' }}
// After:  style={{ color: 'var(--accent)' }}
```

---

### WR-08: Checkout.tsx Uses Teal Background Color Mismatched with Green Border

**File:** `src/pages/Checkout.tsx:354, 362`
**Issue:** The payment method toggle buttons in `Checkout.tsx` use `bg-[rgba(45,212,191,0.1)]` for the selected background — this is **teal** (#2DD4BF), not the brand green (#9dff2F). But the border is set to `border-[var(--brand-green)]` which IS the brand green. The same pattern exists in `CheckoutModal.tsx:467,470`. This creates a mismatch where the background is teal but the border is lime green.

The `CheckoutModal.tsx` uses `rgba(157, 255, 47, 0.08)` for info boxes (brand green) but `rgba(109, 232, 255, 0.08)` for other elements (cyan) — mixing tones without consistency.

**Fix:** Use brand green consistently for selected state backgrounds:

```tsx
// Before
className={`${... ? 'border-[var(--brand-green)] bg-[rgba(45,212,191,0.1)]' : '...'}`}

// After
className={`${... ? 'border-[var(--accent)] bg-[rgba(157,255,47,0.1)]' : '...'}`}
```

---

## Info

### IN-01: Three Different Green Gradients in the Codebase

**File:** `src/styles/components.css:172`, `src/styles/components.css:458`, `src/styles/landing.css:199`
**Issue:** The project defines three distinct green gradients:

1. `.primary-action`: `linear-gradient(135deg, #9dff2f, #b7ff7a)` — green → lighter green
2. `.brand-bolt`: `linear-gradient(135deg, var(--accent), var(--accent-2))` = `linear-gradient(135deg, #9dff2f, #62d11f)` — green → deeper green
3. `.bg-gradient-brand`: `linear-gradient(135deg, #9dff2f, #6de8ff)` — green → cyan

**Fix:** Consolidate to one primary gradient. The cyan-leaning gradient (used on all landing CTAs) is likely the intended brand identity. Unify all three to use it.

---

### IN-02: ThemeCustomizer Preview Uses 8px Border-Radius for Buttons

**File:** `src/components/ThemeCustomizer.tsx:122-125`
**Issue:** The preview button spans use `borderRadius: '8px'`, while the actual button system uses `12px` (for standard buttons) and `10px` (for tiny buttons). This means the ThemeCustomizer preview does not accurately represent what buttons look like in the actual app.

**Fix:** Update preview spans to match actual button radius:

```tsx
<span style={{ padding: '6px 14px', borderRadius: '12px', ... }}>Botão</span>
```

---

### IN-03: Navbar CTA Buttons Have No Minimum Height

**File:** `src/components/landing/Navbar.tsx:55, 69, 106, 114`
**Issue:** Navbar CTA buttons use `py-2` (8px vertical padding) with no `min-height`, resulting in ~38px tall buttons. Landing Hero/FinalCTA buttons use `h-14` (56px), and `.primary-action` uses `min-height: 44px`. The navbar CTAs are the smallest primary-looking buttons in the project, which may cause accessibility issues on mobile (below the 44px touch target guideline).

**Fix:** Consider adding `min-h-11` (44px) to navbar CTA buttons for accessibility compliance.

---

### IN-04: Pricing "Comprar Agora" Button Border Color Uses Dynamic Per-Plan Tones

**File:** `src/components/landing/Pricing.tsx:171, 90`
**Issue:** Each pricing card's CTA button gets a different accent color border from the `planTone()` array: `['#12b5ff', '#14e6b8', '#ff5ea8', '#7c5aff', '#6de8ff']`. These include blues, pinks, and purples that don't match the green brand identity used everywhere else. While this may be intentional for visual variety, it means pricing CTA buttons look completely different from all other buttons in the app.

**Fix:** No fix needed if this is an intentional design choice for pricing differentiation. If consistency is desired, use the brand green for all CTA buttons and reserve multi-color for non-interactive elements.

---

## Recommended Standardization (Canonical Values)

| Property | Recommended Value | Rationale |
|----------|------------------|-----------|
| **Primary gradient** | `linear-gradient(135deg, #9dff2f, #6de8ff)` | Matches landing brand identity (green→cyan) |
| **Primary text color** | `white` | Better contrast on gradient background |
| **Border-radius (standard)** | `12px` | Already used by 3 of 4 variants |
| **Border-radius (tiny)** | `12px` | Align with standard buttons |
| **Border-radius (CTA/fab)** | `rounded-full` (9999px) | For prominent call-to-action only |
| **Min-height (standard)** | `44px` | WCAG touch target minimum |
| **Font size (standard)** | `14px` | Current default |
| **Design tokens** | Use `tokens.css` only | Remove `landing.css` duplicates |

---

## Files Requiring Changes

| File | Lines | Change Needed |
|------|-------|---------------|
| `src/styles/components.css` | 172, 213 | Unify gradient; fix tiny-action radius |
| `src/styles/landing.css` | 183-187 | Remove duplicate token declarations |
| `src/pages/admin/CustomerPurchases.tsx` | 258 | Remove dead `.compact` class |
| `src/pages/admin/Sales.tsx` | 207 | Remove dead `.compact` class |
| `src/components/landing/Pricing.tsx` | 164-176 | Standardize CTA button style |
| `src/components/ConfirmationDialog.tsx` | 82-97 | Use design tokens instead of hardcoded slate colors |
| `src/components/ThemeCustomizer.tsx` | 122-125 | Fix preview border-radius |
| `src/pages/Checkout.tsx` | 354, 362 | Fix teal/green mismatch |
| `src/components/landing/CheckoutModal.tsx` | 467, 470 | Fix teal/green mismatch |
| `src/components/landing/*.tsx` | multiple | Migrate `var(--brand-green)` → `var(--accent)` |

---

_Reviewed: 2026-07-04T14:30:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
