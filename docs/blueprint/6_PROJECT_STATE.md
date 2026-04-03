# Smile Seed Bank V3 — Project State & Progress Tracker

*ไฟล์นี้ใช้เพื่อบันทึกสถานะล่าสุดของโปรเจกต์ เพื่อป้องกัน AI ลืม Context*

---

### UI refactor — storefront / theme (status)
- **Current status:** **100% Completed (Goddess Tier)** — Premium Eco-Clinical storefront theme, genetic bar polish, and product text sanitization are in place for pre-production.
- **Key highlights:**
  - Implemented **Premium Eco-Clinical** theme (**Deep Teal + Lavender**): `app/globals.css` `:root` + `tailwind.config.ts` semantic colors.
  - **Double Glow** genetic bars in `components/storefront/ProductSpecs.tsx`: **Electric Mint (Sativa)** — `bg-sativa` + `hsl(var(--sativa)/0.4)` glow; **Rich Lavender (Indica)** — `bg-secondary` + `hsl(var(--secondary)/0.5)` glow; z-index layering (Sativa over Indica at the seam).
  - **`lib/sanitize-product-text.ts`** — strips legacy inline `font` / `color` / color-bearing `style` from product text fields; wired in `services/product-service.ts` (`getProductBySlug`, `getActiveProducts`); public **`GET /api/products/[slug]`** returns the same normalized payload.
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
- **Manual Grid** — Bulk editing by Breeder + Category; custom package sizes; auto-SKU generation; inline stock/price; Sync to main catalog; PNG/PDF export; **PDF catalog** (`InventoryPdfDocument.tsx`) — no photo column; 535pt grid (NO 20, NAME 145, CAT 45, GEN 65, PACK 65 = Stk 25 + Price 40 × n packs), mirrored header/data, vertical rules, zebra, category bar full width; **Add Strain** prepends draft row + focus Master SKU; **Sync Selected** batch (sequential `await`, toast progress, local `gridRow` merge, no mid-batch refresh); header/row checkboxes include drafts; **types** — `InventoryRow` / `InventoryPackCell` / `InventoryVariant` in `manual/page.tsx`; toasts on failed category/breeder/grid load; **Grid API** — `breeder_id` OR null-`breeder_id` + `master_sku` prefix; optional `?debug=1`; sync sets `breeder_id` when null
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

### Blog System
- **BlogPost Model** — `blog_posts` table: id, title, slug (unique), content (JSON/Tiptap), excerpt, featured_image, author_id, status (DRAFT/PUBLISHED), published_at, tags (String[]), related_products (BigInt[])
- **AI Outline Suggest** — POST `/api/admin/blog/ai-suggest` uses OpenAI to generate blog outlines from topic
- **Admin Blog List** — `/admin/blog` with table (title, slug, status, published_at)
- **Create/Edit Pages** — Tiptap rich text editor; AI outline → apply to editor; DRAFT/PUBLISHED; tags

### Storefront Checkout (payment preview)
- **Server-side payment settings** — `fetchCheckoutPaymentSettings()` in `lib/payment-settings-public.ts` uses `createClient` from `lib/supabase/server`; `.select('id, bank_accounts, prompt_pay')` only (no `line_id` / `crypto_wallets` / `messenger_url` on checkout); maps JSON to public `PaymentSetting` type; `app/(storefront)/checkout/page.tsx` async + `Suspense` / `loading.tsx`; UI in `components/storefront/CheckoutPageClient.tsx` (Card + `next/image` for QR); TH/EN via `useLanguage().t`
- **`payment_settings` in Supabase types** — `PaymentSettingsRow` + `Tables.payment_settings` in `types/supabase.ts`

### Product SEO slugs (DB + service)
- **`products.slug`** — Prisma `String? @unique` + migrate comment (`prisma/schema.prisma`)
- **`lib/product-utils.ts`** — `generateSlug`, `resolveProductSlugFromName`; Thai-only names → deterministic `p-{hex}` fallback
- **`services/product-service.ts`** — `getProductBySlug`, `ensureUniqueProductSlug`, `createProductWithVariants` (auto slug + collision suffix), `backfillProductSlugs()`
- **Admin API** — `POST/PATCH` `app/api/admin/products/...` — PATCH resolves slug via service; POST defers slug to `createProductWithVariants`

### Storefront breeder logos
- **`resolvePublicAssetUrl()`** — `lib/public-storage-url.ts` (relative storage paths → full public URL)
- **`BreederLogoImage`** — `components/storefront/BreederLogoImage.tsx`: fixed `width`/`height`, `alt` = `{name} logo`, `onError` → letter-in-circle fallback; wired on `app/(storefront)/shop/page.tsx`, `app/(storefront)/page.tsx`, `app/(storefront)/product/[slug]/page.tsx`, `app/(storefront)/breeders/page.tsx`, `components/storefront/BreederRibbon.tsx`
- **`next.config.mjs`** — `images.remotePatterns` from `NEXT_PUBLIC_SUPABASE_URL` + storage pathname; fallback host `jysdfxxilyjmjdmhazbu.supabase.co` (correct spelling)

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
| **Manual Grid (งานก่อนหน้าใน session)** | `app/admin/inventory/manual/page.tsx` — แถว draft ใหม่ด้านบน; **Sync Selected** แบบ sequential; checkbox รวม draft; `mergeSyncedGridRow` + `POST /api/admin/inventory/sync` (`gridRow`) |
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
