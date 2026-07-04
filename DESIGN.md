---
name: Ultra Chat Panel
description: Bold, energetic dark-mode SaaS for managing AI extension licenses with electric green accent
colors:
  primary: "#9dff2f"
  primary-deep: "#62d11f"
  primary-glow: "rgba(157, 255, 47, 0.28)"
  primary-subtle: "rgba(157, 255, 47, 0.12)"
  cyan: "#6de8ff"
  danger: "#ff3d55"
  warning: "#f5b83d"
  neutral-bg: "#050b12"
  neutral-bg-soft: "#07111c"
  neutral-surface: "rgba(13, 27, 40, 0.78)"
  neutral-surface-strong: "rgba(17, 33, 48, 0.94)"
  neutral-border: "rgba(137, 180, 209, 0.18)"
  neutral-border-hot: "rgba(159, 255, 47, 0.42)"
  text-primary: "#f4fbff"
  text-muted: "#b0c8db"
  text-muted-2: "#5f7688"
typography:
  body:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  display:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(1.75rem, 7vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(1.5rem, 5vw, 2.625rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  label:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#07110a"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "#07110a"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-strong:
    backgroundColor: "{colors.neutral-surface-strong}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "rgba(255, 255, 255, 0.05)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
---

# Design System: Ultra Chat Panel

## 1. Overview

**Creative North Star: "The Power Grid"**

This is a control room aesthetic — dark surfaces that feel like active monitors, an electric green accent that pulses through every interactive element, and a visual density that communicates performance without clutter. The system rejects bland admin templates and CRM-style dashboards. Every screen should feel like it's running on hardware, not rendered in a browser.

The palette is deliberately minimal: near-black backgrounds (#050b12), one dominant accent (#9dff2f) that carries brand identity, and supporting neutrals that recede. Depth comes from glass effects on navigation and sidebar, tonal layering on cards, and glow treatments on primary actions — not from heavy shadows or decorative elements.

**Key Characteristics:**
- Dark-first with electric green accent energy (#9dff2f)
- Glass effects on structural navigation, solid surfaces on content
- Glow and pulse treatments for interactive states
- Mobile-first responsive with desktop-complete admin flows
- System status communicated through color, not icons

## 2. Colors

A near-black base with a single dominant neon accent. The accent is the brand; everything else serves it.

### Primary
- **Electric Lime** (#9dff2f): The brand's life force. Used on primary CTAs, active states, brand marks, progress indicators, and status highlights. Appears on ≤15% of any screen — its rarity is the point.
- **Deep Lime** (#62d11f): Hover/active variant of the primary. Darker for depth interaction.
- **Lime Glow** (rgba(157, 255, 47, 0.28)): Background glow on hover, focus rings, card highlights. Never as text background.
- **Lime Subtle** (rgba(157, 255, 47, 0.12)): Tinted backgrounds for badges, tags, and accent containers.

### Secondary
- **Cyan** (#6de8ff): Supporting accent for data visualization, secondary highlights, and hero gradient. Used sparingly — never competes with Electric Lime.

### Tertiary
- **Danger** (#ff3d55): Error states, destructive actions, critical alerts.
- **Warning** (#f5b83d): Caution states, pending actions, attention needed.

### Neutral
- **Void** (#050b12): Primary background. Near-black with blue undertone.
- **Deep** (#07111c): Soft background for secondary surfaces, sidebar.
- **Surface** (rgba(13, 27, 40, 0.78)): Card backgrounds, glass panels. Semi-transparent for depth.
- **Surface Strong** (rgba(17, 33, 48, 0.94)): Elevated cards, modals, popovers. Higher opacity.
- **Border** (rgba(137, 180, 209, 0.18)): Subtle dividers, card borders, table lines.
- **Border Hot** (rgba(159, 255, 47, 0.42)): Active borders, focused inputs, selected states.

### Named Rules
**The Accent Scarcity Rule.** Electric Lime appears on ≤15% of any given screen. Its power comes from concentration, not distribution. If everything is green, nothing is.

**The Glow-Only-on-Action Rule.** Glow effects (box-shadow with accent) appear only on interactive states (hover, focus, active). Static elements never glow — that's decoration, not feedback.

## 3. Typography

**Display Font:** System sans-serif stack (ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI)
**Body Font:** Same system stack — single family in multiple weights

**Character:** Clean, technical, no-nonsense. The system stack ensures fast rendering and native feel across platforms. Weight and size do the hierarchy work, not font selection.

### Hierarchy
- **Display** (700, clamp(1.75rem, 7vw, 3.5rem), 1.1): Hero headlines on landing page. Tight letter-spacing (-0.04em) for impact.
- **Headline** (700, clamp(1.5rem, 5vw, 2.625rem), 1.2): Section headings, page titles. Letter-spacing -0.03em.
- **Title** (700, 18px, 1.3): Card titles, sidebar brand, modal headers.
- **Body** (400, 14px, 1.5): Primary reading text, descriptions, form labels.
- **Label** (700, 11px, 0.05em, uppercase): Eyebrow badges, table headers, status tags. Always uppercase with wide tracking.

### Named Rules
**The Weight-is-Hierarchy Rule.** Bold (700) is for headings and labels only. Body text is always 400. Medium (500) is avoided — it's the uncertain middle ground that weakens hierarchy.

## 4. Elevation

Depth is conveyed through three mechanisms: glass transparency (sidebar, header), tonal layering (card vs background), and glow effects (interactive states). Heavy drop shadows are avoided — the dark palette makes shadows invisible anyway.

### Shadow Vocabulary
- **Ambient** (`0 24px 70px rgba(0, 0, 0, 0.42)`): Reserved for modals and elevated panels. The only heavy shadow in the system.
- **Card** (`none`): Cards use border + background opacity difference, not shadow.
- **Glow** (`0 0 20px rgba(157, 255, 47, 0.28)`): Interactive hover/focus state on primary buttons and active elements.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows and glow appear only as response to state (hover, focus, elevation). Static cards never cast shadows.

## 5. Components

### Buttons
- **Shape:** Gently rounded (6px radius), pill-shaped for primary CTAs
- **Primary:** Electric Lime background (#9dff2f), dark text (#07110a), 12px 24px padding, 600 weight. Minimum height 44px on mobile.
- **Hover / Focus:** Background shifts to Deep Lime (#62d11f), subtle glow ring. Focus uses 2px outline offset.
- **Ghost:** Transparent background, muted text (#b0c8db), same padding. Used for secondary actions.
- **Danger:** Red background (#ff3d55), white text. Only for destructive actions with confirmation.

### Cards / Containers
- **Corner Style:** 14px radius
- **Background:** Surface glass (rgba(13, 27, 40, 0.78)) for content cards, Surface Strong for modals
- **Shadow Strategy:** Flat by default, ambient shadow only on modals
- **Border:** 1px solid Border (rgba(137, 180, 209, 0.18)). Active/hover border shifts to Border Hot.
- **Internal Padding:** 24px desktop, 20px mobile

### Inputs / Fields
- **Style:** Dark transparent background (rgba(255, 255, 255, 0.05)), 1px border, 6px radius, 12px 16px padding
- **Focus:** Border shifts to Border Hot (accent-tinted), subtle glow ring
- **Error:** Border shifts to Danger (#ff3d55)
- **Placeholder:** Muted text (#5f7688) — must meet 4.5:1 contrast

### Navigation (Sidebar)
- **Style:** Glass panel with backdrop-filter blur(20px), fixed left, full height
- **Background:** Deep gradient (rgba(15, 30, 44, 0.98) to rgba(7, 17, 28, 0.95))
- **Items:** 10px radius, muted text, hover shifts to accent background tint
- **Active:** Accent background tint, bold weight, accent text color
- **Collapsed:** 72px width, icons only

### Navigation (Topbar/Header)
- **Style:** Sticky, glass backdrop (blur(22px)), border-bottom
- **Height:** 68px desktop, auto with grid layout mobile
- **Brand:** Bolt icon + bold text, accent color on highlight

### Landing Hero
- **Style:** Full-width section, grid layout (text + mockup), gradient background
- **Mockup:** 9:16 aspect ratio card with glass effect, internal rows with dividers
- **CTA Group:** Primary + secondary buttons, flex-wrap for mobile
- **Stats Bar:** Grid of metrics below hero, accent-colored values

### [Signature Component] Confirmation Dialog
- **Style:** Modal with backdrop blur (6%), centered, 16px radius
- **Actions:** Primary (confirm) + Ghost (cancel) buttons
- **Behavior:** Closes on backdrop click (onMouseDown + target check), focus trapped

## 6. Do's and Don'ts

### Do:
- **Do** use Electric Lime (#9dff2f) as the primary accent — it IS the brand identity.
- **Do** keep dark backgrounds near-black (#050b12, #07111c) — the void is intentional.
- **Do** use glass effects (backdrop-filter blur) on navigation and structural overlays only.
- **Do** implement glow treatments on hover/focus for primary interactive elements.
- **Do** respect `prefers-reduced-motion` — all animations disabled globally via tokens.css.
- **Do** use 44px minimum touch targets on mobile for all interactive elements.
- **Do** use weight (700 vs 400) for hierarchy, not color variation or font size alone.
- **Do** use 14px radius for cards, 6px for buttons/inputs — the established radius scale.

### Don't:
- **Don't** use generic CRM-style dashboards — monochrome grays, flat tables, no personality. (PRODUCT.md anti-reference)
- **Don't** use spreadsheet-like data grids — Excel-in-a-browser aesthetic. (PRODUCT.md anti-reference)
- **Don't** use bland SaaS admin templates — sidebar + white cards + blue accents. (PRODUCT.md anti-reference)
- **Don't** apply gradient text (`background-clip: text`) — decorative, never meaningful.
- **Don't** use side-stripe borders (`border-left > 1px` as colored accent) — rewrite with full borders or background tints.
- **Don't** pair `border: 1px solid X` with `box-shadow` blur ≥ 16px on the same element — pick one.
- **Don't** use border-radius ≥ 24px on cards — the system caps at 14px.
- **Don't** apply glassmorphism decoratively — blur is for structural navigation, not cards or content.
- **Don't** animate CSS layout properties unless truly needed.
- **Don't** use bounce or elastic easing — ease-out with exponential curves only.
