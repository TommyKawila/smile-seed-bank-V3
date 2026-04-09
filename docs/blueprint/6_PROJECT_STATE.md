# Smile Seed Bank V3 — Project State & Progress Tracker

*ไฟล์นี้ใช้เพื่อบันทึกสถานะล่าสุดของโปรเจกต์ เพื่อป้องกัน AI ลืม Context*

---

### UI refactor — storefront / theme (status)
- **Current status:** **100% Completed (Goddess Tier)** — Premium Eco-Clinical storefront theme, genetic bar polish, and product text sanitization are in place for pre-production.
- **Key highlights:**
  - Implemented **Premium Eco-Clinical** theme (**Deep Teal + Lavender**): `app/globals.css` `:root` + `tailwind.config.ts` semantic colors.
  - **Double Glow** genetic bars in `components/storefront/ProductSpecs.tsx`: **Electric Mint (Sativa)** — `bg-sativa` + `hsl(var(--sativa)/0.4)` glow; **Rich Lavender (Indica)** — `bg-secondary` + `hsl(var(--secondary)/0.5)` glow; z-index layering (Sativa over Indica at the seam).
  - **Shop grid Micro-Genetics Bar** — `components/storefront/MicroGeneticsBar.tsx` (under product image in `app/(storefront)/shop/page.tsx` `ProductCard`): `getGeneticPercents` → `genetic_ratio` parse → `strain_dominance` fallback; Sativa `bg-emerald-400` / Indica `bg-violet-400`; perfect 50/50 → full `bg-teal-500`; primary glow + `group-hover` height 4px→6px.
  - **Shop / home product card spec chips** — `productCardFloweringChipLabel` + `labelForSeedTypeBadge` in `lib/seed-type-filter.ts`; shop `app/(storefront)/shop/page.tsx` + home `page.tsx`: flowering `AUTO`/`PHOTO`/`PHOTO FF`, seed `FEM`/`REG`, THC compact uppercase style (`compactSpecChip` / `compactSpecChipThc`).
  - **Admin sex select** — `ProductModal`: display **Fem** / **Reg** (values `feminized` / `regular`).
  - **Product detail seed labels** — `ProductSpecs` (`FeminizedSeedSpecChip` / `RegularSeedSpecChip`, `FeminizedStatCard` / `RegularStatCard`); `product-detail-client` spec grid + `SpecRow` seed type uses `seedTypeDetailShort` / `sexTypeDetailShort` from `lib/seed-type-filter.ts`.
  - **Product detail pack order** — `product-detail-client.tsx`: `sortVariantsByPriceThenPack` (price asc, tie-break `unit_label` first number); initial selected variant uses same order.
  - **Shop filters refactor** — Horizontal `BreederTypeFilter` uses `ft` (Auto / Photo / Photo FF / Photo 3N) + `catalogFloweringBucket` counts; **`catalogFloweringPillOptions`** = pills with `count > 0` only; strip shown when **≥2** such types; invalid `ft` cleared if not in current pill set; sidebar `FilterSidebar` (no breeder pills): Genetics icons, THC+CBD buckets, Difficulty, Sex Fem/Reg; `productMatchesShopAttributeFilters` + URL `cbd`/`sex`; legacy `type` query stripped; `q` debounced to URL; **`calculateFilterCounts`** (`lib/shop-attribute-filters.ts`) on `shopScopedProducts` (breeder + search + `ft`, no sidebar params) → per-option counts inline next to labels (`cn`, `text-zinc-400` when 0, row `opacity-60`) in sidebar/mobile sheet.
  - **Shop pagination + back-to-top** — `app/(storefront)/shop/page.tsx`: initial **30** visible products, **24** per "Load more" (`SHOP_PAGE_INITIAL` / `SHOP_PAGE_STEP`); reset when filtered id list changes; progress line + floating **Back to top** after **400px** scroll (`bg-primary/80`, `backdrop-blur-md`, `ArrowUp`).
  - **Breeder banner i18n (shop `?breeder=`)** — `locales/th.json` + `locales/en.json` (`breeder.back_to_list`, `breeder.strains_count`, `breeder.view_all_products`); `hooks/use-translations.ts` + `lib/i18n-messages.ts`; `app/(storefront)/shop/page.tsx` breeder profile strip.
  - **Product detail key i18n** — `common.back_to_shop`, `product.stock_left_simple` / `only_n_left` / `add_to_cart` (`{n}` via `fillN`); `product-detail-client.tsx` uses `useTranslations` + legacy `t()` for out-of-stock / added button labels.
  - **Admin product status** — `products.is_active`; `PATCH /api/admin/products/[id]/status` (derive via `deriveProductIsActiveForCatalog`); `ProductTableRow` shadcn `Switch` + toast; `useProducts({ includeInactive: true })` on `app/admin/products/page.tsx`; `ProductModal` product-level Switch for catalog visibility; **หมวดหมู่** filter: **Photo 3N** (`FLOWERING_DB_PHOTO_3N`) → `flowering_type = photo_3n`; **Photo / Photoperiod** category (`CATEGORY_NAME_PLAIN_PHOTO`) → `categoryFilterMode: plain_photo` → `.or(flowering_type IN photoperiod|photo, OR null FT + category_id)` — excludes `photo_3n` / `photo_ff`; combines with `breeder_id` via AND.
  - **Manual inventory sync** — `POST /api/admin/inventory/sync`: updates set `is_active: true` on variants (fixes grid vs inactive mismatch); create when `stock|price|cost` > 0; `unit_label` normalized; `toVariantSku`; after sync, manual page calls `fetchGrid()` (per-row / strain save / batch).
  - **Admin inventory list** — `GET /api/admin/inventory`: no `is_active` filter on variants (all packs); order `product_id`, `is_active` desc, `id`; `app/admin/inventory/page.tsx` groups with sorted variants, `{n} SKU(s)` = `variants.length`, `cache: "no-store"` + `router.refresh()` on refetch; inactive rows show badge.
  - **Photo 3N (Triploid)** — `products.flowering_type` = `photo_3n`; URL `?ft=photo-3n`; `catalogFloweringBucket` + `productMatchesCatalogFtParam` (`lib/seed-type-filter.ts`, `normalizeFloweringFromDb`); **`flowering_type` NULL + category `Photo`/`Photoperiod`** → plain **Photo** bucket + **PHOTO** card chip (`CATEGORY_NAME_PLAIN_PHOTO`, `catalogBucketFromCategoryLabelOnly`); shop pills + grid list stay isolated from plain Photo; Admin Manual Grid — `wherePhotoCategoryStrict` excludes `photo_3n`/`photo_ff`; dropdown `categoryOptionsForGrid` dedupes **Photo 3N** sentinel; `lib/constants.ts`; locales `photo_3n`; ProductModal + Zod + `FLOWERING_TYPES`; inventory category badge; `product_categories` seed name `Photo 3N`; badges via `productCardFloweringChipLabel` / `labelFloweringType`.
  - **Shop filters mobile sheet** — `useMediaQuery("(min-width: 1024px)")` in `app/(storefront)/shop/page.tsx`; below `lg`, `ShopFilterMobileSheet` (shadcn `Sheet`, blurred overlay) replaces inline sidebar; header title + close, scroll body `FilterSidebarContent`, footer **ล้างทั้งหมด** / **แสดงผล (n) รายการ**; desktop: two-column `lg:grid-cols-[280px_minmax(0,1fr)]` + `lg:items-stretch`; sticky strip (pills + search) `top-20`/`sm:top-28` `z-40` `bg-white` (no `overflow-*` on shop root); `FilterSidebar` `lg:top-[230px]` + `lg:max-h-[calc(100vh-230px)]`; scroll area `pt-4`; ribbon not sticky; filter toggle `lg:hidden`; grid `lg:grid-cols-3`; `hooks/use-media-query.ts`, `components/ui/sheet.tsx` overlay blur.
  - **Flowering type `photo_ff`** — Admin `ProductModal` select + `lib/validations/product.ts` Zod; `lib/cannabis-attributes.ts` (`normalizeFloweringFromDb`, `isPhotoperiodLikeDb`, `isPhotoFfDb`, `labelFloweringType`); `lib/seed-type-filter.ts` breeder keys + `labelForFloweringSlug`; DB column remains **string** (no Postgres enum). If save fails elsewhere, add `photo_ff` to any strict enum/check.
  - **`lib/sanitize-product-text.ts`** — strips legacy inline `font` / `color` / color-bearing `style` from product text fields; wired in `services/product-service.ts` (`getProductBySlug`, `getActiveProducts`); public **`GET /api/products/[slug]`** returns the same normalized payload.
  - **Checkout / payment order summary** — `components/storefront/CheckoutPageClient.tsx` + `app/(storefront)/payment/[orderNumber]/page.tsx`: minimalist summary header (status pill), clearer subtotal/total labels; `components/storefront/LineParcelTrackingCta.tsx` + `lib/line-oa-url.ts` (`NEXT_PUBLIC_LINE_OA_URL`, fallback `https://lin.ee/OcxDMjO`); `app/(storefront)/order-success/page.tsx` — primary LINE CTA uses `lineOaUrlWithOrderHint` (prefill text for `line.me/R/oaMessage/...` only).
- **Next steps:** Ready for **production deployment** and **testing with real users** (smoke-test checkout, product detail, mobile layouts).

### Inventory flexibility — draft mode (status)
- **Current status:** **100% Completed (Inventory Flexibility Refactor — Draft Mode)** — save product metadata before commercial fields are ready.
- **Logic:** `lib/validations/product.ts` — Zod allows **`price: 0`**, **`variants: []`**, and preprocess strips empty pack rows; `ProductSchema` no longer requires `min(1)` variants.
- **Automation:** **`deriveProductIsActiveForCatalog`** — sets **`products.is_active = false`** when there are no packages or total variant stock is 0, so drafts stay off the storefront; wired in **`POST /api/admin/products`** and **`PATCH /api/admin/products/[id]`**; **`createProductWithVariants`** skips inserting variants when the array is empty; **`PATCH`** skips `insert` when empty.
- **UI/UX:** **`components/admin/ProductModal.tsx`** — remove last pack row allowed, hint when no variants, label notes draft workflow; partial save for THC/genetics/descriptions without packs/prices.

### Theme (global) — technical reference
- **Premium Eco-Clinical** — `app/globals.css` `:root` HSL (Deep Forest Teal `--primary`, Rich Lavender `--secondary`, Vibrant Electric Mint `--sativa`, Fresh Mint `--accent`, `--radius` 0.75rem); `tailwind.config.ts` semantic `hsl(var(--*))` incl. `sativa`; legacy `emerald-*` / `violet-*` / `teal-*` replaced with tokens where appropriate in storefront-focused paths.
- **Storefront product detail** — `ProductSpecs.tsx` genetic bar + `product-detail-client.tsx`: StatCard / SpecRow icons `text-primary`; CBD chip `bg-secondary text-secondary-foreground`.

## 1. System Overview

A **premium Seed Bank Management System** with integrated AI Inventory, CRM, POS, and Automated Accounting. Built for retail and wholesale cannabis seed sales with full Thai localization, loyalty points, and multi-channel order fulfillment.

---

## 2. Completed Modules & Features

### Inventory 2.0
- **Admin product draft save** — See **§ Inventory flexibility — draft mode** above (`deriveProductIsActiveForCatalog`, optional variants, `price` ≥ 0).
- **AI Genetic Extractor** — Gemini 1.5 / OpenAI GPT-4o (default for OpenAI path); multimodal image upload; THC range → max; `cbd_percent` stored as free-form text (`prisma` `String?`); auto-fill genetics, THC/CBD, Indica/Sativa, effects, flavors (`services/ai-extractor.ts`, `ProductModal` CBD text field)
- **Genetic Mapping** — Strain dominance (Mostly Indica / Mostly Sativa / Hybrid 50/50); filter in Manual Grid, POS, Shop, and Dashboard
- **Manual Grid** — Bulk editing by Breeder + Category; **Smart columns** — `collectPackSizesFromRows` includes a pack only if some row has `byPack` **stock > 0 or price > 0**; `mergeUniqueSorted(extraPackSizes)` **Always show** keeps empty columns for new entry; `GET /api/admin/inventory/grid` unions breeder sizes + `manual_grid_extra_packs` + per-product `parsePackFromUnitLabel` variant labels; auto-SKU generation; inline stock/price; Sync to main catalog; PNG/PDF export; **PDF catalog** (`InventoryPdfDocument.tsx`) — no photo column; 535pt grid (NO 20, NAME 145, CAT 45, GEN 65, PACK 65 = Stk 25 + Price 40 × n packs), mirrored header/data, vertical rules, zebra, category bar full width; **Add Strain** prepends draft row + auto-focus **strain name** (not Master SKU); **Sync New Items** batch on filtered grid (sequential `await`, toast progress, confirm dialog, local `gridRow` merge, no mid-batch refresh); search field clear (X); pack **EditableCell** clears zero on focus; header/row checkboxes include drafts; **types** — `InventoryRow` / `InventoryPackCell` / `InventoryVariant` in `manual/page.tsx`; toasts on failed category/breeder/grid load; **Grid API** — `breeder_id` OR null-`breeder_id` + `master_sku` prefix; optional `?debug=1`; sync sets `breeder_id` when null; **หมวดหมู่ Photo 3N** — `categoryOptionsForGrid` merges `{ id: FLOWERING_DB_PHOTO_3N, name: "Photo 3N" }`; sync sends `flowering_type: photo_3n` (not numeric `categoryId`); `GET /api/admin/inventory/grid` + sync response map `flowering_type` → dropdown `categoryId`/`floweringType`; **row order** — `sortedRows` pins unsynced (`isManualGridRowUnsynced` / `syncStatus` pending / negative `productId`) then category + name; **New** badge on index column
- **AI Sheet Import** — `/admin/inventory/ai-import`: Google Sheet/CSV → `lib/ai-import-sheet-parse.ts` (Thai headers, จำนวน Pack N / Pack N Price, หมด→0, section rows Photoperiod/Auto) → Master SKU `toBreederPrefix`-name-type; **Import selected → Manual Grid** (`lib/manual-grid-import-handoff.ts`); Firecrawl + Claude → breeder match → images + SEO; see **§7.1**
- **Media Auto-Compression** — WebP compression (max 0.8MB, 1200px) for product images; 40×40 thumbnails
- **Low Stock Alert System** — Per-variant `low_stock_threshold`; AdminSidebar badge; LowStockWidget; Manual Grid highlight; filter "สต็อกต่ำเท่านั้น"

### CRM & Loyalty
- **Tiered Pricing** — Retail / Wholesale / VIP; `wholesale_discount_percent` per customer; POS auto-applies tier pricing
- **Automated Points System** — Earn 100 THB = 1 Point; Redeem 1 Point = 1 THB; POS redemption UI; atomic order transaction
- **Soft Delete** — `is_active` on customers; no hard delete for data integrity

### Advanced POS
- **Auto-Promotion Engine** — DISCOUNT (min_spend → discount_value), BUY_X_GET_Y (target_breeder_id), FREEBIES (min_spend → gift eligible); promo badge, summary line, alerts
- **Tiered Discounts → Promotion System** — Tiered (ยอดซื้อรวม) merged into PromotionRule type DISCOUNT; `/api/storefront/tiered-discounts` reads from `promotion_rules`; hierarchy: Promotion first, Coupon disabled when promotion active; POS labels: "ส่วนลดโปรโมชั่น" vs "ส่วนลดโค้ด"
- **Real-time Tier Pricing** — Wholesale discount applied on add-to-cart; customer switch clears cart when tier changes
- **Points Redemption UI** — Available points, max redeemable, balance after purchase; `promotion_rule_id` + `promotion_discount_amount` persisted

### Daily Reports
- **Sales Breakdown** — By payment method (Cash, Transfer, COD, Crypto)
- **Top 5 Best Sellers** — By quantity sold
- **Print-ready Daily Summaries** — A4 layout; date picker; excludes VOIDED orders from revenue

### Safety Net
- **Void/Refund Logic** — PATCH `/api/admin/orders/[id]/void`; atomic transaction: status → VOIDED, restore stock, revert points, adjust total_spend; optional `void_reason`; cannot void already VOIDED
- **Confirmation Dialog** — "แน่ใจหรือไม่? การยกเลิกจะคืนสต็อกและปรับคะแนนลูกค้าอัตโนมัติ"
- **VOIDED Badge** — Grey badge in Order List and Detail Modal

### Blog System (Digital Magazine Phase 1)
- **Schema** — `blog_categories` (id, name, slug, description, sort_order); `affiliate_links` (title, url, platform_name, image_url); `blog_posts` extended: `category_id` FK, `is_highlight`, `view_count`, `manual_rank`; `site_settings.key = magazine_trending_mode` (`auto` | `manual`). Migration `20260328120000_magazine_phase1`.
- **BlogPost Model** — id, title, slug (unique), content (JSON/Tiptap), excerpt, featured_image, author_id, status (DRAFT/PUBLISHED), published_at, tags (String[]), related_products (BigInt[]), category, carousel/trending fields above.
- **Service** — `lib/blog-service.ts`: `getHighlightPosts`, `getTrendingPosts`, `getSmartProducts`, `getMagazineTrendingMode` / `setMagazineTrendingMode`; `getBlogCategories`, `getRecentPublishedPosts`, `getPublishedPostsByCategorySlug`.
- **Storefront Magazine home (Step A)** — `app/(storefront)/blog/page.tsx`: dark `#050505`, Playfair + Inter; `MagazineHeroCarousel` (fade autoplay, highlight posts), `MagazineTrending` (ranked list, `magazine_trending_mode`), `MagazineCategoryPills` (`?category=`), `MagazineLatestGrid`; `revalidate` 300.
- **Storefront Magazine article (Step B)** — `app/(storefront)/blog/[slug]/page.tsx`: Prisma `blog_posts` + `tiptapJsonToHtml` (`@tiptap/html` + StarterKit); `splitForSmartTieIn` + `SmartTieInStrip` (`getSmartProducts` ×2); `parseArticleSegments` + `AffiliateProductCard` (`[AFFILIATE:id]`, legacy inline paragraph); `POST /api/blog/view` + `BlogViewTracker`; breadcrumbs, read time, related ×2; `AffiliateEmbedPicker` inserts `[AFFILIATE:id]`.
- **Magazine SEO (Step C)** — `generateMetadata`: title `| Tommy Smile Seed Magazine`, excerpt or 160-char body, OG/Twitter + `created_at` / `modifiedTime`, default OG via `NEXT_PUBLIC_DEFAULT_OG_IMAGE` or `/og-default.png`; `MagazineArticleJsonLd` (schema.org Article); blog index static metadata TH; `MagazineArticleShare` (Facebook, LINE, copy); `lib/magazine-seo.ts`.
- **Growth & automation (Phase 3)** — `newsletter_subscribers` (email unique, status active/unsubscribed); `POST /api/newsletter/subscribe` (Zod, `rateLimitIp` 8/15m); `NewsletterBox` + `subscribeToNewsletter` server action on blog posts; `app/sitemap.ts` (home, shop, blog, breeders, published posts, active products with slug → `/product/[slug]`); `app/robots.ts`; root `metadataBase`; canonicals on blog + shop/breeders layouts + product `generateMetadata`; `lib/shimmer-blur` + hero/grid/featured `placeholder="blur"`; `next.config` `minimumCacheTTL` 60.
- **Magazine mock seed** — `lib/mock-magazine-data.ts` (3 categories TH copy, 2 affiliates Shopee/Lazada, **11 posts all PUBLISHED**, **3× `[SMART_TIE_IN]`** + 1× `[AFFILIATE:id]`); `export seedMagazine()` in `prisma/seed-magazine.ts` (CLI when path includes `seed-magazine`); `prisma/seed.ts` calls `seedMagazine()` after product seed; `npm run seed:magazine` or `npx prisma db seed`.
- **Storefront API** — `GET /api/magazine/highlight`, `GET /api/magazine/trending` (optional `?mode=`).
- **Admin API** — `GET/PATCH /api/admin/magazine/settings`; `GET/POST /api/admin/blog/categories`; `GET/POST /api/admin/affiliate-links`; `GET /api/admin/blog` query `categoryId`, `status`, `q`.
- **Admin UI** — `/admin/magazine` command center (trending mode, carousel HL, filters, posts table, TipTap create/edit, uploads); `/admin/blog` and `/admin/blog/create` and `/admin/blog/[id]/edit` redirect to magazine equivalents.
- **Magazine CMS (WordPress-style)** — `/admin/magazine` list (title, status, created, edit/delete); `/admin/magazine/new` + `/admin/magazine/[id]/edit` with `MagazinePostForm` + `MagazineTiptapEditor` (toolbar: bold/italic, H1–H3, bullet list, blockquote, horizontal rule; JSON → `blog_posts.content`); Server Actions in `app/admin/magazine/actions.ts` (`createMagazinePost`, `updateMagazinePost`, `deleteMagazinePost`, `deleteMagazinePostFormAction`); slug from `generateSlug` + debounced title + “Regenerate from title”; categories from `blog_categories`; **featured image** — `ImageUploadField` (client `browser-image-compression` via `lib/image-optimizer.ts`, “Optimizing…” / “Uploading…”, toast + line `Compressed: … → …`) + paths `posts/…` in bucket `magazine` (`lib/supabase-upload.ts`, `POST /api/admin/magazine/upload` service-role); tags comma-separated; sticky header actions (Save draft / Publish); dark layout; `AdminSidebar` → Magazine CMS.
- **Product tie-in (Magazine)** — `blog_posts.related_products` (BigInt[]); admin: `RelatedProductsSection` + `GET /api/admin/magazine/products` (`q` search, `ids` for chip labels); `MagazineSaveInput.related_product_ids` → Prisma `related_products`; TipTap **Insert Product Card** (`ShoppingBag`) + `MagazineProductPickerDialog` inserts `[PRODUCT_CARD:id]`; storefront: `parseArticleSegments` (`productId`) + `MagazineProductStoryCard` + `getMagazineProductsByIds` (`lib/blog-service.ts`); **`ShopTheStorySection`** after article body on `app/(storefront)/blog/[slug]/page.tsx`.
- **AI Outline Suggest** — POST `/api/admin/blog/ai-suggest` uses OpenAI to generate blog outlines from topic
- **Create/Edit Pages** — Tiptap rich text editor; AI outline → apply to editor; DRAFT/PUBLISHED; tags
- **Admin product gallery (Smile image pipeline)** — `ProductModal`: `ProductImageUpload.tsx` — multi-file select (≤5), `galleryUrls` order = save order; grid preview (`รูปหลัก` on first), `@dnd-kit/core` + `@dnd-kit/sortable` reorder, per-thumb remove; drop zone + `multiple` input disabled at full; same `compressImageForMagazineUpload` (1200px / ~0.8MB) + `validateMagazineImage*` + `uploadProductImage` / `POST /api/admin/products/upload` → `image_url`…`image_url_5` + `image_urls`; Manual Grid still uses `processAndUploadImages` (updated to same compressor + API).

### Storefront Checkout (payment preview)
- **Shipping fee — single source of truth** — `lib/order-financials.ts`: `QUOTATION_SHIPPING_FREE_THRESHOLD` (1000), `QUOTATION_SHIPPING_COST` (50), `shippingFeeForSubtotal` / `defaultQuotationShippingFee` (free when subtotal ≥ threshold, aligned with DB `shipping_rules`). `lib/cart-utils.ts` `calculateShipping` uses a matching `shipping_rules` row when present and numeric; otherwise falls back to those constants. Cart UI uses `calculateCartSummary` → `summary.shipping` only (`hooks/useCart` does not duplicate shipping math). Quotations / quotation PDF use `defaultQuotationShippingFee`.
- **Admin shipping rules** — `/admin/settings/shipping`: edit `base_fee` + `free_shipping_threshold` for `shipping_rules.category_name = Seeds` (`lib/storefront-shipping.ts`); `GET`/`PUT` `/api/admin/settings/shipping` (service role + middleware ADMIN); form defaults `lib/validations/shipping-admin.ts` (50 / 500) when no row; after save, `BroadcastChannel` `ssb-shipping-rules` triggers `useCart` to refetch `shipping_rules`.
- **Server-side payment settings** — `fetchCheckoutPaymentSettings()` in `lib/payment-settings-public.ts` uses `createClient` from `lib/supabase/server`; `.select('id, bank_accounts, prompt_pay')` only (no `line_id` / `crypto_wallets` / `messenger_url` on checkout); maps JSON to public `PaymentSetting` type; `app/(storefront)/checkout/page.tsx` async + `Suspense` / `loading.tsx`; UI in `components/storefront/CheckoutPageClient.tsx` (Card + `next/image` for QR); TH/EN via `useLanguage().t`
- **`payment_settings` in Supabase types** — `PaymentSettingsRow` + `Tables.payment_settings` in `types/supabase.ts`
- **Order confirmation email (Resend)** — `lib/email-order-confirmation-html.ts` (`buildOrderConfirmationHtml`, `loadPaymentBlocksForEmail` from global payment settings); product rows: name + breeder + genetics + type (`fetchEmailItems` / `EmailItem` in `lib/services/order-service.ts`); bank + PromptPay QR when `TRANSFER` + `PENDING`/`PENDING_PAYMENT`; LINE CTA via `lineOaUrlWithOrderHint` (`NEXT_PUBLIC_LINE_OA_URL` + fallback); `services/email-service.ts` `sendOrderConfirmationEmail`; `POST /api/storefront/orders` passes `orderStatus: "PENDING"`.

### Product SEO slugs (DB + service)
- **`products.slug`** — Prisma `String? @unique` + migrate comment (`prisma/schema.prisma`)
- **`lib/product-utils.ts`** — `generateSlug`, `resolveProductSlugFromName`; Thai-only names → deterministic `p-{hex}` fallback
- **`services/product-service.ts`** — `getProductBySlug`, `ensureUniqueProductSlug`, `createProductWithVariants` (auto slug + collision suffix), `backfillProductSlugs()`
- **Admin API** — `POST/PATCH` `app/api/admin/products/...` — PATCH resolves slug via service; POST defers slug to `createProductWithVariants`

### Storefront breeder logos
- **`resolvePublicAssetUrl()`** — `lib/public-storage-url.ts` (relative storage paths → full public URL)
- **`BreederLogoImage`** — `components/storefront/BreederLogoImage.tsx`: fixed `width`/`height`, `alt` = `{name} logo`, `onError` → letter-in-circle fallback; wired on `app/(storefront)/shop/page.tsx`, `app/(storefront)/page.tsx`, `app/(storefront)/product/[slug]/page.tsx`, `app/(storefront)/breeders/page.tsx`, `components/storefront/BreederRibbon.tsx`
- **`next.config.mjs`** — `images.remotePatterns` from `NEXT_PUBLIC_SUPABASE_URL` + storage pathname; fallback host `jysdfxxilyjmjdmhazbu.supabase.co` (correct spelling)

### Storefront shop breeder filter (URL `?breeder=`)
- **`lib/breeder-slug.ts`** — `breederSlugFromName` (from `generateSlug`), `shopBreederHref`, `resolveBreederFromShopParam` (slug preferred, legacy numeric id); invalid param → `router.replace("/shop")` on shop page.
- **`app/(storefront)/shop/page.tsx`** — resolves breeder from query; numeric id URLs rewrite to slug; filter grid empty while invalid after load; **`BreederRibbon`** — `activeBreederSlug` + `shopBreederHref` per card.
- **Links** — `product-detail-client.tsx`, `app/(storefront)/page.tsx`, `breeders/page.tsx` use `shopBreederHref` (not `breeder` id).

### Breeder detail — flowering type pills (`?type=`)
- **`lib/seed-type-filter.ts`** — `resolveCategoryLabelForFilters` (FK `product_categories.name` then `category` string); `collectionKeyFromCategory` (original substring, FF / fast flowering / fast version); short labels Auto / Photo / Fast; `breederDisplayTypeKeyFromProduct` + `labelForBreederDisplayTypeSlug`.
- **`lib/supabase/types.ts`** — `PRODUCT_SELECT_*` embeds `product_categories(id, name)` on shop/product list queries.
- **`components/storefront/BreederTypeFilter.tsx`** — horizontal scroll pills for flowering types; hidden when ≤1 distinct type for that breeder’s stock.
- **`app/(storefront)/shop/page.tsx`** — when `?breeder=` is set, counts + filter by `flowering_type`; `?type=` sync via `router.replace`.

### Shop filter sidebar (breeder-aware)
- **`lib/shop-attribute-filters.ts`** — multi-select query `genetics`, `difficulty`, `thc` (comma-separated); matches `strain_dominance`, `growing_difficulty`, `thc_percent`.
- **`components/storefront/FilterSidebar.tsx`** — `FilterSidebarContent` shared; desktop `FilterSidebar` card; **`ShopFilterMobileSheet`** (`< lg`) with sticky footer; breeder row when not `?breeder=`; attribute checkboxes (Teal/Lavender) in breeder context; no category pills (top `BreederTypeFilter` covers types).
- **`shop/page.tsx`** — strips `genetics`/`difficulty`/`thc` without breeder; **Clear all** with breeder keeps `?breeder=` + `?type=`; clears sidebar attribute params only; mobile filter toggle opens sheet (`id="shop-filters"`).

### Sales & Document Module
- **Executive Dashboard v1** — `/admin/dashboard`; `GET /api/admin/dashboard/stats?range=7|30|month`; `GET /api/admin/dashboard/orders-export` + `lib/export-utils` (`xlsx`) ส่งออก Excel ตามช่วง; toast กำลังเตรียม/สำเร็จ; `lib/dashboard-date-range` ใช้ร่วม stats/export; Top 5 strains pie: `topStrains.breederName` จาก join `products`/`breeders`; legend/tooltip `ชื่อสาย (Breeder)` ใน `app/admin/dashboard/page.tsx`; empty state เมื่อ `totalRevenue===0` และ `orderCount===0` — placeholder กราฟ, CTA `/admin/quotations/new`, ข้อความตารางออเดอร์/Top Spenders
- **Quotations** — history + Tabs; PDF ชื่อไฟล์ `lib/pdf-filename`; แปลงออเดอร์ + `source_quotation_number`; สถานะ `SHIPPED` เมื่อออเดอร์ถูก mark ship (`markShipped` → `prisma.quotations.updateMany` จาก `convertedOrderId` หรือ `quotationNumber`); UI badge "ส่งแล้ว (ปิดดีล) ✅"; toast อัปเดตใบเสนอราคาใน `/admin/orders` เมื่อ `quotationStatusSynced`
- **Quotation customer autocomplete** — ชื่อลูกค้า: debounce 300ms → `GET /api/admin/customers?q=` **omni** = `Customer` (POS) + `public.customers` + ที่มาจาก `quotations` (ROW_NUMBER ต่อเบอร์ normalize); q ใช้ `qNorm`/`qDigits` สำหรับเบอร์; รวมผล `dedupeOmni`; บันทึกใบเสนอราคา → `captureWebCustomerLeadFromQuotation` สร้าง `public.customers` ถ้ายังไม่มีเบอร์นั้น; UI `applyOmniCustomer` เติม email/notes; dropdown z-[200]
- **Convert Quote to Order** — Button on orders page; calls `/api/admin/inventory/deduct` to deduct stock and create order
- **Receipt PDF** — `/admin/orders`: `ReceiptPreviewModal` (iframe blob + ดาวน์โหลด/พิมพ์); fresh GET before preview; eligible statuses PAID/COMPLETED/SHIPPED/DELIVERED; navy theme; CreateOrderModal = quotation/order only; `receipt-pdf`: `orderFinancials` จาก `orders.shipping_fee` / `discount_amount`; ไม่มีข้อความค่าจัดส่งสำเร็จรูป; `lib/order-financials` = threshold ใบเสนอราคา
- **Orders financial columns** — `orders`: `shipping_fee`, `discount_amount`, `total_amount`, `total_cost` เป็น `@db.Decimal(12, 2)` ใน `schema.prisma`; migration `20260309120000_orders_financial_decimal_12_2` (ADD IF NOT EXISTS + ALTER precision); `db push` / `migrate deploy` ให้ DB ตรง schema; **quotations (Prisma):** `shippingCost` / `discountAmount` / `totalAmount` + `@map` คอลัมน์ snake_case, `shippingCost` NOT NULL default 0; `quotation_items.discount` `@map("discount")`; API POST/PATCH ใช้ camelCase + `Prisma.Decimal`; convert → `createManualOrderFromItems`; `POST /api/admin/orders` คำนวณ `total_amount = itemsSum + shipping_fee - discount_amount`
- **Deduct API** — POST `/api/admin/inventory/deduct`; items, totalAmount, customer; creates COMPLETED order + order_items, decrements variant stock
- **Quotation PDF Fixes** — logo/pdf-settings Base64; เลขที่ SSB-QT via POST `/api/admin/quotations/number`; `CreateOrderModal` คงไว้ใน repo แต่ Manual Grid ไปที่ quotations/new แทน

### LINE Messaging API Alerts
- **Low Stock** — Triggered after successful order (POS) when any variant's stock ≤ `low_stock_threshold`; push to Admin LINE
- **Void Order** — Triggered when an order is voided; includes order number, amount, and reason
- **Daily Closing** — Triggered when "บันทึก Snapshot" is pressed; sends daily sales total and order count
- **Admin UI** — Settings page: status check + "ทดสอบส่งข้อความ" button; fire-and-forget (errors logged, no crash)
- **Claim order / public track (Plan B — standard LINE OAuth 2.0, no LIFF)** — `orders.line_user_id`; migration `20260406120000_orders_line_user_id`; `POST /api/admin/orders/simple` returns `orderId`; `components/admin/PosMiniInvoiceModal.tsx` — track link ผ่าน `getSiteOrigin()` / `NEXT_PUBLIC_SITE_URL`; `GET /api/track/[orderId]`; **LINE OAuth:** `LINE_LOGIN_CHANNEL_ID` + `lib/get-url.ts` (`getSiteOrigin`) → `GET /api/line/login?orderId=` → `GET /api/line/callback` (Prisma `line_user_id`) → `/track/[orderId]?success=true` หรือ `?error=auth_failed`; `app/(storefront)/track/[orderId]/page.tsx` — ปุ่ม Connect LINE; optional `POST /api/track/[orderId]/claim`; `markShipped` → `pushTextToLineUser`

---

## 3. Technical Architecture

| Layer | Stack |
|-------|-------|
| **Framework** | Next.js 14 (App Router) |
| **ORM** | Prisma 7 + Driver Adapter (pg) |
| **Database** | Supabase (PostgreSQL) |
| **Serialization** | `lib/bigint-json.ts` — BigInt → string for JSON responses |
| **Styling** | Tailwind CSS, Sage Green / Zinc design system |
| **UI Components** | shadcn/ui (Button, Card, Badge, Dialog, Table, etc.) |
| **Animations** | Framer Motion |
| **Validation** | Zod |

### Environment Variables (LINE)
| Variable | Purpose |
|----------|---------|
| `LINE_CHANNEL_ACCESS_TOKEN` | Messaging API token (from LINE Developers Console) |
| `LINE_CHANNEL_SECRET` | Channel secret (for webhook validation if needed) |
| `LINE_ADMIN_USER_ID` | Admin's LINE User ID — receives all alerts (Low Stock, Void, Daily Summary) |
| `LINE_LOGIN_CHANNEL_ID` | LINE Login channel id — `client_id` for `/api/line/login` (track OAuth) |
| `LINE_LOGIN_CHANNEL_SECRET` | Same LINE Login channel — `/api/line/callback` token exchange |
| `NEXT_PUBLIC_SITE_URL` | **Canonical site URL** — `lib/get-url.ts` (`getURL` / `getSiteOrigin`); LINE OAuth `redirect_uri`, metadata, sitemap, emails; set to production domain (e.g. `https://smile-seed-bank.vercel.app`). If unset locally, `getURL()` falls back to `VERCEL_URL` then `http://localhost:3000/` |
| `NEXT_PUBLIC_LINE_OA_URL` | LINE Official Account URL — `lib/line-oa-url.ts`; order success + parcel CTA; fallback `https://lin.ee/OcxDMjO` |

---

## 4. Current Health

| Metric | Status |
|--------|--------|
| **Stability** | 100% — No known crashes; BigInt handling implemented |
| **Data Integrity** | Prisma transactions for orders, void, stock; Soft deletes for customers |
| **UI/UX** | Consistent design system; strikethrough pricing for wholesale; intuitive alerts (promo, low stock, void) |
| **Build** | `npx next build` → 0 errors, 0 warnings |

---

## 5. Future Roadmap

1. **Analytics** — Monthly/Yearly sales trends; revenue charts by period
2. **Customer Portal** — Let customers check their own points and order history (Profile page exists; enhance with points display)
3. **Integration** — LINE webhook for customer messages (optional)

---

## 6. Last Updated

### Source of truth — March 31, 2026 *(next session: start here)*

**0. Storefront settings RLS (Supabase)**
- Migration `supabase/migrations/20260331120000_site_store_settings_public_select_rls.sql`: `site_settings` — `anon`/`authenticated` SELECT only whitelisted keys (logos, hero, company, legal, social); admin-only keys (e.g. `tiered_discount_*`) via service role. `store_settings` — public SELECT for brand row (logo_url, contact).
- `lib/storefront-site-setting-keys.ts` + `GET /api/storefront/site-settings`: `.in("key", ...)` mirrors RLS whitelist (includes `hero_bg_mode`, `hero_svg_code`).

**1. Database & schema standardization**
- Cannabis attributes split: `flowering_type` = `photoperiod` \| `autoflower`; `sex_type` = `feminized` \| `regular` (no autoflower in sex column).
- SQL migration cleans legacy rows and maps old “Autoflower” / `AUTO` / `PHOTO` style data: `supabase/migrations/20260330120000_products_flowering_sex_standardize.sql`.
- Normalization helpers + null-safe DB wrappers: `lib/cannabis-attributes.ts` (`normalizeFloweringFromDb`, `normalizeSexFromDb`, `normalizeFloweringTypeFromDb`, `normalizeSexTypeFromDb`, `labelFloweringType`, `isAutofloweringDb`, `isPhotoperiodDb`).
- Related: `lib/validations/product.ts`, `types/supabase.ts`, `services/ai-extractor.ts`, `prisma/schema.prisma` (comments), `app/api/admin/inventory/route.ts` (category fallback).

**2. AI Scanner upgrade (batch / Read & Discard)**
- Extraction images: base64 to API only — **not** written to Supabase storage or product gallery (`components/admin/ProductModal.tsx`).
- **Staging area:** up to **5** images, thumbnails, per-image remove; extract **only** on ✨ button; clear staging after successful extract; **5MB** per-file guard + toast; rotating loading copy while `aiPending === "scanner"`.
- **Unified context:** `POST /api/ai/extract` sends **textarea + all staged images** together (`services/ai-extractor.ts` multimodal).

**3. Frontend UI/UX (storefront product detail)**
- Genetics vs lineage: **Genetics** row shows `genetic_ratio`; **Lineage** row shows `lineage` (`app/(storefront)/product/[slug]/page.tsx`).
- **Smart hide:** Genetics row omitted if `genetic_ratio` is empty or **identical** to `lineage` (`shouldShowGeneticsRow`, `normalizeSpecCompare`); duplicate caption under Indica/Sativa bar removed.
- Icons: **Lucide** `Dna` (Genetics), `GitFork` (Lineage) in specs + Description summary.

**4. Deployment**
- Production deploy on **Vercel** completed; database migration applied / integrity verified after cannabis-attribute standardization.

---

**March 28, 2026** — `app/api/ai/extract/route.ts` re-export `POST` จาก `admin/ai-extract`; `middleware.ts` ป้องกัน `/api/ai/*` แบบเดียวกับ admin

**March 28, 2026** — `ProductModal` AI Scanner: guard รูป ≤5MB (toast destructive), ข้อความโหลดหมุนทุก 2.5s ระหว่างสแกน

**March 28, 2026** — `components/admin/ProductModal.tsx` — **AI Data Scanner (Read & Discard)**: อัปโหลดรูป → base64 → `POST /api/ai/extract` → เติมฟอร์ม → ไม่เก็บ state รูป / ไม่เข้าแกลเลอรี; Wand = สกัดจากข้อความอย่างเดียว; toast สำเร็จ; แกลเลอรี = marketing เท่านั้น

**March 28, 2026** — `app/(storefront)/shop/page.tsx` — ค้นหาแบบ client-side: `searchTerm`, `searchFilteredProducts` + `filteredProducts` (หมวด/แบรนด์), empty state TH/EN, input `w-full min-w-0`

**March 28, 2026** — `app/api/admin/customers/[id]/route.ts` — parse path `id` ด้วย `z.coerce.bigint` + `error.format()` → 400 แทน 500 เมื่อ ID ไม่ใช่ตัวเลข

**March 28, 2026** — `lib/auth-utils.ts` — `assertAdmin()` (รอบ 2: `getUser` + `user_metadata.role === ADMIN`) สำหรับเรียกใน API route handlers

**March 28, 2026** — `middleware.ts`: ป้องกัน `/api/admin` + `/api/admin/*` (401 + คัดลอกคุกกี้รีเฟรช JWT); ไม่ใช่ ADMIN → `/login?reason=admin_required`; `app/admin/layout.tsx` `dynamic = 'force-dynamic'` + `components/admin/AdminLayoutClient.tsx`

**March 28, 2026** — `components/admin/ProductModal.tsx`: sticky header (`DialogHeader` + `pr-10` เว้นปุ่มปิด), body เลื่อนเดียว `flex-1 min-h-0 overflow-y-auto` (AI + ฟอร์ม), footer ติดล่าง `border-t bg-zinc-50` (ยกเลิก/บันทึก); `DialogContent` `max-h-[90vh] min-h-0 overflow-hidden p-0`

**March 29, 2026** — Google OAuth: `login/page.tsx` → `redirectTo` `${getURL()}auth/callback` (+ `?next=`); `app/auth/callback/route.ts` — `exchangeCodeForSession` + `safeNextPath` → `/profile` หรือ `next`; `lib/safe-redirect-path.ts` — ใช้ร่วม login/callback

**March 29, 2026** — `middleware.ts` (root): `@supabase/ssr` `createServerClient` + cookie refresh; ป้องกัน `/admin` — ไม่มี session → `/login?next=...`; session แต่ `user_metadata.role !== ADMIN` → `/`

**March 29, 2026** — `supabase/migrations/20260329120000_customers_role_sync_auth_metadata.sql` — trigger sync `customers.role` → `auth.users.raw_user_meta_data.role` (JWT ต้อง refresh ถึงจะเห็นค่าใหม่)

**March 29, 2026** — `components/admin/user-nav.tsx` (Supabase `getUser`, role จาก `customers` / metadata, DropdownMenu, sign out → `/login`); `components/ui/dropdown-menu.tsx`; ผูกใน `AdminSidebar` + `app/admin/layout` header; `types/supabase.ts` `Customer.role`

**March 29, 2026** — `customers.role` (`String` default `"USER"`) ใน `prisma/schema.prisma` — รัน `prisma migrate` / `db push` ให้ตรง DB

**March 29, 2026** — `prisma.config.ts` โหลด `.env` แล้ว `.env.local` (override); `.env` ซิงก์ `DATABASE_URL`/`DIRECT_URL` กับโปรเจกต์ `jysdfxxilyjmjdmhazbu`; `db push` ผ่าน

**March 29, 2026** — Pre-prod dashboard audit: `lib/prisma.ts` (`PrismaPg` + URL จาก `DATABASE_URL` / `POSTGRES_PRISMA_URL` / `POSTGRES_URL`); `ordersTableHasFeeColumns` กันคอลัมน์ fee ไม่ครบ; `stats/route.ts` aggregate fee เฉพาะเมื่อ `hasFeeCols`; `prisma.config.ts` + `dotenv/config` (CLI โลคัล) — Vercel: ตั้ง `DATABASE_URL` (build+runtime, pooled) และ `DIRECT_URL` ถ้ารัน migrate จากเครื่อง/CI

**March 28, 2026** — Prisma 7: `datasource` URL ใน `prisma.config.ts` (CLI); `schema.prisma` ไม่มี `url`/`directUrl`; generator ลบ deprecated `driverAdapters` preview; `lib/prisma.ts` ใช้ `datasource` object + `PrismaPg({ connectionString })` (PrismaClient ไม่รับ `datasource: { url }` คู่กับ adapter)

**March 28, 2026** — **Digital Magazine (Phase 1 + product tie-in):** migrations `20260328120000_magazine_phase1`, `20260328160000_newsletter_subscribers`; `lib/blog-service.ts`, `MagazinePostForm`, TipTap `[PRODUCT_CARD:id]`, `ShopTheStorySection`, `GET /api/admin/magazine/products`; admin `/admin/magazine`; redirects จาก `/admin/blog`; storefront `/blog` SEO + newsletter + sitemap/robots.

**March 28, 2026** — **Manual Inventory UX:** ช่องค้นหา — ปุ่มล้าง **X** (`XCircle`, `pr-9`); **Sync New Items** แทน Sync Selected — `isManualGridNewItemReadyToSync`, sync ทุกแถว draft ใน `sortedRows` (มุมมองที่กรองแล้ว), `AlertDialog` ยืนยัน, ปุ่ม Sparkles+RefreshCw, คอลัมน์ Sync ใช้ `RefreshCw` แบบย่อ

**March 28, 2026** — **Manual Grid fast entry:** Add New Strain → โฟกัส **ชื่อสายพันธุ์** (`#manual-grid-strain-name-{productId}`), ไม่โฟกัส Master SKU, `setCurrentPage(1)` + `scrollIntoView` / `rAF`; `EditableCell` (stock/cost/price) — โฟกัสแล้วล้างค่า **0**, blur คืน/บันทึกตามเดิม

**March 26, 2026** — Manual Grid PDF: pixel grid + vertical rules + Photo alignment (`InventoryPdfDocument.tsx`); สรุป AI Sheet Importer + SEO อยู่ **§7.1**

**March 7, 2026** — Quotation PDF: embedded Base64 logo, SSB-QT-YYYYMMDD-XXX numbering, read-only เลขที่, async preview with blob, Thai lineHeight 7.5

---

## 7. สรุปงาน session (มีนาคม 2026)

ไฟล์อ้างอิงหลักอยู่ใน repo ตาม bullet ด้านล่าง (ไม่สร้างไฟล์สรุปแยก)

### 7.1 Session 26 Mar 2026 — AI Product Importer (สมบูรณ์)

| หัวข้อ | รายละเอียด / ไฟล์ |
|--------|-------------------|
| **Pipeline หลังบ้าน** | `services/ai-importer.service.ts` — Firecrawl scrape markdown → Claude (Sonnet, `ANTHROPIC_MODEL` optional) → Zod `AiImporterExtractedSchema` → match breeder → `localizeImage` สูงสุด 5 URL (dedupe `Array.from(new Set)`); `createProductWithVariants` หรือ Prisma `products.update` เมื่อ `master_sku` เดิม; `syncProductStats` |
| **Validation** | `lib/validations/ai-importer.ts` — `images[]` (≤5, unique https, ตัวแรก = hero), `seo: { th, en }` แต่ละภาษา `title` (≤60) + `description` (≤160); transform → `image_url` + `additional_images`; `AiImportRowSchema` (name, breeder, url, price, stock, dryRun) |
| **รูปภาพ** | `services/image-storage.service.ts` — `localizeImage(url, folder)` → bucket `product-images` (`SUPABASE_STORAGE_PRODUCTS_BUCKET`); fallback URL เดิมเมื่อดาวน์โหลด/อัปโหลดล้มเหลว |
| **SEO ใน DB** | `products.seo_meta` JSON — โครงสร้าง `{ "th": { "title", "description" }, "en": { "title", "description" } }`; migration `20260326120000_products_seo_meta` (Prisma + `supabase/migrations`) |
| **API** | `POST /api/admin/import/ai` — `bigintToJson` ใน response; `GET /api/admin/import/sheet?url=` — แปลงลิงก์ Google Sheet หลายรูปแบบ → CSV export (รวม `gid` จาก hash/query) |
| **Admin UI** | `app/admin/inventory/ai-import/page.tsx` — วาง Sheet URL หรือ CSV; Papa Parse; ตาราง + สถานะ; **Start** วนทีละแถว; **Stop** (`AbortController` + ปลด review dialog); **Retry** แถว error (`RefreshCcw`); progress (done+failed)/total; toast จบ batch + เสียง chime; `localStorage` `ai-import-state-v1`; Review Dialog: THC, คำอธิบาย TH, **SEO แบบ Google snippet** TH/EN, กริดรูปสูงสุด 5 (`next/image` unoptimized) |
| **Sidebar** | `components/admin/AdminSidebar.tsx` — ลิงก์ "AI Import" → `/admin/inventory/ai-import` |
| **Manual Grid (งานก่อนหน้าใน session)** | `app/admin/inventory/manual/page.tsx` — แถว draft ใหม่ด้านบน; **Sync New Items** (filtered view, confirmation); ค้นหา + ล้าง X; `mergeSyncedGridRow` + `POST /api/admin/inventory/sync` (`gridRow`) |
| **Env** | `FIRECRAWL_API_KEY`, `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL`, optional `SUPABASE_STORAGE_PRODUCTS_BUCKET` |

| หัวข้อ | รายละเอียดสั้น / ไฟล์ |
|--------|----------------------|
| **Dashboard** | Top 5 strains: join `products`/`breeders`, legend `ชื่อ (Breeder)`, `Unknown Breeder` + toast; empty state เมื่อ revenue+orders = 0; `hooks/useExecutiveStats.ts`, `app/api/admin/dashboard/stats/route.ts`, `app/admin/dashboard/page.tsx` |
| **Quotations API** | `shippingCost` / `discountAmount` / `totalAmount` + `Prisma.Decimal`; schema `shippingCost` NOT NULL default 0; PATCH nested items เป็น Decimal — `app/api/admin/quotations/route.ts`, `[id]/route.ts`, `prisma/schema.prisma` |
| **Orders financial** | `shipping_fee`, `discount_amount`, `total_amount` Decimal(12,2); `createManualOrderFromItems` ใช้ `total_amount` / `shipping_fee` / `discount_amount` + Decimal; `POST /api/admin/orders` คำนวณ total ฝั่งเซิร์ฟเวอร์ — `lib/services/manual-order-create.ts`, `app/api/admin/orders/route.ts`, `orders/simple/route.ts`, migrations `20260309120000_*` |
| **เลขออเดอร์ ↔ ใบเสนอราคา** | แปลง QT→OR (`-QT-`→`-OR-`); `orders.order_number` VARCHAR(48); `source_quotation_number`; `lib/pdf-filename.ts` (ชื่อไฟล์ QT_/RE_); UI `doc.save` / `ReceiptPreviewModal` — `convert/route.ts`, migration `20260311120000_*` |
| **ประวัติใบเสนอราคา** | Tabs ทั้งหมด / รอจัดการ / แปลงแล้ว + `lifecycle` query; sort `updatedAt`; badge ปิดดีล / ส่งแล้ว — `app/admin/quotations/page.tsx`, `app/api/admin/quotations/route.ts` GET |
| **Ship → ใบเสนอราคา** | `markShipped` อัปเดต `quotations.status = SHIPPED` (convertedOrderId หรือเลข QT); API ตอบ `quotationStatusSynced`; toast ใน `app/admin/orders/page.tsx`; badge "ส่งแล้ว (ปิดดีล) ✅" — `services/orders-service.ts`, `app/api/admin/orders/[id]/status/route.ts` |
| **สคริปต์ DB** | `scripts/merge-rainbow-melon-products.sql` — merge duplicate Rainbow Melon / orphan products |
| **Checkout payment** | `lib/payment-settings-public.ts`, `components/storefront/CheckoutPageClient.tsx`, `app/(storefront)/checkout/page.tsx` + `loading.tsx`; `types/supabase.ts` `payment_settings` |
| **อื่น** | `types/supabase.ts` Order; zod รองรับ `SHIPPED` บน quotations POST/PATCH; `docs/blueprint/6_PROJECT_STATE.md` (section 2 bullets อัปเดตคู่กับงานด้านบน) |
