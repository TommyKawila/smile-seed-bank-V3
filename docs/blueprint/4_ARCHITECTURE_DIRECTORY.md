# Project Directory Architecture (V3.2 / V4 UX)

```text
app/
├── (storefront)/        # Customer-facing (Bilingual, LCP Optimized, V4 Cyber-Organic)
│   ├── page.tsx         # Home (Single-payload fetch via services)
│   ├── home-stream.tsx  # Hero SSR + below-fold sections
│   ├── shop/            # Genetic Vault Grid
│   ├── product/[slug]/  # SEO friendly slugs
│   ├── line/entry/      # LIFF auto-login entry
│   └── tools/           # Grower AI tools (V4 — implement phase)
│       ├── soil-mixer/
│       ├── vpd-calculator/
│       ├── fertilizer/
│       └── plant-doctor/
├── admin/               # Admin Management — Light UI (out of V4 dark scope)
│   ├── inventory/manual # Bulk editing grid
│   └── dashboard/       # Recharts & Looker Studio Embed
├── services/            # THE BRAIN (Strict Logic Layer)
│   ├── storefront-product-service.ts
│   ├── auth-service.ts
│   └── checkout-service.ts
├── components/
│   └── storefront/
│       └── AiQuickToolsDock.tsx   # V4 homepage dock (target — not yet implemented)
├── lib/
│   ├── timeout.ts       # Resilience utility (withTimeout)[cite: 8]
│   └── supabase/        # Server/Client/Admin Clients
└── types/               # Strict TypeScript Interfaces
```

## Homepage section registry (V4)

Keys in `homepage_sections` / `lib/homepage-sections.ts` — **order matters**:

| Order | Key | Render |
|-------|-----|--------|
| 0 | `hero` | SSR in `home-stream.tsx` (LCP) |
| 1 | `ai_quick_tools_dock` | `AiQuickToolsDock` — **immediately after hero** |
| 2+ | `categories`, `breeder_showcase`, `clearance`, `blog`, `featured`, `breeders`, `trust`, `new_strains`, `newsletter` | `HomePageBelowFold.tsx` |

## Performance contract (V3.2)

Route tiers — full budgets in `6_PERF_BUDGETS.md`:

| Tier | Routes | Data | JS |
|------|--------|------|-----|
| T0 LCP | `/` hero | SSR + `ssb_vp` cookie | no sync third-party |
| T1 shell | layout, Navbar | cookie hint SSR | Navbar sync · BreederSeedsNav lazy |
| T2 below-fold | home sections, `/tools/*` shell | `withTimeout` 2s | dynamic + idle ≥2.5s |
| T3 interactive | cart, search, checkout, tool calculators | on demand | `dynamic()` import |

**Service layer (unchanged):** UI thin → `services/` → `lib/timeout.ts` for non-critical.

**Every route segment:** `loading.tsx` + `error.tsx` + one LCP candidate.

**Key perf files:** `home-stream.tsx`, `HeroCarouselSlideImages.tsx`, `StorefrontLayoutClient.tsx`, `lib/timeout.ts`, `lib/fonts/prompt.ts`

**V4 note:** `backdrop-blur` only on T2 cards/dock — never on T0 hero path (`5_UI_UX_DESIGN_SYSTEM.md` §1).
