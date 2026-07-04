# Product

## Register

product

## Users

Three-tier system for managing AI extension licenses:

- **Admin**: Manages the entire platform — products, pricing, resellers, customers, sales. Primary workflow: monitoring dashboards, approving transactions, managing inventory. Works desktop-first but needs mobile access for quick checks.
- **Reseller**: Buys credits from admin, resells licenses to end customers with custom branding. Primary workflow: purchasing credit packs, creating licenses, customizing branding (logo, colors, domain). Works on mobile frequently.
- **Client (End Customer)**: Purchases and uses AI extension licenses. Primary workflow: buying licenses (Pix or credit card), activating on devices, managing HWID resets. Mobile-first — many clients discover and purchase from phones.

## Product Purpose

A SaaS platform that enables a reseller network for AI browser extension licenses. Admin controls inventory and pricing, resellers brand and distribute, clients consume. Success: seamless purchase-to-activation flow where a client can go from landing page to working extension in under 3 minutes.

## Brand Personality

Bold, energetic, visual. The interface should feel like a high-performance tool — dark surfaces with electric green accent energy, depth through layered glass effects, and confident typography. Not a bland admin panel; a premium tech product that happens to have admin capabilities.

## Anti-references

- Generic CRM-style dashboards (monochrome grays, flat tables, no personality)
- Spreadsheet-like data grids (Excel-in-a-browser aesthetic)
- Bland SaaS admin templates (sidebar + white cards + blue accents)
- Overly corporate/sterile interfaces that feel like enterprise software from 2018

## Design Principles

1. **Energy over ergonomics**: The green accent (#9dff2f) carries visual identity. Every interactive element should feel charged, not passive. Hover states, transitions, and glow effects reinforce the brand's tech-forward personality.
2. **Dark by design, not by default**: The dark palette (#050b12 base) is a deliberate choice for a tool used in focused work sessions, not a "dark mode toggle." Light mode exists as an accessibility option, not the primary.
3. **Mobile-first, desktop-complete**: Critical flows (purchase, license activation, HWID reset) must work flawlessly on phones. Admin dashboards optimize for desktop but don't break on mobile.
4. **Single login, role-aware UI**: One authentication flow serves all three roles. The system detects role post-login and routes accordingly — no separate login pages, no role selection screens.
5. **Real-time or nothing**: Payment status, license activation, credit balance — all update via polling or webhook without requiring page refresh. Stale data erodes trust in a financial tool.

## Accessibility & Inclusion

- WCAG AA compliance target
- `prefers-reduced-motion` respected globally (animations disabled)
- Minimum touch targets: 44px on mobile
- Color contrast: text on dark backgrounds meets 4.5:1 ratio
- Keyboard navigation for all interactive elements
- Screen reader support for critical flows (purchase, license management)
