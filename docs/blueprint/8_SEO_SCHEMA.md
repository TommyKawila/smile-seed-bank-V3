# SEO & Structured Data (Blueprint V3.2)

Release blockers for public storefront routes. Target: Lighthouse SEO **≥95** (current lock: **100**).

---

## Canonical & metadata

| Rule | Implementation |
|------|----------------|
| `metadataBase` | root layout · from `NEXT_PUBLIC_SITE_URL` via `lib/get-url.ts` |
| Product canonical | `/product/[slug]` — clean slug, no query params |
| Breeder catalog | `/seeds/[breederSlug]` exports canonical metadata |
| Blog index | `lib/seo/blog-index-metadata.ts` — `BLOG_INDEX_TITLE` / `DESCRIPTION` |
| Blog article | title suffix `\| คลังความรู้สายเขียว - Smile Seed Bank` |
| Bilingual | TH/EN via locale — one metadata set per request, no duplicate hreflang mistakes |

---

## Sitemap & robots

| File | Behavior |
|------|----------|
| `app/sitemap.ts` | Dynamic · revalidate 3600 · no query-param URLs |
| Static priorities | `/` 1.0 · `/shop` 0.88 · `/seeds` 0.9 · `/blog` 0.85 |
| Products | active only → `/product/[slug\|id]` · lastModified from `created_at` |
| Blog | published `blog_posts` → `/blog/[slug]` |
| Breeders | active → `/seeds/[breederSlug]` |
| `app/robots.ts` | Allow public product/seed/blog · **Disallow** `/admin/`, `/api/`, `/checkout/`, `/profile/` |

---

## JSON-LD (Schema.org)

| Page | Component / builder | Types |
|------|---------------------|-------|
| Global layout | `StorefrontStructuredData` · `lib/seo/build-storefront-jsonld.ts` | `Organization` + `FAQPage` in `@graph` |
| Product PDP | `ProductJsonLd` · `lib/seo/build-product-jsonld.ts` | `Product`, `brand`, `offers` (THB, availability) |
| Product extras | same builder | `additionalProperty` (THC, CBD, Yield) · shipping/return policy |
| Blog article | `MagazineArticleJsonLd` · `lib/magazine-seo.ts` | `Article` / blog posting |
| Ratings | conditional only | `aggregateRating` **only** when real data in `seo_meta` — never fabricated |

---

## Product URL rules

- **`products.slug`** unique · canonical path prefers slug over id.
- Redirect or canonicalize legacy id URLs to slug when available.
- Case-insensitive filters in UI — URLs remain lowercase slugs.

---

## Images & OG

- OG images: absolute URLs via `metadataBase`.
- Product/blog featured: explicit width/height or aspect container (CLS + rich previews).
- `placeholder="blur"` + `lib/shimmer-blur` for below-fold grids — not on LCP hero.

---

## Security headers (SEO trust)

`next.config.mjs`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.

---

## Env

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for sitemap, OG, LINE OAuth, emails |

---

## PR checklist

- [ ] New public route added to sitemap or explicitly excluded with reason
- [ ] `generateMetadata` on new indexable pages
- [ ] JSON-LD validates in [Rich Results Test](https://search.google.com/test/rich-results) for PDP changes
- [ ] No noindex on production storefront by mistake
- [ ] Slugs stable — changing slug requires redirect plan

---

*Business copy rules: Organization founding **2018**, authenticity FAQ aligned with vault positioning.*
