# iTorgo v2.0 Design System — "Liquid Luster"

## Overview

iTorgo's design language is **Liquid Luster** (also referenced as "Sunlit Sky" in early explorations) — a light, glassmorphic aesthetic built for a high-stakes real-time auction marketplace. It combines the energy of **Sun Yellow** (bidding, primary actions) with the trust of **Sky Blue** (navigation, links, secondary actions) on a soft off-white base, using translucent "glass" panels rather than heavy shadows to communicate depth.

This document describes what is **actually implemented** in the codebase — it is the single source of truth for styling decisions. It replaces an earlier "Obsidian Tactile Luxury" draft that was never implemented and no longer applies.

Source reference: the original visual spec was produced in Google Stitch (`liquid_luster/DESIGN.md` and per-screen `code.html`/`screen.png` exports covering the landing page, live auctions grid, auction detail, user dashboard, and the 4-step payment flow). This document adapts that spec to the real Vue/Tailwind implementation.

**Scope**: customer-facing pages (`frontend/src/pages/*` excluding `pages/admin/*`) and their shared components. The admin panel intentionally keeps its own separate styling and is out of scope for this system.

**Theme**: light only. There is no dark mode — `App.vue`, `index.html`, and `stores/ui.ts` do not apply or toggle a `.dark` class anywhere in the customer-facing app.

---

## Design Tokens

All color tokens are CSS custom properties defined once in `frontend/src/styles/tailwind.css` under `:root`, and exposed as Tailwind utilities via `frontend/tailwind.config.js`. Never hardcode a hex color or use an undefined utility like `gold-500` or `dark-900` — always use the semantic class names below.

### Colors

| Token | Tailwind class(es) | Value | Usage |
|---|---|---|---|
| Primary | `bg-primary` / `text-primary` / `border-primary` | `#705D00` | Filled CTAs (Place Bid, Sell, Sign In), key numbers (current price), active states. **Always pair a filled `bg-primary` surface with `text-white`** — it's a dark olive, not bright yellow. |
| Primary hover | `bg-primary-hover` | `#8A7403` | Hover state for primary-filled elements. |
| Primary container | `bg-primary-container` / `text-onPrimaryContainer` | `#FFD700` / `#705E00` | The actual bright "Sun Yellow" — reserved for small accent chips/badges (e.g. bid-count pill on an auction card), never for large filled surfaces or body text. |
| Secondary | `bg-secondary` / `text-secondary` / `border-secondary` | `#00658D` | Links, secondary buttons, input focus rings, trust/verification accents. |
| Secondary hover | `bg-secondary-hover` | `#007AA8` | |
| Background | `bg-background` | `#F8F9FA` | Page background. |
| Surface | `bg-surface`, or just `bg-white` | `#FFFFFF` | Cards, inputs, opaque panels. |
| Text primary | `text-text-primary` | `#191C1D` | Headings, body copy. |
| Text secondary | `text-text-secondary` | `#4D4732` | Supporting copy, labels. |
| Text muted | `text-text-muted` | `#7E775F` | Timestamps, placeholders, least-important text. |
| Border | `border-border` | `#D0C6AB` at 40% | Default hairline borders. |
| Success / Warning / Error | `bg-success`/`text-success`, `bg-warning`/`text-warning`, `bg-error`/`text-error` | `#22C55E` / `#FFC107` / `#BA1A1A` | Status colors — KYC verified, escrow confirmations, countdown-critical states, form errors. |

Real Tailwind palette colors (`emerald-*`, `blue-*`, `amber-*`, `red-*`, etc.) are also fine to use directly for one-off status indicators (e.g. per-bank brand colors, category icon tints) — they render correctly since they're part of Tailwind's default palette, unlike the old `gold-*`/`dark-*` names which were never defined.

### Typography

Single font family across every role: **Poppins**, loaded via Google Fonts in `frontend/index.html` and set as the default `font-sans` in `tailwind.config.js`. There is no separate "display" font — use `font-sans` (default) with weight/size utilities for hierarchy, e.g. `text-3xl font-extrabold` for a page headline, `text-base font-bold` for a card heading. (`font-display`, `text-display-*`, `text-heading-*` are **not** real classes — don't use them.)

Numbers that matter (bid amounts, countdowns) may use `font-mono` (JetBrains Mono) to stay legible and avoid digit jitter.

### Radius

- `rounded` (default) = `0.625rem` (10px) — standard for buttons, inputs, badges, small cards.
- `rounded-liquid-lg` = `1.5rem` (24px) — large hero/feature panels.
- `rounded-2xl` / `rounded-3xl` (Tailwind defaults, 1rem/1.5rem) are also used for card containers throughout the existing pages — acceptable, don't need to be hunted down and converted to `rounded`.
- `rounded-full` for pills, avatars, chips.

### Glass / Elevation

Depth comes from translucency + blur, not drop shadows. The base class is `.glass` (defined in `tailwind.css` `@layer components`):

```css
.glass {
  background: rgba(255,255,255,0.6);      /* --glass-bg */
  backdrop-filter: blur(20px);            /* --glass-blur */
  border: 1px solid rgba(255,255,255,0.4); /* --glass-border */
  box-shadow: 0 4px 30px rgba(0,0,0,0.08);
}
.glass-strong { backdrop-filter: blur(40px); } /* modals, popovers */
```

Use `glass` on any panel that should read as a floating card over the page background (hero sections, sidebars, modals, auction cards). Plain white opaque surfaces (`bg-white`) are fine for content that sits inside an already-glass container, or for inputs/small controls where legibility matters more than the glass effect.

---

## Core Components

### Button (`frontend/src/components/ui/Button.vue`)

Variants map to real classes now: `primary` → `bg-primary text-white`, `secondary` → `bg-secondary text-white`, `outline` → transparent with a `border-secondary`, `ghost` → transparent text-only, `danger`/`success` → tinted `error`/`success`. All use `rounded` (10px) and a `hover:scale`/`active:scale` micro-interaction.

### Input (`frontend/src/components/ui/Input.vue`)

White background, `border-border`, focus ring in `secondary` at 20% opacity. Error/success states swap the border and ring to `error`/`success`.

### Card (`frontend/src/components/ui/Card.vue`)

`variant="glass"` → the `.glass` treatment above. `variant="gold"` (prop name kept for backward compatibility with existing call sites) → a soft `bg-primary/10` tint, used for "highlighted" states like a verified-KYC card. `variant="default"`/`"elevated"`/`"hover"` → opaque white with a border and, for `hover`, a lift + primary-tinted border on `:hover`.

### AuctionCard (`frontend/src/components/auction/AuctionCard.vue`)

The signature component. `.glass` shell, image with gradient overlay for badge legibility, a countdown chip (pulses `error` red under the critical threshold), a bid-count chip in `primary-container`/`onPrimaryContainer`, and a diagonal light-streak sweep (`.animate-shimmer-sweep`, a scoped keyframe) that crosses the card every 5 seconds — the "Top-Light" effect called out in the original spec.

### Payment flow (`frontend/src/components/payment/PaymentModal.vue`)

The real, bank-specific 4-step flow (select gateway → MBank QR scan → Optima 3D Secure → success/failure), invoked as a modal from the auction detail page. This is the canonical payment UI — the separate `/payment` route (`PaymentFlow.vue`) is a simpler, generic implementation kept for now but not the primary path; if the two are ever unified, `PaymentModal.vue`'s structure should win since it matches the real MBank/Optima/DemirBank gateway spec.

---

## What changed from the previous system

The codebase previously had **three uncoordinated styling layers**:

1. `tailwind.config.js`/`tailwind.css` already defined a correct token system (this one), but most page components didn't use it.
2. Most actual page markup referenced `gold-*`/`dark-*` Tailwind color names and a `glass-panel` class that were only ever defined in `frontend/src/assets/main.css` — a file `main.ts` never imported. Every one of those classes rendered with **no color at all** (verified via `getComputedStyle` in a live browser: transparent backgrounds, default black text).
3. This document used to describe a third, unrelated dark "Obsidian Tactile Luxury" theme that matched neither of the above and was never built.

All customer-facing pages and shared components have been migrated onto the token system in section "Design Tokens" above. `assets/main.css` and its dead classes are no longer referenced anywhere and can be deleted. Dark mode (both the CSS `.dark` block and the `prefers-color-scheme`/localStorage toggle logic) has been removed rather than fixed — if a dark theme is wanted later, it should be designed intentionally against these same tokens rather than resurrected from the old dead code.
