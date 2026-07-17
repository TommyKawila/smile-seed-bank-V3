# PSI Acceptance Criteria (Blueprint V3.2)

**Definition of Done** for every storefront-facing PR. Read this file **before** any UI, layout, or home-route change.

---

## Score targets (production URL · [pagespeed.web.dev](https://pagespeed.web.dev) · Incognito · no extensions)

| Category | Mobile | Desktop |
|----------|--------|---------|
| Performance | ≥90 | ≥90 |
| Accessibility | ≥95 | ≥95 |
| Best Practices | ≥95 | ≥95 |
| SEO | ≥95 | ≥95 |

**Accepted variance:** Mobile Performance **88–90** is lab noise if LCP/FCP/CLS remain green — do not chase diagnostics to recover ±2 points.

**Current lock (2026-05-23):** Mobile **90** · Desktop **94** · A11y **100** · BP **100** · SEO **100** — numeric config lives in `6_PERF_BUDGETS.md`.

---

## Lab thresholds (must pass on `/`)

| Metric | Mobile max | Notes |
|--------|------------|-------|
| LCP | ≤2.5s | Single hero image only |
| TBT | ≤200ms | Proxy for main-thread pressure |
| CLS | ≤0.1 | Fixed aspect ratios on all images |
| FCP | ≤1.8s | No sync third-party on critical path |

---

## Test protocol

1. Test URL: production homepage `/` (primary) · also `/shop`, `/seeds`, and one `/product/[slug]` before major releases.
2. Environment: pagespeed.web.dev · Incognito · extensions disabled.
3. Run **3 times** · use **median** score.
4. **Do not merge** if Mobile Performance drops **>2** from baseline lock without explicit Boss approval + retest plan.
5. After deploy: log results in `9_PROJECT_STATE.md` only — update `6_PERF_BUDGETS.md` lock **only** after PSI pass.

---

## PR checklist (5 items)

- [ ] Exactly **one** LCP candidate on the route (no dual mobile+desktop hero in HTML).
- [ ] Interactive targets ≥ **48×48px** · stacked gap ≥ **8px** (prefer 16–20px).
- [ ] Card pattern: **one primary link** per card (stretched link — no duplicate URLs).
- [ ] Non-critical fetch uses `withTimeout` / `fetchWithTimeout` (**2s**) with skeleton fallback.
- [ ] Route ships `loading.tsx` + `error.tsx` if new route segment.

---

## Forbidden without PSI retest

| Action | Why |
|--------|-----|
| `dynamic()` import of **entire Navbar** or root layout shell | Phase 4H regression → Mobile 83 |
| Dual `priority={true}` on mobile **and** desktop hero slides | Bandwidth split · LCP delay ~620ms |
| `headers()` / `cookies()` in home critical stream without viewport hint | Forces dynamic shell |
| GA / Vercel Analytics on scroll, mousemove, or sync layout mount | Third-party on critical path |
| Multiple font-weight preloads in critical CSS | ~20 KiB unused `@font-face` |
| 2+ links to the same URL inside one card | A11y "identical links" failure |
| Chasing **Unscored** "Unused CSS/JS" diagnostics | Risk FOUT / deferred chunk removal · no score gain |

---

## Allowed patterns (proven on V3)

- **`ssb_vp` cookie** → SSR single hero side (mobile **or** desktop, not both).
- Sync **Navbar** · lazy **BreederSeedsNav**, **PromoReturnHandler**, cart/search on interaction/idle.
- **`scheduleInteractionMount`** for age gate + Framer on `/`.
- **`fetchWithTimeout`** returns HTTP **408** (no dev overlay throw).
- **`PromptExtendedFacesLoader`** idle ≥3.5s for weights 600/700.

---

*Blueprint V3.2 — governance only; does not change runtime until code changes.*
