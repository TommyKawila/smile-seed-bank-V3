# Project Directory Architecture (V3.2)

```text
app/
├── (storefront)/        # Customer-facing (Bilingual, LCP Optimized)
│   ├── page.tsx         # Home (Single-payload fetch via services)
│   ├── shop/            # Genetic Vault Grid
│   └── product/[slug]/  # SEO friendly slugs
├── admin/               # Admin Management (Thick logic moved to services)
│   ├── inventory/manual # Bulk editing grid
│   └── dashboard/       # Recharts & Looker Studio Embed
├── services/            # THE BRAIN (Strict Logic Layer)
│   ├── storefront-product-service.ts
│   ├── auth-service.ts
│   └── checkout-service.ts
├── lib/
│   ├── timeout.ts       # Resilience utility (withTimeout)[cite: 8]
│   └── supabase/        # Server/Client/Admin Clients
└── types/               # Strict TypeScript Interfaces
```

## Performance contract (V3.2)

Route tiers — full budgets in `6_PERF_BUDGETS.md`:

| Tier | Routes | Data | JS |
|------|--------|------|-----|
| T0 LCP | `/` hero | SSR + `ssb_vp` cookie | no sync third-party |
| T1 shell | layout, Navbar | cookie hint SSR | Navbar sync · BreederSeedsNav lazy |
| T2 below-fold | home sections | `withTimeout` 2s | dynamic + idle ≥2.5s |
| T3 interactive | cart, search, checkout | on demand | `dynamic()` import |

**Service layer (unchanged):** UI thin → `services/` → `lib/timeout.ts` for non-critical.

**Every route segment:** `loading.tsx` + `error.tsx` + one LCP candidate.

**Key perf files:** `home-stream.tsx`, `HeroCarouselSlideImages.tsx`, `StorefrontLayoutClient.tsx`, `lib/timeout.ts`, `lib/fonts/prompt.ts`