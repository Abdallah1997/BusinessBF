# Design System: BusinessBF

## 1. Visual Theme & Atmosphere
A confident, daily-app-balanced workspace for resellers: clinical clarity with warm
emerald confidence. Density 6 (working tool, not a gallery), variance 5 (asymmetric
two-panel splits, no rigid three-card rows), motion 6 (fluid CSS springs — entrances
cascade, numbers count up, interactions push back). The feeling: a well-organized
stockroom with the lights on.

## 2. Color Palette & Roles

Two themes, class-switched (`.dark` on `<html>`, persisted in localStorage, no-FOUC inline script).

Light:
- **Canvas Mist** (#FAFAFA / gray-50) — primary app background
- **Pure Surface** (#FFFFFF) — cards, tables, panels
- **Charcoal Ink** (#18181B) — primary text (pure black banned)
- **Muted Steel** (#71717A) — secondary text, metadata, helper copy
- **Whisper Border** (#E4E4E7) — 1px structural lines, card borders

Dark ("matte black + orange"):
- **Matte Black** (neutral-950, oklch 14.5%) — app background; never #000
- **Coal Surface** (neutral-900) — cards, panels
- **Soft White** (neutral-100) — primary text
- **Smoke** (neutral-400/500) — secondary text
- **Seam** (neutral-800) — borders, dividers

Both:
- **Flip Orange** (#EA580C orange-600 light / orange-500 dark) — the single accent: CTAs, active nav, focus rings, profit highlights
- **Loss Red** (#DC2626) — semantic only: negative profit, destructive actions
- **Signal Amber** (#D97706) — semantic only: delist alerts, pending review

Max one accent (Flip Orange). No purple, no neon, no gradients on text.

## 3. Typography Rules
- **Display/Headlines:** Geist — tight tracking, hierarchy by weight not size
- **Body:** Geist — relaxed leading, 65ch max for prose
- **Money & metrics:** Geist Mono, tabular — every dollar figure and count renders in mono
- **Banned:** Inter, generic serifs, system-font fallbacks as primary

## 4. Component Stylings
- **Buttons:** flat fill, no outer glow; active state pushes down 1px (`active:translate-y-px`); primary = Ledger Green fill, secondary = whisper-border ghost
- **Cards:** 12–16px radius, whisper border, shadow only at rest-sm; hover lifts content cards by 2px with shadow deepening — only where the card is clickable
- **Inputs:** label above, 12px; focus ring emerald at 20% opacity; error text below in Loss Red
- **Tables:** row hover tint (zinc-50), staggered fade-up entrance on load, mono numerals
- **Loaders:** skeleton blocks matching final layout; shimmer sweep; no spinners
- **Empty states:** dashed border composition + one-line hint about how to populate
- **Status badges:** soft tinted pills (emerald/blue/amber/zinc), never saturated fills

## 5. Layout Principles
- App shell: dark zinc-950 sidebar (desktop) / top bar (mobile), 1152px max content
- Two-panel asymmetric splits (2/3 + 3/5 grids) over equal card rows
- Single-column collapse below 768px, no horizontal scroll, 44px touch targets
- `min-h-dvh` not `h-screen`

## 6. Motion & Interaction
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` ("spring-out") for entrances; 150ms ease for hovers
- **Entrances:** `fade-up` (8px translate + opacity, 400ms) with 40ms stagger per row/card
- **Numbers:** dashboard stats count up from 0 over 600ms on mount (rAF, respects prefers-reduced-motion)
- **Charts:** bars grow from baseline (`scaleY`, transform-origin bottom) with stagger
- **Disclosure panels:** content fades-up when opened
- **Buttons:** 1px push on press; subtle brightness shift on hover
- Animate `transform`/`opacity` only. All motion wrapped in `@media (prefers-reduced-motion: no-preference)`.

## 7. Anti-Patterns (Banned)
- No emojis in UI chrome — inline SVG icons only
- No Inter, no pure #000, no neon/glow shadows, no purple-blue AI gradient
- No three-equal-card feature rows
- No circular spinners
- No fabricated metrics or fake testimonials
- No "Elevate / Seamless / Unleash" copy
- No centered hero with stacked CTAs on marketing pages — asymmetric or left-aligned
