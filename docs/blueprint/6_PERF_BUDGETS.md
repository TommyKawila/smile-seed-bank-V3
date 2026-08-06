# Performance Budgets (Blueprint V3.2)

**Single source of truth** for locked perf config. Do **not** duplicate these values in `9_PROJECT_STATE.md`.

Last PSI lock: **2026-08-06** · commit **`dbe2b63`** (PSI SI + Framer defer recovery) · Boss accepted Lab ≥90 — **stop chasing Lab score**

| Score | Mobile | Desktop |
|-------|--------|---------|
| Performance | **92** (Boss run 92–93 · variance 88–90 OK · DoD ≥90) | **100** *(prior lock; not retested this sprint)* |
| Accessibility | **95** | **95** |
| Best Practices | **100** | **100** |
| SEO | **100** | **100** |

**Lab notes (2026-08-06 `/`):** Mobile — FCP 1.1s · SI 3.5s · TBT 60ms · CLS 0.003 · LCP 3.2s (orange; TTFB-bound · accepted). Do **not** chase unused Prompt CSS / chunk JS while score ≥90.

### Field / Vercel Speed Insights (RUM) — worry, not Lab chase

Boss snapshot **2026-08-06** · Production · Last 7 days (not a Lab lock):

| Device | RES | CLS (p75) | LCP | Notes |
|--------|-----|-----------|-----|-------|
| Mobile | **66** Needs Improvement | **0.83 Poor** | 3.27s | Primary worry |
| Desktop | **83** Needs Improvement | **0.19** | 3.24s | Secondary |

**Worst mobile paths:** `/checkout` RES **18** / CLS **0.88** · `/` CLS **0.84** · `/clearance` **0.83** · `/seeds` **0.74** · `/profile` RES **34**  
**Do not confuse with Lab 92** — RUM includes interaction, age gate, cart hydrate, multi-route traffic.

**Why CLS ≈ 0.83 on many paths:** shared storefront shell (`StorefrontLayoutClient`) — one near-full-viewport shift (not small logo jitter). Root causes (ranked): (1) age gate late mount + `html.overflow-hidden` scrollbar lock after interact/12s · (2) Navbar logo Leaf→Image / settings blank (pre-`2e8407b`) · (3) checkout empty→localStorage cart flash · (4) font swap / removed banners still in 7d window. Product/blog often Great because soft-nav after age cookie + reserved media.

**Field CLS sprint shipped 2026-08-06** `2e8407b` (await RUM 3–7d): SSR logo · stable nav slot · checkout `cartReady` + no double `pt-20` · QR min-height · `scrollbar-gutter: stable` · age-gate logo box · Prompt `adjustFontFallback` + extended faces `optional`. Graph dip Aug 4–6 = early signal only — do not treat same-day P75 as cured. **Next if catalog still ~0.8:** age-gate scroll-lock (avoid post-paint `overflow-hidden` toggle on mobile). Admin poor Desktop paths remain lower priority.

---

## Stack lock

| Item | Value |
|------|-------|
| Next.js | `15.5.x` |
| `experimental.inlineCss` | `true` — do not A/B off without PSI |
| Font critical | `lib/fonts/prompt.ts` weight **400** preload only |
| Font extended | **600/700** via `PromptExtendedFacesLoader` idle **≥3.5s** |

---

## Critical path — home `/`

| Item | Rule |
|------|------|
| LCP element | **1 image only** · SSR via **`ssb_vp`** cookie hint |
| Hero render | **One viewport side** in HTML — never mobile+desktop pair with `md:hidden` |
| LCP quality | mobile **q32** · desktop **q50** |
| Hero sizes | mobile cap **412px** · desktop **640px** |
| Carousel autoplay | delay **≥20s** · fade animation **slide 2+ only** (slide 0 = no opacity-0) |
| Age gate | `scheduleInteractionMount` · fallback **≥12s** · PSI lab no interact = no mount |
| Framer Motion | not in sync layout chunk · `FramerLazyRoot` + interaction signal |
| Below-fold home | dynamic import + idle **≥2.5s** · fetch timeout **2s** |

---

## JS / layout budgets

| Chunk / area | Max / rule | Notes |
|--------------|------------|-------|
| Layout shell (8536-class) | ~**30 KiB** transfer | Navbar **sync** OK |
| `BreederSeedsNav` | lazy on hover / mobile menu open | Phase 4K |
| `PromoReturnHandler` | dynamic idle **2.5s** · immediate if `?promo=` | Phase 4K |
| Home route client | defer below-fold sections | no sync Embla on LCP path |
| Auth / Supabase client | idle **≥5s** on `/` guest | no sync `createClient` in layout |

---

## Third-party scripts

| Script | Load rule |
|--------|-----------|
| Google Analytics | **interaction-only** |
| Vercel Analytics | **interaction-only** |
| Supabase JS | not on `/` guest critical path |

---

## Network

| Rule | Detail |
|------|--------|
| Preconnect | Supabase origin only when needed |
| Hero preload | URL must match `<Image>` LCP slide exactly |
| WebP | default for hero/product imagery |
| `fetchWithTimeout` | **408** response · no thrown overlay in dev |

---

## Route tiers (perf contract)

| Tier | Routes | Data | JS |
|------|--------|------|-----|
| **T0 LCP** | `/` hero | SSR + cookie hint | zero sync third-party |
| **T1 shell** | layout, navbar | cookie SSR | Navbar sync · sub-nav lazy |
| **T2 below-fold** | home sections, related | client + 2s timeout | idle ≥2.5s |
| **T3 interactive** | cart, search, checkout | on demand | dynamic import |

Every route: **`loading.tsx`** + **`error.tsx`** + one clear LCP candidate.

---

## Anti-patterns (learned V3 sprint)

| ❌ Broke PSI | ✅ Do instead |
|-------------|---------------|
| `dynamic(Navbar)` whole component | lazy sub-parts only |
| dual hero `priority` mobile+desktop | `ssb_vp` SSR single side |
| `AbortController` throw on timeout | `fetchWithTimeout` → 408 |
| 3 links per insight/blog card | stretched single link |
| inline font `<script>` in `<body>` | `PromptExtendedFacesLoader` |
| age gate mount at LCP+2s fixed timer | `scheduleInteractionMount` |
| trim "unused" Prompt CSS @font-face | accept unscored ~20 KiB if score ≥90 |
| `HomeHeroCarouselMotion` on slide 0 | CSS-only hero · defer Framer |

**Phases (reference):** 4I revert split → 4J SSR single hero → 4K layout trim → A11y newsletter/cards.

---

## When to update this file

1. Boss approves config change **and**
2. PSI 3-run median passes targets in `0_PSI_ACCEPTANCE.md`

Then update the lock table + date + commit hash here. Log narrative only in `9_PROJECT_STATE.md`.
