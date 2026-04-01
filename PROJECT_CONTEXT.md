# Smile Seed Bank V3 — Project Context (AI & Developer Reference)

This document is the **primary onboarding context** for engineers and AI assistants working on this repository. It complements authoritative specs in `docs/blueprint/` (especially `1_PRD_PROJECT_OVERVIEW.md`, `2_BUSINESS_LOGIC_RULES.md`, `3_DB_SCHEMA_RLS.md`, `4_ARCHITECTURE_DIRECTORY.md`, `5_UI_UX_DESIGN_SYSTEM.md`). When in doubt, **do not guess schema or business rules**—verify against those files and `prisma/schema.prisma`.

---

## 1. Project Overview

### 1.1 Name & Identity

- **Name:** Smile Seed Bank V3  
- **Positioning:** Premium **retail / wholesale seed bank** management platform with a **boutique** storefront and a **full admin back office** (inventory, POS, CRM, documents, analytics).

### 1.2 Mission

Deliver a **bilingual (Thai / English)** e-commerce and operations experience for **cannabis seed** sales: product catalog, cart, checkout, loyalty, promotions, and wholesale-aware pricing—backed by **Supabase (PostgreSQL)** and **Next.js 14 App Router**.

### 1.3 Target Audience

| Segment | Needs |
|--------|--------|
| **End customers (B2C)** | Browse products, filter by breeder/category, cart, checkout, order history, profile. |
| **Wholesale customers (B2B)** | Tier-based pricing when `is_wholesale` / wholesale discount applies; cart behavior must re-validate on tier change. |
| **Staff / Admin** | Product CRUD, manual grid import, AI-assisted extraction, POS orders, customers, promotions, quotations, reports, LINE alerts. |

---

## 2. Tech Stack & Architecture

### 2.1 Core Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router), React Server Components where appropriate |
| **Language** | TypeScript (strict typing; shared types in `types/`) |
| **Database** | Supabase (PostgreSQL), Row Level Security (RLS) on sensitive tables |
| **ORM / Data access** | Prisma 7 + driver adapter (`pg`); connection URL from `prisma.config.ts` / env |
| **Auth** | Supabase Auth (e.g. Google OAuth); admin routes protected by middleware + role checks |
| **Styling** | Tailwind CSS, **shadcn/ui**, Lucide icons |
| **Motion** | Framer Motion, `tailwindcss-animate` |
| **Charts** | Recharts (admin dashboard) |
| **Email** | React Email / Resend (see `services/email-service.ts`) |
| **Validation** | Zod |

### 2.2 Architectural Patterns

- **Modular routes:** `app/(storefront)/` vs `app/admin/` vs `app/api/`  
- **Service layer:** Business logic in `services/` (e.g. `product-service.ts`, `ai-extractor.ts`, `email-service.ts`) and `lib/services/` for order/manual flows.  
- **Supabase clients:** `lib/supabase/server.ts` — `createClient()` (anon + user session) vs `createAdminClient()` (service role bypasses RLS for admin APIs).  
- **BigInt serialization:** `lib/bigint-json.ts` for JSON APIs that serialize Prisma `BigInt` fields.  
- **Multi-language (TH/EN):** `context/LanguageContext.tsx` — `t(th, en)` pattern; product content often uses `*_th` / `*_en` columns; UI strings passed as Thai/English pairs.

### 2.3 Directory Map (Abbreviated)

See `docs/blueprint/4_ARCHITECTURE_DIRECTORY.md` for the full tree. Highlights:

- `app/(storefront)/` — Home, shop, product detail, cart, checkout, profile, blog, breeders  
- `app/admin/` — Dashboard, products, inventory, orders, customers, settings, promotions, blog  
- `app/api/` — REST-style routes; `/api/admin/*` protected by middleware  
- `components/ui/` — shadcn primitives  
- `components/storefront/` — Storefront-specific UI  
- `components/admin/` — Admin UI  
- `hooks/` — e.g. `useCart`, `useProducts`, `useSiteSettings`  
- `supabase/migrations/` — SQL migrations (RLS, constraints); keep in sync with Prisma where applicable  

---

## 3. Database Schema — `products` & `product_variants`

### 3.1 Relationship (Parent–Child)

- **`products`** is the **parent** catalog row (one strain / product line).  
- **`product_variants`** are **children** (pack sizes, SKUs, per-unit price and stock).  
- **Rule:** Create `products` first, then attach variants (`product_id` → `products.id`). Deletes cascade from product to variants per FK.

**Source of truth:** `prisma/schema.prisma` models `products` and `product_variants`.

### 3.2 `products` (selected fields)

| Field | Type | Purpose |
|-------|------|---------|
| `id` | `BigInt` | Primary key |
| `breeder_id` | `BigInt?` | FK → `breeders.id` |
| `category_id` | `BigInt?` | FK → `product_categories.id` |
| `name` | `String` | Display name |
| `category` | `String?` | Legacy/category label (string) |
| `description_th`, `description_en` | `String?` | Bilingual descriptions |
| `price` | `Decimal?` | **Denormalized “starting price”** — lowest relevant variant price (see §5) |
| `stock` | `Int?` | **Denormalized total stock** — sum of active variant stock (see §5) |
| `is_active` | `Boolean?` | Master visibility switch |
| `image_url` … `image_url_5`, `image_urls` (JSON) | | Media |
| `seo_meta` | `Json?` | SEO TH/EN structure |
| `flowering_type` | `String?` | `autoflower` \| `photoperiod` (normalized) |
| `sex_type` | `String?` | `feminized` \| `regular` |
| `strain_dominance`, `genetic_ratio`, `lineage` | | Genetics / marketing |
| `thc_percent`, `cbd_percent`, `effects`, `flavors`, … | | Specs |

### 3.3 `product_variants`

| Field | Type | Purpose |
|-------|------|---------|
| `id` | `BigInt` | Primary key |
| `product_id` | `BigInt?` | FK → `products.id` |
| `unit_label` | `String` | e.g. `"5 Seeds"` |
| `sku` | `String?` | Unique when set |
| `sku` / `price` | | **Retail price lives on variant** |
| `cost_price` | `Decimal?` | COGS / margin |
| `stock` | `Int?` | **Source of truth** for quantity per pack |
| `low_stock_threshold` | `Int?` | Per-variant low-stock alert (default 5) |
| `is_active` | `Boolean?` | Disable individual packs without hiding whole product |

### 3.4 Related Tables (brief)

- `breeders`, `store_settings`, `site_settings`, `customers` (auth + wholesale), `Customer` (POS), `orders`, `order_items`, `promotion_rules`, `payment_settings`, `discount_tiers`, `blogs` / `blog_posts` — see `3_DB_SCHEMA_RLS.md` and Prisma.

---

## 4. Current Implementation Status

### 4.1 Largely Complete (Backend / Admin)

- **Admin dashboard** — Stats, charts, exports, date ranges (`/admin/dashboard`).  
- **Products** — CRUD, AI extract, product modal, media handling, sync with variants.  
- **Inventory** — Manual grid, AI sheet import, PDF catalog, stock sync patterns.  
- **POS / Orders** — Manual orders, void, financial fields, receipts, quotations, deduct stock.  
- **CRM** — Customer tiers, points, wholesale flags (POS `Customer` + web `customers`).  
- **Promotions** — Rules engine integrated with cart/POS (see `docs/blueprint/6_PROJECT_STATE.md` for nuance).  
- **Storage** — Supabase Storage for product/brand assets; WebP compression patterns.  
- **LINE** — Alerts (low stock, void, daily summary).  
- **Blog** — Admin + blog posts model (`blog_posts`).

### 4.2 Storefront (Partially Complete)

- **Home** — Hero, featured products, breeder ribbon, site settings (`useSiteSettings` + `/api/storefront/site-settings`).  
- **Shop** — Listing, filters, search, breeder overlay logos.  
- **Product detail** — Route `app/(storefront)/product/[slug]/page.tsx` (param is used as **product id** in links).  
- **Cart / Checkout** — Present (`hooks/useCart`, checkout pages); ongoing alignment with promotions, tax/shipping rules, and edge cases.  
- **Profile / Auth** — Login, profile, order success flows exist; roadmap may expand **customer portal** (points history, self-service).

### 4.3 UI / UX Components

- **shadcn/ui** in `components/ui/` (Button, Card, Dialog, Tabs, Table, etc.).  
- **Storefront:** `BreederLogoImage`, `BreederRibbon`, checkout client, skeletons, empty states.  
- **Admin:** `ProductModal`, charts, data tables, quotation/order modals.  
- **Design system:** Sage green (`emerald-700/800`), zinc neutrals, mobile-first — **see `5_UI_UX_DESIGN_SYSTEM.md`**.

---

## 5. Key Business Logic

### 5.1 Stock (Parent Aggregate)

- **Variant stock is authoritative**; `products.stock` is **denormalized**.  
- **Aggregation:** `computeTotalStock()` in `lib/product-utils.ts` sums `stock` for variants where `is_active !== false`.  
- **Sync:** After variant changes, `syncProductStats(productId)` in `services/product-service.ts` recomputes `products.stock` (and price) from variants.

### 5.2 Starting Price (Display on Parent)

- `products.price` is the **“starting from”** price for listings.  
- **Logic:** `computeStartingPrice()` in `lib/product-utils.ts`:  
  - Consider only **active** variants with `price > 0`.  
  - Prefer **lowest price among variants that have stock > 0**; if none in stock, lowest price among priced variants.  
- **Sync:** Same `syncProductStats`/`createProductWithVariants` path updates `products.price`.

### 5.3 Bilingual Content

- **Product:** `description_th` / `description_en` (and similar on breeders, blogs).  
- **UI:** `useLanguage().t("ไทย", "English")` toggles locale stored in `localStorage`.  
- **SEO:** `seo_meta` JSON on products; metadata for pages should use `generateMetadata` where implemented.

### 5.4 Other Rules (Pointers)

- **Wholesale:** `wholesale_discount_percent`, `is_wholesale` — see `2_BUSINESS_LOGIC_RULES.md`.  
- **Promotions vs coupons:** Hierarchy documented in project state; storefront tiered discounts may read from `promotion_rules`.  
- **RLS:** Public reads for `site_settings` use a **whitelist of keys** in Supabase migrations (`lib/storefront-site-setting-keys.ts` aligned with SQL); **never** expose service keys in client code.

---

## 6. Project Roadmap (Next Steps)

High-level direction; adjust against `docs/blueprint/6_PROJECT_STATE.md`.

1. **Storefront polish** — Home/shop/product consistency: loading states, SEO slugs vs numeric IDs, performance (images, caching).  
2. **Cart & checkout** — End-to-end testing: shipping rules, payment preview, promo/coupon interaction, mobile UX.  
3. **Customer management** — Deeper **portal** (points, order history), alignment between `customers` (web) and `Customer` (POS).  
4. **Analytics & reporting** — Expand dashboards per PRD §13.  
5. **Hardening** — RLS review for all public routes, rate limits, abuse prevention on promos (`2_BUSINESS_LOGIC_RULES.md` §6).

---

## 7. Developer Guidelines

### 7.1 Coding Style

- **Prefer small, composable modules**; colocate route UI with route-specific components when it helps clarity.  
- **Match existing patterns** in the same folder (imports, naming, error handling).  
- **Validate inputs** with Zod on API boundaries.  
- **Avoid** leaking secrets: `NEXT_PUBLIC_*` only for safe values; `SUPABASE_SERVICE_ROLE_KEY` server-only.  
- **Prisma / BigInt:** Serialize for JSON using `bigint-json` helpers where needed.

### 7.2 Cursor / Composer Usage

- **Read blueprint files first** (`docs/blueprint/1`–`5`) for schema and UX rules.  
- **Search before inventing** — new types should align with `types/database.types.ts` / `types/supabase.ts`.  
- **Surgical edits** — Prefer minimal diffs; do not refactor unrelated files in the same task.  
- **After completing a significant phase**, update `docs/blueprint/6_PROJECT_STATE.md` per project policy.

### 7.3 Principles

- **Complexity is the enemy.** Prefer straightforward data flow over clever abstractions.  
- **Less is more.** Ship the smallest change that satisfies requirements; document extension points in code comments only when non-obvious.  
- **Bilingual and mobile-first** are defaults for storefront work.

---

## 8. Quick Reference — Key Files

| Purpose | Location |
|---------|----------|
| Product stats (stock/price sync) | `services/product-service.ts`, `lib/product-utils.ts` |
| Storefront product fetch | `hooks/useProducts.ts`, `services/product-service.ts` |
| Cart | `context/CartContext.tsx`, `hooks/useCart.ts` |
| Public site settings | `app/api/storefront/site-settings/route.ts`, `lib/storefront-site-setting-keys.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Env validation | `lib/env.ts` |

---

*Last updated: March 2026 — aligned with Smile Seed Bank V3 blueprint and repository layout.*
