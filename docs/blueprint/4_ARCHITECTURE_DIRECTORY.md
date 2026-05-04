# Project Directory Architecture (V3.1)

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