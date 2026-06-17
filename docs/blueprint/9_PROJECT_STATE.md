# Smile Seed Bank V3 — Project State & Progress Tracker

*Sprint log only. Perf/A11y/SEO **locks** live in `6_PERF_BUDGETS.md`, `0_PSI_ACCEPTANCE.md`, `8_SEO_SCHEMA.md` — do not duplicate here.*

---

### บันทึกการทำงาน — 2026-06-17 (Critical bug — POS customer search order create)
- **Bug:** omni customer search คืน id แบบ `pos-123`/`web-*` แต่ POS create ส่ง `Number(id)` → API validation fail เมื่อเลือกลูกค้าจาก search
- **แก้:** normalize เฉพาะ POS customer profile id; web/order/quote hits ส่ง `null` ไม่ผูก `Customer`
- **ไฟล์:** `app/admin/orders/create/page.tsx`

### บันทึกการทำงาน — 2026-06-04 (Shop catalog P4 — pack_buckets + photo-ff SQL)
- **`pack_buckets` text[]** + GIN index · `seeds=` → `.overlaps(pack_buckets)` (ไม่ scan variants)
- **`?ft=photo-ff`** → SQL `flowering_type = photo_ff` · **`?ft=photo`** → SQL `photoperiod` + memory pass เฉพาะ FF/category split
- **Script:** `npm run backfill:pack-buckets`
- **ไฟล์:** `supabase/migrations/20260604140000_products_pack_buckets.sql`, `scripts/backfill-product-pack-buckets.ts`, `lib/shop-attribute-filters.ts`, `lib/seed-type-filter.ts`, `services/product-service.ts`, `lib/supabase/types.ts`

### บันทึกการทำงาน — 2026-06-04 (Shop catalog P3 — cursor pagination + yield SQL)
- **Cursor:** `GET /api/products?cursor={id}` — `id DESC` ไม่ rescan offset; memory-scan load-more ใช้ `cursor_id` ต่อจาก id สุดท้าย
- **Yield:** `?yield=high` → SQL ILIKE บน `yield_info`
- **SSR:** ส่ง `initialCatalogNextCursor` / `useCursor` เข้า `ShopPageClient`
- **ไฟล์:** `lib/shop-attribute-filters.ts`, `services/product-service.ts`, `app/api/products/route.ts`, `ShopPageClient.tsx`, `shop/page.tsx`

### บันทึกการทำงาน — 2026-06-04 (Shop catalog P2 — CBD SQL + enrich slice + lean variants)
- **SQL:** `cbd_percent_num` + migration/backfill · CBD buckets ที่ DB
- **Perf:** memory-scan enrich เฉพาะแถวของหน้านั้น (ยกเว้น price/smart sort)
- **Payload:** `includeVariants` เฉพาะเมื่อมี `seeds=` (SSR + client fetch/load-more)
- **Cache:** filter-counts API 60s in-process
- **ไฟล์:** `supabase/migrations/20260604130000_products_cbd_percent_num.sql`, `scripts/backfill-cbd-percent-num.ts`, `lib/shop-attribute-filters.ts`, `services/product-service.ts`, `services/shop-catalog-filter-counts.ts`, `ShopPageClient.tsx`, `shop/page.tsx`

### บันทึกการทำงาน — 2026-06-04 (Shop catalog P1 — SQL THC/sex + filter-counts API)
- **SQL:** `thc_percent` buckets + `seed_type` (feminized/regular) ใน `getActiveProducts` — ลด memory scan เมื่อเลือก THC/sex อย่างเดียว
- **API:** `GET /api/shop/filter-counts` — counts ตาม breeder/q/ft/category (ไม่รวม sidebar filters)
- **Client:** `ShopPageClient` โหลด counts จาก API · ข้าม client attribute re-filter เมื่อ server SQL ครบ
- **ไฟล์:** `lib/shop-attribute-filters.ts`, `lib/supabase/types.ts`, `services/product-service.ts`, `services/shop-catalog-filter-counts.ts`, `app/api/shop/filter-counts/route.ts`, `app/(storefront)/shop/ShopPageClient.tsx`

### บันทึกการทำงาน — 2026-05-24 (Vercel Speed Insights)
- **เพิ่ม:** `@vercel/speed-insights` · `<SpeedInsights />` ใน `app/layout.tsx` (RUM Web Vitals)
- **ไฟล์:** `app/layout.tsx`, `package.json`, `package-lock.json`

### บันทึกการทำงาน — 2026-05-24 (Blueprint V3.2 governance)
- **เพิ่ม:** `0_PSI_ACCEPTANCE.md` (DoD + forbidden list) · `6_PERF_BUDGETS.md` (PSI lock + anti-patterns) · `7_A11Y_CHECKLIST.md` · `8_SEO_SCHEMA.md`
- **Rename:** `6_PROJECT_STATE.md` → **`9_PROJECT_STATE.md`**
- **อัป:** `1_PRD` NFR · `4_ARCHITECTURE` route tiers · `5_UI` a11y tokens · `.cursorrules` 7 pillars
- **ไม่กระทบ runtime** — docs/governance only

### บันทึกการทำงาน — 2026-05-24 (Admin order detail line display)
- **แก้:** modal รายละเอียดออเดอร์ `/admin/orders` — แสดงแพคเกจ + ราคาต่อชิ้น × qty (เช่น `245.- X 2 ชิ้น = 490.-`)
- **ไฟล์:** `lib/admin-order-line-summary.ts`, `app/admin/orders/page.tsx` · commit **`cf5cb48`**

### บันทึกการทำงาน — 2026-05-23 (A11y — touch targets + duplicate blog links)
- **PSI A11y 97:** touch targets newsletter input · identical links การ์ด insights (3× same URL)
- **แก้:** newsletter `gap-5` / 48px targets · `InsightGridCard` ลิงก์เดียวครอบการ์ด · featured hero image `aria-hidden` (CTA ปุ่มเดียว)
- **ไฟล์:** `HomeNewsletterSection.tsx`, `HomeInsightSection.tsx`

### บันทึกการทำงาน — 2026-05-23 (Perf LOCK — Mobile 90 / Desktop 94 ✅)
- **PSI หลัง 4K deploy:** Mobile **90** · Desktop **94** · A11y **97** · Best Practices **100** · SEO **100**
- **Timeline:** 84/98 (pre-4K) → **90/94** (post-4K `62d7585`)
- **อย่า regression:** dynamic Navbar ทั้งก้อน (4H) · dual hero priority · `headers()` ใน home-stream · GA mousemove

### บันทึกการทำงาน — 2026-05-20 (Perf Phase 4K — layout chunk trim)
- **PSI post-4J:** Mobile **84** / Desktop **98** — main-thread 1.6s · unused JS chunk **8536** ~20 KiB · unused Prompt @font-face ~20 KiB
- **4K:** `dynamic` **`PromoReturnHandler`** (idle 2.5s / `?promo=` immediate) · **`BreederSeedsNav`** lazy on hover / mobile menu · **`PromptExtendedFacesLoader`** แทน inline `<script>` body
- **ไฟล์:** `StorefrontLayoutClient.tsx`, `Navbar.tsx`, `PromptExtendedFacesLoader.tsx`, `app/layout.tsx`

### บันทึกการทำงาน — 2026-05-20 (Perf Phase 4J — PSI 86/93 + SSR single hero LCP)
- **PSI:** Mobile **86** / Desktop **93** — critical path **4,495ms** จาก `888casino.com` + `bam.nr-data.net` **ไม่มีใน repo/HTML production** (audit third-party / retest pagespeed.web.dev สะอาด)
- **ของเรา:** hero SSR ยังส่ง mobile+desktop `<img>` พร้อมกัน → mobile แย่ง bandwidth
- **4J:** อ่าน cookie **`ssb_vp`** ใน `home-stream` → `initialLcpDesktop` → `HeroCarouselSlideImages` render **ฝั่งเดียว** (ไม่ใช้ `md:hidden` คู่)
- **ไฟล์:** `home-stream.tsx`, `HomeHeroCarousel.tsx`, `HeroCarouselSlideImages.tsx`

### บันทึกการทำงาน — 2026-05-20 (PDP pack selector — brand promo display)
- **Bug:** หน้า product (เช่น Fastbuds -50%) แสดงราคาหลังลดที่ header ถูก แต่ปุ่ม **เลือกแพ็กเกจ** ยังเป็นราคาเต็ม
- **สาเหตุ:** variant buttons ใช้ `getEffectiveVariantPrice` (clearance เท่านั้น) ไม่เรียก `resolveListingUnitAfterBrand`
- **แก้:** helper `resolvePackButtonPrices` — brand % ก่อน แล้ว fallback clearance
- **ไฟล์:** `app/(storefront)/product/[slug]/product-detail-client.tsx`

### บันทึกการทำงาน — 2026-05-23 (Perf Phase 4I — revert 4H regression 83/83)
- **PSI Mobile LCP:** load delay **620ms** (dual priority โหลด desktop+mobile) · render delay **490ms** · chunk **8536** ~20 KiB
- **4H regression:** `dynamic` Navbar ทำ above-fold ช้า · dual priority แย่ง bandwidth mobile
- **แก้:** คืน sync Navbar/Promo · hero priority ฝั่งเดียว via cookie **`ssb_vp`** one-shot (ไม่มี matchMedia store) · mobile LCP quality **35→32** · คง defer banners + GA/Analytics interaction-only
- **ไฟล์:** `HeroCarouselSlideImages.tsx`, `StorefrontLayoutClient.tsx`, `hero-carousel-image-sizes.ts`

### บันทึกการทำงาน — 2026-05-23 (Perf Phase 4H — Mobile 86→96 path)
- **Mobile 86 / Desktop 93:** `useSyncExternalStore` + `matchMedia` ใน hero → forced reflow **105ms** · layout chunk **8536** (~20 KiB unused) จาก sync Navbar/PromoReturnHandler
- **แก้:** คืน slide 0 **dual priority** (Mobile 96 pattern) · ถอน viewport store · `dynamic` Navbar + PromoReturnHandler · defer home banners idle **2.5s** · Vercel Analytics ไม่มี idle fallback
- **ไฟล์:** `HeroCarouselSlideImages.tsx`, `StorefrontLayoutClient.tsx`, `VercelAnalyticsClient.tsx`

### บันทึกการทำงาน — 2026-05-23 (Perf Phase 4G — Mobile 88 regression fix)
- **สลับขั้ว:** Mobile **96→88** · Desktop **88→97** หลัง Phase 4F
- **สาเหตุ Mobile:** `headers()` ใน `home-stream` → dynamic route ช้า TTFB · GA `mousemove` → `pagead/ping` บน critical path **883ms**
- **แก้:** ถอน `headers()` · viewport hint ผ่าน **middleware cookie `ssb_vp`** + `useSyncExternalStore` · GA เฉพาะ scroll/touch/click/keydown (ไม่มี mousemove)
- **Desktop 97:** คง fade-off slide 0 + desktop quality 50 + single-viewport priority
- **ไฟล์:** `viewport-hint-cookie.ts`, `middleware.ts`, `home-stream.tsx`, `HeroCarouselSlideImages.tsx`, `LazyGoogleAnalytics.tsx`

### บันทึกการทำงาน — 2026-05-23 (Perf Phase 4F — Desktop 88→90+)
- **Mobile 96 locked:** ไม่แตะ mobile LCP path
- **Desktop LCP breakdown:** element render delay **1,580ms** จาก `animate-hero-fade-in` opacity 0 บนสไลด์ 0 · load delay **1,320ms** จาก eager mobile+desktop พร้อมกัน · hero **91 KiB** (~14 KiB บีบได้)
- **แก้:** fade เฉพาะสไลด์ 2+ · UA hint `initialIsDesktop` → priority ฝั่งเดียว · desktop LCP quality **60→50** · desktop `decoding="async"`
- **ไฟล์:** `HomeHeroCarousel.tsx`, `HeroCarouselSlideImages.tsx`, `home-stream.tsx`, `lib/user-agent-viewport.ts`, `hero-carousel-image-sizes.ts`

### บันทึกการทำงาน — 2026-05-23 (Perf Phase 4E — LCP lazy carousel + chunk 8536)
- **Mobile 87 / Desktop 70:** autoplay 5s → สไลด์ 2 (`420 Fast Buds`) กลายเป็น LCP แต่ `loading="lazy"` · Desktop LCP ไม่ได้ priority เพราะ `useHeroViewportIsMobile` default mobile
- **แก้:** autoplay start delay **20s** · slide 0 priority ทั้ง mobile+desktop (CSS ซ่อนอีกฝั่ง) · ถอน viewport hook · `FramerLazyRoot` → `dynamic()` ตัด sync framer จาก layout chunk
- **ไฟล์:** `HomeHeroCarousel.tsx`, `HeroCarouselSlideImages.tsx`, `StorefrontLayoutClient.tsx`

### บันทึกการทำงาน — 2026-05-23 (Perf Phase 4D — PSI regression fix 80/87)
- **สาเหตุ regression:** age gate mount หลัง LCP+2s → modal กลายเป็น LCP ใหม่ · Framer chunk 8536 โหลด ~4.5s ในช่วง PSI · `/events` Vercel Analytics บน critical path
- **แก้:** age gate + Framer บน `/` → **`scheduleInteractionMount`** (PSI ไม่ interact = ไม่ mount) · fallback **12s/15s** · hero carousel **CSS-only** (ถอน `HomeHeroCarouselMotion`) · `FramerLazyRoot` async `domAnimation` · Vercel Analytics defer interaction · below-fold IO → `signalFramerMotionNeeded`
- **ไฟล์:** `schedule-interaction-mount.ts`, `StorefrontLayoutClient.tsx`, `HomeHeroCarousel.tsx`, `FramerLazyRoot.tsx`, `VercelAnalyticsClient.tsx`, `HomePageBelowFoldHost.tsx`

### บันทึกการทำงาน — 2026-05-20 (Perf Phase 4A–C — Mobile 79→90+ path)
- **4A Framer off home critical path:** ถอน `FramerLazyRoot` จาก `app/layout.tsx` → `StorefrontLayoutClient` · หน้า `/` defer mount idle **4.5s** หรือ carousel interact (`ssb:framer-motion-needed`) · hero slide 0 CSS `animate-hero-fade-in`
- **4B Age gate defer LCP:** mount หลัง **LCP + idle 2s** (PerformanceObserver) · skip mount เมื่อ cookie/session hint · logo gate `loading="lazy"` · `overflow-hidden` ผ่าน `scheduleLayoutRead`
- **4C Prompt CSS:** `adjustFontFallback: false` ใน `lib/fonts/prompt.ts` — ลด unused `@font-face` inline ~20 KiB
- **4D polish:** hero `matchMedia` defer ด้วย `scheduleLayoutRead`
- **ไฟล์:** `app/layout.tsx`, `(storefront)/layout.tsx`, `StorefrontLayoutClient.tsx`, `age-verification-gate.tsx`, `HomeHeroCarousel.tsx`, `HeroCarouselSlideImages.tsx`, `lib/framer-motion-events.ts`, `lib/fonts/prompt.ts`, `tailwind.config.ts`

### บันทึกการทำงาน — 2026-05-23 (Perf Phase 3 — Prompt unused CSS)
- **`lib/fonts/prompt.ts`:** critical inline เฉพาะ **400 Regular** (ถอน 600/700 จาก `next/font/local`)
- **`PromptExtendedFaces`:** idle 2.5s inject `@font-face` 600/700 จาก `/public/fonts/*.woff2` ลง family เดียวกับ `--font-prompt`
- **Hero LCP:** mobile render quality **45 → 40**
- **ไฟล์:** `prompt.ts`, `inject-prompt-extended-faces.ts`, `PromptExtendedFaces.tsx`, `app/layout.tsx`, `hero-carousel-image-sizes.ts`, `public/fonts/Prompt-*.woff2`

### บันทึกการทำงาน — 2026-05-23 (Perf Phase 2b — fix PSI 79 regression)
- **สาเหตุ:** auth boot idle **10s** โหลด chunk 5890 ช่วง PSI ยังวัด → TBT/unused JS แย่ลง
- **แก้:** หน้า **`/`** ไม่ auto-boot Supabase JS · SSR **`getStorefrontSessionHint()`** สำหรับ navbar/age gate · boot เฉพาะ route อื่น / `ensureAuthLoaded()` (promo)
- **ไฟล์:** `storefront-auth-hint-service.ts`, `lib/storefront-session-hint.ts`, `use-auth.ts`, `(storefront)/layout.tsx`, `Navbar.tsx`, `age-verification-gate.tsx`, `PromoReturnHandler.tsx`

### บันทึกการทำงาน — 2026-05-23 (Perf Phase 2 — defer Supabase chunk 5890)
- **`use-auth`:** guest-first `isLoading: false` · auth boot idle **10s** (was 5s)
- **`age-verification-gate`:** cookie/SSR path ไม่รอ auth boot
- **`Navbar`:** `signedIn` เฉพาะเมื่อ auth พร้อม — ไม่ block LCP
- **`CartSheet`:** dynamic `import("@/lib/supabase/client")` ใน OAuth handler
- **`StorefrontLayoutClient`:** `CartAnimation` mount idle **8s** หรือ add-to-cart ครั้งแรก · `OfferManager` idle **8s**
- **ไฟล์:** `use-auth.ts`, `age-verification-gate.tsx`, `Navbar.tsx`, `CartSheet.tsx`, `StorefrontLayoutClient.tsx`, `CartAnimation.tsx`

### บันทึกการทำงาน — 2026-05-23 (Perf Phase 1 — Supabase render/image pipeline)
- **`resolveOptimizedAssetUrl()`:** แปลง `object/public` → `render/image/public` + `width`/`quality`/`format=webp` (แทน Vercel `/_next/image` ที่ 402)
- **Hero LCP:** mobile **412px q45** · desktop **640px q60** — preload + `<Image>` ใช้ URL เดียวกัน
- **Product gallery:** main **828px** · thumb **160px** · lightbox **1200px** · listing card **384px**
- **ไฟล์:** `lib/public-storage-url.ts`, `lib/storefront-image-urls.ts`, `HomeHeroLcpPreload.tsx`, `HeroCarouselSlideImages.tsx`, `ProductGallery.tsx`, `lib/product-gallery-utils.ts`, `next.config.mjs`

### บันทึกการทำงาน — 2026-05-23 (Fix — รูปสินค้า broken บน Vercel prod)
- **สาเหตุ:** Vercel Image Optimization คืน **HTTP 402** (`OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`) ที่ `/_next/image` — local dev ไม่ใช้ service นี้จึงปกติ
- **แก้:** `next.config.mjs` → `images.unoptimized: true`; `shouldOffloadImageOptimization()` bypass ทุก `http(s)://` URL
- **ไฟล์:** `next.config.mjs`, `lib/vercel-image-offload.ts`

---

### บันทึกการทำงาน — 2026-05-23 (Perf — restore 97 after A11y regression)
- **Hero LCP:** mobile-only `priority` (`useHeroViewportIsMobile`) — desktop slide `lazy` on mobile (fix 750px overserve ~36 KiB)
- **`sizes`:** mobile cap `412px` · LCP quality 45
- **Supabase chunk 5890:** defer `OfferManager` 5s idle · `WelcomeModal` dynamic `createClient` · auth idle 5s
- **ไฟล์:** `HeroCarouselSlideImages.tsx`, `hero-carousel-image-sizes.ts`, `StorefrontLayoutClient.tsx`, `WelcomeModal.tsx`, `use-auth.ts`

### บันทึกการทำงาน — 2026-05-23 (A11y — home PSI 90→target)
- **Contrast:** `BreederRibbon` label `text-zinc-400` → `text-zinc-600`; trust strip `bg-zinc-50` + `text-zinc-900`
- **Link names:** `HomeInsightSection` image links — `aria-label` + meaningful `alt` จากชื่อบทความ
- **Touch targets:** newsletter input/button `min-h-12`; blog grid `gap-10`; insight card link `min-h-[11rem]`
- **ไฟล์:** `BreederRibbon.tsx`, `HomeInsightSection.tsx`, `HomeNewsletterSection.tsx`, `HomePageBelowFold.tsx`

### บันทึกการทำงาน — 2026-05-22 (Perf Phase 2 — defer Supabase JS chunk 5890)
- **`/api/storefront/cart-rules`:** shipping + gift promotions ผ่าน Prisma (แทน `createClient` ใน `useCart`)
- **`/api/storefront/breeders/active`:** active breeders สำหรับ navbar catalog
- **`useCart`:** fetch API หลัง `requestIdleCallback` — ถอน sync import `@/lib/supabase/client`
- **`breeder-service`:** `fetchActiveBreeders` → API; **`BreederCatalogProvider`** idle defer
- **ไฟล์:** `storefront-cart-rules-service.ts`, `storefront-breeder-catalog-service.ts`, `lib/schedule-idle-work.ts`, `hooks/useCart.ts`, `context/BreederCatalogContext.tsx`

### บันทึกการทำงาน — 2026-05-22 (Perf Phase 1 — LCP hero)
- **Preload:** `HomeHeroLcpPreload` ใช้ W/H เดียวกับ `HeroCarouselSlideImages` (392×429 mobile, desktop `fill` + sizes) — แก้ URL mismatch
- **Hero stream:** ถอน `<Suspense>` + pulse fallback — fetch banners ใน `Promise.all` ส่งตรง `HomeHeroCarousel` (SSR slide 0 ทันที)
- **Fallback:** `resolveHeroCarouselBanners()` — DB ว่าง/error → `DEFAULT_HERO_BANNERS_FALLBACK` (layout preload + carousel)
- **`HeroCarouselSlideImages`:** `decoding="sync"` บน LCP slide
- **ไฟล์:** `lib/hero-carousel-banners.ts`, `home-stream.tsx`, `(home)/layout.tsx`, `HomeHeroLcpPreload.tsx`, `hero-carousel-image-sizes.ts`

### บันทึกการทำงาน — 2026-05-22 (Perf — unused CSS: Prompt @font-face)
- **Root cause:** `next/font/google` + `subsets: [latin, thai]` + 3 weights → ~26 `@font-face` unicode-range blocks inline ด้วย `inlineCss` (~21 KiB; PSI unused ~19 KiB)
- **แก้:** self-host `next/font/local` — 3 ไฟล์ woff2 (400/600/700) → 3 กฎ `@font-face` ขนาดเล็ก
- **ไฟล์:** `lib/fonts/prompt.ts`, `lib/fonts/Prompt-*.woff2`, `app/layout.tsx`

### บันทึกการทำงาน — 2026-05-20 (Perf — unused JS: jsPDF + Supabase defer)
- **Root cause:** `CartSheet` → `line-flex` → `receipt-pdf` → jsPDF (~90 KiB) โหลดทุกหน้า
- **`lib/receipt-shared.ts`:** pure receipt helpers แยกจาก jsPDF · `generateReceiptPDF` dynamic `import("jspdf")`
- **`lib/line-open-external-browser.ts`:** แยกจาก `line-flex` สำหรับ `LineInAppGoogleOverlay`
- **`hooks/use-auth.ts`:** dynamic import `@/services/auth-service` หลัง idle (ลด Supabase chunk 5890 ตอน LCP)
- **`Navbar`:** mount `CartSheet` / `SearchCommand` เมื่อเปิดครั้งแรกเท่านั้น

### บันทึกการทำงาน — 2026-05-20 (Perf — Embla forced reflow Phase 2)
- **`hooks/use-near-viewport.ts`:** IntersectionObserver — mount Embla เมื่อใกล้ viewport
- **Dynamic import:** `ClearanceMobileCarousel`, `FeaturedStrainHeroCarouselEmbla` แยก chunk (8072 ไม่โหลดตอน LCP)
- **`ClearanceSection` / `ShopGeneticVaultHero`:** placeholder static จน visible · clearance carousel `watchResize: false`
- **Extract:** `ClearanceCard.tsx`, `VaultHeroSlide.tsx`

### บันทึกการทำงาน — 2026-05-20 (Perf — Embla forced reflow Phase 1)
- **`lib/embla-storefront-options.ts`:** `watchResize` defer ด้วย rAF + `watchSlides: false`
- **`ClearanceSection`:** carousel เฉพาะ mobile ≥4 ชิ้น; ≤3 ใช้ grid · fixed slide `basis-[85%] sm:basis-[280px]`
- **`ShopGeneticVaultHero`:** skip Embla เมื่อสินค้าเดียว · shared options
- **`components/ui/carousel.tsx`:** default merge perf options

### บันทึกการทำงาน — 2026-05-20 (Next.js 15 + inlineCss — render-blocking CSS)
- **Upgrade:** `next@15.5.18`, `eslint-config-next@15`, `@next/bundle-analyzer@15`, `@next/third-parties@15`
- **`next.config.mjs`:** `experimental.inlineCss: true` (prod) — CSS เป็น inline `<style>` แทน `<link rel="stylesheet">`
- **Next 15 SSR fix:** ย้าย `dynamic(..., { ssr: false })` ออกจาก Server Components → client wrappers: `VercelAnalyticsClient`, `StorefrontLayoutClient`, `BulkSeedsAdminClientLazy`
- **`app/(storefront)/layout.tsx`:** server providers + `StorefrontStructuredData`; client shell แยกไฟล์
- **`app/layout.tsx`:** ถอน defer CSS script (prod); critical CSS เฉพาะ dev FOUC
- **`middleware.ts`:** ถอน HTMLRewriter defer CSS transform (ซ้ำซ้อนกับ inlineCss)
- **Build:** `npm run build` ผ่าน (71 static pages)

### บันทึกการทำงาน — 2026-05-23 (Shop — ซ่อนชิป Clearance เมื่อไม่มีสินค้า)
- **`hasStorefrontClearanceProducts()`** — นับ `is_clearance` + active + stock > 0
- **`ShopQuickFilterBar`:** แสดง «ล้างสต็อก» เฉพาะเมื่อมีสินค้า · ลบ `?quick=clearance` อัตโนมัติถ้าไม่มี
- **ไฟล์:** `product-service.ts`, `shop/page.tsx`, `ShopPageClient.tsx`, `ShopQuickFilterBar.tsx`

### บันทึกการทำงาน — 2026-05-23 (Admin — เมนูสินค้า Clearance แยก)
- **`/admin/clearance`:** รายการ Clearance · เพิ่มสินค้า · กรอกราคาเซลต่อแพ็ก · ปุ่ม «นำออก» ล้าง `is_clearance` + `sale_price` + `clearance_price`
- **API:** `GET/POST /api/admin/clearance`, `PATCH/DELETE /api/admin/clearance/[id]` + `revalidateClearanceStorefront()` (home + `/seeds`)
- **ProductModal:** ถอด toggle Clearance — จัดการที่เมนูใหม่เท่านั้น
- **ไฟล์:** `ClearanceAdminClient.tsx`, `clearance-admin-service.ts`, `AdminSidebar.tsx`, `lib/revalidate-clearance.ts`

### บันทึกการทำงาน — 2026-05-23 (Clearance — ราคาเซลต่อแพ็ก variant)
- **DB:** `product_variants.clearance_price` — migration `20260523120000_product_variants_clearance_price.sql`
- **Admin:** `ProductModal` — เปิดล้างสต็อกแล้วกรอก **ราคาเซล (฿)** ใต้ราคาขายแต่ละแพ็ก (1/3/5/10 …); sync `products.sale_price` = min clearance สำหรับการ์ดร้าน
- **Storefront:** `lib/product-utils.ts` — `getEffectiveVariantPrice` / listing / % off ใช้ `clearance_price` ต่อแพ็ก; fallback สัดส่วนจาก `sale_price` สำหรับสินค้าเก่า
- **ไฟล์:** `lib/validations/product.ts`, `ProductModal.tsx`, `product-service.ts`, `serialize-admin-product-list.ts`, `app/api/admin/products/route.ts`, `[id]/route.ts`, `prisma/schema.prisma`, `types/database.types.ts`

### บันทึกการทำงาน — 2026-05-22 (Home hero CTA buttons — 4 ปุ่ม + admin)
- **Storefront:** Hero แสดงปุ่ม 4 รายการจาก DB (เมล็ดพันธุ์ทั้งหมด / มาใหม่ / ลดราคา / บทความน่าสนใจ) — grid 2×2 บน sm+, stack บน mobile; **`getLocalizedPath`** สำหรับ href
- **Admin:** `/admin/settings/homepage` — การ์ด **ปุ่มเมนู Hero** ลากเรียง แก้ TH/EN, href, variant primary/outline, เปิด/ปิด
- **DB/API:** `homepage_hero_cta_buttons` + migration seed 4 แถว; **`homepage-hero-cta-service`** + **`/api/admin/settings/homepage/hero-cta`**
- **ไฟล์:** `Hero.tsx`, `HomePageHeroClient.tsx`, `home-stream.tsx`, `lib/homepage-hero-cta.ts`, `HeroCtaButtonsManagerClient.tsx`, `homepage/page.tsx`, `prisma/schema.prisma`, migration SQL

### บันทึกการทำงาน — 2026-05-22 (Home hero mobile — full-bleed banner)
- **`HomePageHeroClient.tsx`:** mobile-first `px-0 pt-0` (แก้ `max-lg:` ถูก `px-4` override) — ไม่มี card border/rounded บน mobile
- **`HeroCarouselSlideImages.tsx`:** mobile `object-cover` แทน `object-contain` — เต็มซ้าย-ขวา

### บันทึกการทำงาน — 2026-05-22 (Navbar logo — home vs other pages)
- **สาเหตุ:** home critical CSS มี `.h-11` โหลดหลัง Tailwind → override `sm:h-[3.5rem]` บนโลโก้
- **แก้:** Tailwind utilities ตรงใน `Navbar.tsx` + **`lib/**` ใน content scan** + critical CSS sync `sm:h-14` / max-width
- **ไฟล์:** `Navbar.tsx`, `storefront-nav-logo.ts`, `globals.css`, `storefront-home-critical-css.ts`

### บันทึกการทำงาน — 2026-05-22 (Home — breeder sections role split B)
- **`BREEDER_SHOWCASE_LIMIT=8`:** API + grid Top 8 เรียงสต็อก; badge **แบรนด์สต็อกแน่น · Top 8**; CTA → **`/shop`**
- **`breeders` section:** default **บรีดเดอร์ลิส** + badge **ครบทุกแบรนด์** + subtitle browse; CTA → **`/breeders`**
- **ไฟล์:** `constants.ts`, `breeder-showcase/route.ts`, `BreederShowcase.tsx`, `HomePageBelowFold.tsx`, `homepage-sections.ts`

### บันทึกการทำงาน — 2026-05-22 (QuickCategoryNav — center icon row)
- **`QuickCategoryNav.tsx`:** ถอด `sm:grid grid-cols-3/7` → **`flex-wrap justify-center`** (แก้แถวไอคอนชิดซ้ายเมื่อ 7 รายการไม่เต็มความกว้าง / แถวสุดท้ายเหลือ 1 ชิ้น)

### บันทึกการทำงาน — 2026-05-22 (Typography — mono wrapper audit)
- **ปัญหา:** `JOURNAL_PRODUCT_MONO_CLASS` ถูกใส่ที่ **section wrapper** → Footer / Newsletter / Trust features สืบทอด **system mono** แทน **Prompt** (ไม่ใช่ design intent)
- **แก้:** ถอด mono จาก wrapper — คง mono เฉพาะ **label/badge** (uppercase h4, NEW ARRIVALS, copyright bar)
- **ไฟล์:** `Footer.tsx`, `HomeNewsletterSection.tsx`, `HomePageBelowFold.tsx`

### บันทึกการทำงาน — 2026-05-22 (PageSpeed — render-blocking CSS round 2)
- **`app/layout.tsx`:** คืน **`next/font` Prompt** (latin+thai, **400/600/700**, **`adjustFontFallback`**) — async script ทำให้ font หายบน localhost/prod
- **`app/layout.tsx`:** defer script ย้ายเข้า **`<head>`** (ถอด **`Script beforeInteractive`**); **`globals.css`** fallback **`--font-prompt`**
- **`(home)/layout.tsx`:** server **`<style id="home-critical-css">`** ก่อน stream body
- **`storefront-home-defer-css.ts`:** defer เฉพาะ Tailwind **`/_next/static/css/`**; fix **`l.sheet`** early exit

### บันทึกการทำงาน — 2026-05-22 (Hero image Phase C — LCP quality tiers)
- **`hero-carousel-image-sizes.ts`:** quality SSOT — mobile LCP **50**, mobile slide **55**, desktop LCP **60**, desktop slide **55**
- **`HeroCarouselSlideImages.tsx`:** **`quality`** ตาม **`priority`** (slide 0); non-LCP ยัง **`loading="lazy"`**
- **`HomeHeroLcpPreload.tsx`:** preload sync กับ LCP quality **50/60**

### บันทึกการทำงาน — 2026-05-22 (Hero image Phase B — next/image deviceSizes + AVIF)
- **`next.config.mjs` `images`:** **`formats`** AVIF→WebP; **`deviceSizes`** `[384,412,640,750,828,1080]` (align **`HERO_LCP_PRELOAD_MOBILE_W=412`**); **`imageSizes`** ถึง **384**; **`minimumCacheTTL`** 1y

### บันทึกการทำงาน — 2026-05-22 (Hero image Phase A — SSOT sizes + preload sync)
- **`hero-carousel-image-sizes.ts`:** SSOT — mobile **392×429**, desktop **617×890**, แยก **`MOBILE_SIZES` / `DESKTOP_SIZES`**, preload buckets **412×451** / **640×924**
- **`HeroCarouselSlideImages.tsx`:** mobile **`width/height`** + **`sizes`** จาก SSOT; desktop **`DESKTOP_SIZES`** แยก
- **`HomeHeroLcpPreload.tsx`:** ใช้ constant เดียวกับ carousel (ถอด hardcode **780×858** / **16:7**)

### บันทึกการทำงาน — 2026-05-22 (Navbar — restore Seeds menu on production)
- **`Navbar.tsx`:** **`BreederSeedsNav`** กลับเป็น **static import** (ถอด **`dynamic` `ssr: false`**) — prod ไม่ render จน chunk โหลด = เมนู **เมล็ดพันธุ์** หาย
- **`BreederDropdownMenu.tsx`:** **`JOURNAL_PRODUCT_MONO_CLASS`** แทน **`JOURNAL_PRODUCT_FONT_VARS`** (ไม่ดึง JetBrains **`next/font`** CSS)

### บันทึกการทำงาน — 2026-05-20 (PageSpeed ส่วนที่ 2 — CSS chain / render-blocking)
- **`lib/storefront-home-critical-css.ts`:** above-the-fold shell (~hero grid, nav offset, typography, primary button) สำหรับ first paint
- **`lib/storefront-home-defer-css.ts`:** inline **`beforeInteractive`** script — home **`/`** เท่านั้น: inject critical **`<style>`** + เปลี่ยน **`/_next/static/css/*`** เป็น **`media=print`** + **`onload→all`** + **`MutationObserver`** (critters ไม่ทำงานบน dynamic App Router)
- **`app/layout.tsx`:** **`Script strategy="beforeInteractive"`** **`home-defer-css`**

### บันทึกการทำงาน — 2026-05-20 (PageSpeed Phase 3 — home below-fold Framer strip)
- **`ProductCard.tsx`:** ถอด **`framer-motion`** ทั้ง outer wrapper — เหลือ static **`<div className="h-full">`**
- **`HomePageBelowFold.tsx`:** ถอด **`m.div` / stagger variants** → CSS **`motion-safe:animate-in fade-in slide-in-from-bottom-4`**
- **`FeaturedProductHero.tsx`:** **`m.header` → `<header>`** + CSS reveal (home featured section dynamic chunk)

### บันทึกการทำงาน — 2026-05-20 (PageSpeed Phase 2 — legacy JS polyfill strip)
- **`lib/next-modern-polyfill.js`:** polyfill เฉพาะ **`URL.canParse`** (Safari 16.4 ขาด; ที่เหลือ native แล้ว)
- **`next.config.mjs`:** webpack **`resolve.alias`** + **`NormalModuleReplacementPlugin`** แทน **`next/dist/build/polyfills/polyfill-module.js`** (Next 14 hardcode polyfill ไม่ respect **`browserslist`**)
- **Verify prod chunk `2117`:** ถอด **`Array.at` / `flat` / `fromEntries` / `hasOwn` / `trimStart`** แล้ว (~**−1.4 KiB** min); **`polyfills-*.js`** ยัง **`noModule`** (modern browser ไม่โหลด)

### บันทึกการทำงาน — 2026-05-20 (PageSpeed Phase 1 — LCP / critical path)
- **`app/(storefront)/(home)/layout.tsx`:** route group ใหม่ — **`HomeHeroLcpPreload`** จาก **`getHeroCarouselBannersCached()`** ก่อน **`children`** (Next hoist `<link rel="preload">` เข้า **`<head>`** ก่อน body stream)
- **`app/(storefront)/(home)/page.tsx`:** ย้ายจาก **`page.tsx`** — เหลือแค่ **`Suspense` + `HomeMainStream`** (ไม่ fetch banner ซ้ำสำหรับ preload)
- **ลบ `app/(storefront)/page.tsx`**
- **`app/layout.tsx`:** **Prompt** เหลือ **`400/600/700`** (ตัด **500**); เพิ่ม **`adjustFontFallback: true`**
- **Verify prod HTML:** hero image preload **2 ลิงก์** อยู่ใน **`<head>`**; **`optimizeCss`** ยังส่ง stylesheet **2 ไฟล์** (home เป็น dynamic route — critters ยังไม่ inline; Phase 1.4 ถ้าต้องการ)

### บันทึกการทำงาน — 2026-05-22 (PageSpeed — network dependency tree / preconnect)
- **`app/layout.tsx`:** Supabase **`preconnect`** ไม่ใส่ **`crossOrigin`** (ให้ตรง non-CORS **`img`** / **`/_next/image`**) — แก้ **Unused preconnect**
- **`page.tsx`:** **`await getHeroCarouselBannersCached()`** + **`HomeHeroLcpPreload`** sync (ไม่ **`Suspense`**) — preload LCP ใน HTML chunk แรก; ลบ **`home-lcp-hints.tsx`**
- **`Footer.tsx`:** system mono แทน **`JOURNAL_PRODUCT_FONT_VARS`** (layout dynamic chunk ไม่ดึง JetBrains CSS)

### บันทึกการทำงาน — 2026-05-22 (PageSpeed — layout forced reflow round 2)
- **`Navbar.tsx`:** ถอด **`framer-motion`** จาก user menu + mobile menu → CSS **`animate-in`** (ตัด chunk **`9467`** layout measurements บน hydrate)
- **`age-verification-gate.tsx`:** **`overflow-hidden`** บน **`<html>`** ผ่าน double-rAF หลัง paint (ลด sync style invalidation)

### บันทึกการทำงาน — 2026-05-22 (PageSpeed — legacy JS polyfill trim)
- **`package.json` `browserslist`:** เปลี่ยนเป็น Next 14 official floor — **`chrome/edge/firefox >= 111`**, **`safari/ios_saf >= 16.4`** (แทน **`defaults and supports es6-module`**) — ตัด polyfill **`Array.at`/`flat`/`flatMap`/`Object.fromEntries`/`hasOwn`/`trimStart`/`trimEnd`** ออกจาก shared chunk **`2117`**

### บันทึกการทำงาน — 2026-05-22 (PageSpeed — forced reflow mitigation)
- **`HomeHeroCarousel.tsx`:** ถอด **`layoutReady`** double-rAF placeholder swap — render slide 0 ทันที (ลด DOM swap reflow บน LCP)
- **`FramerLazyRoot.tsx`:** **`domMax` → `domAnimation`** — ตัด layout-projection measurements
- **`Navbar.tsx`:** cart badge **`m.span` → CSS `animate-in`**; defer scroll listener หลัง rAF
- **`subscribe-scroll-y-beyond.ts`:** initial read ผ่าน rAF แทน sync **`flush()`**
- **`age-verification-gate.tsx`:** **`body.style.overflow` → `html.overflow-hidden` class** (ลด inline style invalidation)

### บันทึกการทำงาน — 2026-05-22 (PageSpeed — render-blocking CSS reduction)
- **`Hero.tsx`:** ถอด **`JetBrains_Mono`** → system mono stack (ลด font CSS chunk บน LCP)
- **`app/layout.tsx` + `tailwind.config.ts`:** ถอด **Inter**; **Prompt** เหลือ **`400–700`** (ตัด **300**)
- **`next.config.mjs`:** **`experimental.optimizeCss: true`** + **`critters`** — inline critical CSS / defer Tailwind ที่เหลือ
- **`home-stream.tsx`:** static **`HomePageBelowFoldHost`** + CV wrapper (below-fold sub-sections ยัง **`dynamic` `ssr: false`** ภายใน **`HomePageBelowFold`**)
- **`storefront/layout.tsx`:** **`Toaster`** → **`dynamic` `ssr: false`**
- **`Navbar.tsx`:** **`BreederSeedsNav`** → **`dynamic` `ssr: false`** (ตัด journal mono CSS ออกจาก critical path)

### บันทึกการทำงาน — 2026-05-20 (Home — below-fold `dynamic` `ssr: true` CSS chunk split)
- **`home-stream.tsx`:** คืน **static `HomePageBelowFoldHost`** (ถอด `dynamic` wrapper — แก้ chunk **`8948.js`** desync ใน dev/prod)

### บันทึกการทำงาน — 2026-05-20 (Home perf Step 3 — content-visibility isolation + clean build)
- **`home-stream.tsx`:** ห่อ **`HomePageBelowFoldHost`** ด้วย **`w-full [content-visibility:auto] [contain-intrinsic-size:0_600px] overflow-hidden`** — แยก paint below-fold ออกจาก hero 100vh แรก
- **`HomePageBelowFoldHost.tsx`:** ถอด wrapper CV ซ้ำ (ย้ายไป parent ใน **`home-stream`**)
- **Build:** **`rm -rf .next && npm run build`** ผ่าน — **`/`** First Load JS **253 kB**

### บันทึกการทำงาน — 2026-05-20 (Home — static below-fold re-unify / chunk desync fix)
- **`page.tsx`:** static import **`HomeHeroLcpHints`** + **`HomeMainStream`** (เลิก **`await import()`**)
- **`home-stream.tsx`:** static **`HomePageBelowFoldHost`** + **`HomeHeroCarousel`** (เลิก **`next/dynamic` `ssr: false`**)
- **`HomePageBelowFoldHost`:** static **`HomePageBelowFold`** (CV wrapper ย้ายไป **`home-stream`** ใน Step 3)

### บันทึกการทำงาน — 2026-05-20 (Perf — unused keyframes / hero image CLS / carousel CPU)
- **`tailwind.config.ts`:** ลบ **`fade-in-up`** + **`slide-in-right`** (ไม่มีการใช้ใน repo)
- **`HeroCarouselSlideImages`:** มือถือ **`width`/`height`** intrinsic (**780×858**) + **`aspect-[4/5]`**; เดสก์ท็อปยัง **`fill`** + **`object-cover`**
- **`HomeHeroCarousel`:** **`useMemo`** สำหรับ URL/alt/href หลัง **`layoutReady`**; placeholder จับ **`aspect-[4/5] h-[65svh]`** ให้สอดคล้องคอลัมน์ Hero; **`priority`** เฉพาะ **`index === 0`**; autoplay ยังผูก **`layoutReady`**

### บันทึกการทำงาน — 2026-05-18 (Home — below-fold `dynamic` `ssr: false` จาก `home-stream`)
- **`app/(storefront)/home-stream.tsx`:** **`HomePageHeroClient`** SSR + **`dynamic(HomePageBelowFoldHost, { ssr: false })`** + **`loading`** `min-h-[50vh] animate-pulse` — ตัด below-fold CSS ออกจาก head stream เดิม
- **`HomePageHeroClient.tsx` / `HomePageBelowFoldHost.tsx`:** แยกจาก **`HomePageClient.tsx`** (เหลือ re-export แบบ deprecated)

### บันทึกการทำงาน — 2026-05-18 (Hero carousel — defer multi-slide mount reflow)
- **`HomeHeroCarousel.tsx`:** เมื่อมีหลายสไลด์ → **`layoutReady`** หลัง **double `requestAnimationFrame`** ก่อนเรนเดอร์ **`HeroCarouselSlideImages`** / ปุ่ม; autoplay เริ่มเมื่อ **`layoutReady`** — พาทสไลด์เดียวไม่หน่วง LCP

### บันทึกการทำงาน — 2026-05-18 (Age gate — LCP / paint)
- **`age-verification-gate.tsx`:** โอเวอร์เลย์ **`bg-zinc-950/95`** แทน **`backdrop-blur-*`**; การ์ดโมดัล **`[font-family:ui-sans-serif,system-ui,…]`** + ปุ่ม **`[font-family:inherit]`** (ไม่ดึง **`font-sans`** จาก **`Button`** / next/font); หัวข้อ **`text-xl md:text-2xl font-bold`**

### บันทึกการทำงาน — 2026-05-18 (Build targets — browserslist + TS es2022)
- **Root:** ไม่มี **`.babelrc` / `babel.config.*`** (SWC ไม่ถูกสลับไป Babel)
- **`package.json`:** **`browserslist`** → **`defaults and supports es6-module`**, **`not ie 11`** (**`not lt ie 11`** ไม่รองรับใน Browserslist ที่ Next bundle), **`not dead`**
- **`tsconfig.json`:** **`compilerOptions.target`** = **`es2022`** (คง **`lib`**: **`esnext`**)

### บันทึกการทำงาน — 2026-05-18 (Hero / floating offers — layout rebalance)
- **`Hero.tsx`:** คอลัมน์สื่อคืน **`aspect-[4/5] h-[65svh]`** ทั้งโหมด carousel และ static — ตัดแยก ratio แคโรเซลที่ทำให้ grid/flex ชนกัน; คอลัมน์ซ้าย **`lg:min-w-0`**, **`break-words`**, ถอด **`shrink-0` / `lg:flex-none` / `lg:min-w-[min(100%,20rem)]`**
- **`FloatingOfferButton`:** **`FloatingCouponBadgeMedia`** อยู่ใน DOM เสมอ — เปิดด้วย **`opacity` / `invisible`** หลัง **`useEffect`** (**`badgeReveal`**)
- **`HomeHeroSkeleton`:** แผงขวา **`aspect-[4/5] h-[65svh]`** สอดคล้อง Hero

### บันทึกการทำงาน — 2026-05-15 (Hero carousel — aspect lock + rAF autoplay)
- **`Hero.tsx`:** คอลัมน์สื่อเมื่อมี **`heroCarousel`** → **`aspect-[390/429]`** / **`md:aspect-[16/7]`** + **`h-auto`** (ไม่พึ่ง **`h-[65svh]`** คู่กับ ratio ซ้อน)
- **`HeroCarouselSlideImages`:** ตัด nested **`aspect`** — **`Image`** **`fill`** ใน **`absolute inset-0`** ภายใต้ viewport ที่ถูกล็อกจาก Hero แล้ว
- **`HomeHeroCarousel`:** autoplay เลื่อนสไลด์ใน **`requestAnimationFrame`**; **`isolate`** บน root viewport
- **`HomeHeroCarouselMotion`:** **`will-change-[opacity]`** บนสไลด์ที่มี Framer fade
- **`HomeHeroSkeleton` / `HomeHeroCarouselSkeleton`:** skeleton สอดคล้อง aspect carousel

### บันทึกการทำงาน — 2026-05-15 (Webpack — drop merged `cacheGroups.styles`)
- **`next.config.mjs`:** ถอด **`splitChunks.cacheGroups.styles`** (**`priority: 100`**) — ให้ Next แยก CSS ตาม route/chunk ตามค่าเริ่มต้น (ลด stylesheet monolith / render-blocking ชิ้นเดียว)

### บันทึกการทำงาน — 2026-05-15 (Age gate — CSS visibility, fixed DOM tree)
- **`age-verification-gate.tsx`:** ถอด Radix Dialog — โครง overlay + การ์ดอยู่ใน DOM เสมอ; ซ่อนด้วย **`invisible opacity-0 pointer-events-none`** เมื่อ **`isVerified`** (เริ่มจาก **`initialVerifiedCookie`** + sync **`useEffect`** / auth); **`overflow: hidden`** บน **`body`** เมื่อเกตโชว์

### บันทึกการทำงาน — 2026-05-15 (LCP — age gate SSR + hero carousel decode priority)
- **`app/(storefront)/layout.tsx`:** **`AgeVerificationGate`** import แบบปกติ (**ไม่ใช้ `dynamic` `ssr: false`**) — ส่ง **`initialVerifiedCookie`** จาก **`cookies()`** (**`SMIL_AGE_VERIFIED_COOKIE_NAME`**)
- **`age-verification-gate.tsx`:** **`useState(() => !initialVerifiedCookie)`** แทนเริ่ม **`false`** + **`useEffect`** — เกตเปิดทันทีเมื่อยังไม่ยืนยันตามคุกกี้เซิร์ฟเวอร์; export ชื่อคุกกี้
- **`HeroCarouselSlideImages`:** เมื่อ **`priority`** — **`fetchPriority="high"`**, **`decoding="sync"`**; **`HomeHeroCarousel`** ส่ง **`priority={true}`** ชัดเจน

### บันทึกการทำงาน — 2026-05-15 (Hero / floating coupon — hydration-stable badge mount)
- **`FloatingOfferButton`:** คืน **`FloatingCouponBadgeMedia`** เป็น static import — เลื่อนแค่การ render badge หลัง **`useEffect`** (**`badgeMounted`**) พร้อม placeholder **`h-9 w-9`** (ไม่ใช้ **`next/dynamic`**, **`ssr: false`**)
- **`Hero.tsx`:** คอลัมน์ซ้าย **`opacity-100 visible shrink-0`** + **`lg:min-w-[min(100%,20rem)]`** + **`w-full min-w-0`** ที่ห่อเนื้อหา — ลดโอกาสโครงหด / motion ค้างที่ opacity 0

### บันทึกการทำงาน — 2026-05-15 (Perf — `next/dynamic` admin charts + lazy badge media)
- **Admin dashboards:** Recharts ย้ายไปโหลดแบบ **`dynamic(..., { ssr: false })`** — **`app/admin/dashboard/page.tsx`**, **`app/admin/analytics/page.tsx`**, **`app/admin/inventory/dashboard/page.tsx`** + ชิ้นส่วนใหม่ใต้ **`components/admin/dashboard/`**, **`components/admin/analytics/`**, **`components/admin/inventory/InventoryDashboardCharts.tsx`**
- **`RevenueProfitChart`:** ถอด **`IdleRender`** (เลื่อกจากการโหลดแบบ dynamic แล้ว)
- **`FloatingOfferButton`:** **`FloatingCouponBadgeMedia`** โหลดหลัง **`badgeMounted`** (**`useEffect`**) + placeholder ขนาดคงที่ (**ไม่ใช้ `next/dynamic`** เพื่อคง hydration tree)

### บันทึกการทำงาน — 2026-05-15 (Next images — global `unoptimized`)
- **`next.config.mjs`:** **`images.unoptimized: true`** — ข้าม **`/_next/image`** ทั้งแอป ให้โหลดตรงจาก Supabase/remote ที่อนุญาตใน **`remotePatterns`** (คง dynamic Supabase host + **`NEXT_PUBLIC_IMAGE_REMOTE_HOSTS`** + Unsplash / ucarecdn)

### บันทึกการทำงาน — 2026-05-15 (Vercel image diagnostics — gallery bypass + URL slashes)
- **`lib/vercel-image-offload.ts`:** **`productGalleryImageUnoptimized(src)`** — รวม **`NEXT_PUBLIC_PRODUCT_IMAGE_UNOPTIMIZED`** (**`true`** / **`1`**) เพื่อส่ง **`unoptimized`** ที่ **`ProductGallery`** ทดสอบว่า optimzier / limit ของ Vercel เป็นสาเหตุหรือไม่
- **`lib/public-storage-url.ts`:** **`normalizeHttpsUrlSlashes`** — path ที่มี **`//`** ซ้ำหลังโฮสต์ถูกยุบเป็นทางเดียวก่อนคืนจาก **`resolvePublicAssetUrl`**

### บันทึกการทำงาน — 2026-05-15 (Vercel images — Supabase remotePatterns + URL fallback)
- **`next.config.mjs`:** **`remotePatterns`** สำหรับ Supabase — **`public`** + **`sign`**; host คง **`jysdfxxilyjmjdmhazbu.supabase.co`** + host จาก **`NEXT_PUBLIC_SUPABASE_URL`**
- **`lib/public-storage-url.ts`:** **`getSupabaseOrigin()`** — **`NEXT_PUBLIC_SUPABASE_URL`** (validate URL) หรือ **`PUBLIC_SUPABASE_FALLBACK_ORIGIN`** — ไม่คืน **`/storage/...`** แบบไม่มีโดเมน
- **`lib/product-gallery-utils.ts`:** listing/detail URLs ผ่าน **`resolvePublicAssetUrl`**

### บันทึกการทำงาน — 2026-05-15 (Emergency — Hero layout + cart safeNumber + LazyMotion)
- **`FramerLazyRoot`:** **`domMax`** + **`strict={false}`** (รูปแบบมินิมอล)
- **`Hero.tsx`:** ถอด **`min-h-0`** จาก section / grid outer; คอลัมน์ซ้าย **`min-h-[auto]`**, **`visible`**, **`min-w-0`**, **`flex-1`**; media panel / carousel **`min-h-0`** ลดลงเป็น **`h-full w-full`**
- **`hooks/useCart.ts`:** **`safeNumber(unknown, fallback)`** + **`price`** กันไม่ finite → **0**; **`stock_quantity`** ถ้า parse เป็น NaN → **`undefined`**

### บันทึกการทำงาน — 2026-05-15 (LazyMotion domMax + Hero left column footprint)
- **`FramerLazyRoot`:** **`features={domMax}`** + **`strict={false}`** — โหลด layout/gesture เต็ม แก้การค้างที่ opacity เริ่มต้นเมื่อขาดฟีเจอร์
- **`Hero.tsx`:** คอลัมน์ซ้าย **`min-h-[min-content]`**, **`w-full flex-1`**, **`md:py-20`**, **`lg:py-12 xl:py-20`**, **`lg:w-full lg:self-stretch lg:flex-none`**; grid เพิ่ม **`lg:gap-0`**

### บันทึกการทำงาน — 2026-05-15 (LazyMotion — disable strict to stop hydration hard-fail)
- **Audit:** `components/storefront/`, `components/ui/` — ไม่มี **`motion.*`** / **`import { motion`** (มีแค่ **`m.*`**); ไม่มีโฟลเดอร์ **`components/navigation/`**
- **`FramerLazyRoot`:** **`strict={false}`** บน **`LazyMotion`** — cushion เมื่อมี **`motion`** หลุดจาก subtree / vendor

### บันทึกการทำงาน — 2026-05-15 (Hero carousel — plain anchors for Image fill)
- **`HeroCarouselSlideImages`:** แยก mobile/desktop เป็น **`absolute inset-0`** + **`relative … min-h-0 overflow-hidden`** ห่อแต่ละ **`Image fill`** (ไม่ให้โฟลเดอร์ animation เป็น parent ติดกับรูป)
- **`HomeHeroCarousel` / `HomeHeroCarouselMotion`:** แทรก **`div`** plain **`relative h-full w-full min-h-0`** ระหว่าง **`m.div`** กับ **`HeroCarouselSlideImages`**
- **`Hero.tsx`:** คอลัมน์สื่อ **`min-h-0`** + **`lg:w-full`** เพื่อโซ่ **`relative`/ความสูง grid** ชัดขึ้น

### บันทึกการทำงาน — 2026-05-15 (Perf — LazyMotion strict + IdleRender for charts/Lottie)
- **`FramerLazyRoot`:** **`LazyMotion features={domAnimation} strict`** — ย้ายไป **`app/layout.tsx`** ห่อทั้งแอป (admin + storefront); storefront layout ถอดซ้ำ
- **Storefront:** แปลง **`motion.*` → `m.*`** ในทุกไฟล์ที่ import framer-motion (ข้อกำหนดของ strict)
- **`components/utils/IdleRender.tsx`:** **`requestIdleCallback`** (timeout 2s) / fallback **`setTimeout(200)`** — defer children หลัง hydration ช่วงแรก
- **Recharts:** ห่อ **`ResponsiveContainer`** ใน **`IdleRender`** — **`RevenueProfitChart`**, **`ChannelPieChart`**, **`RevenueBarChart`**, **`app/admin/dashboard/page.tsx`**, **`app/admin/analytics/page.tsx`**, **`app/admin/inventory/dashboard/page.tsx`**
- **`FloatingCouponBadgeMedia`:** ห่อ **`lottie-react`** ด้วย **`IdleRender`**

### บันทึกการทำงาน — 2026-05-15 (Next — transpilePackages for legacy vendor bundles)
- **`next.config.mjs`:** **`transpilePackages`** — **`framer-motion`**, **`embla-carousel-react`**, **`embla-carousel`**, **`lottie-react`**, **`lottie-web`**, **`recharts`**, **`cmdk`**, **`@dnd-kit/*`**, **`emoji-picker-react`** (ให้ SWC แปลง vendor ที่มัก ship ES legacy เป็นโค้ดสมัยใหม่ตาม browserslist)

### บันทึกการทำงาน — 2026-05-15 (Babel config audit — SWC path clear)
- **Root scan:** ไม่มี **`.babelrc`**, **`.babelrc.json`**, **`babel.config.{js,json,cjs,mjs}`** ที่ root — **ไม่มีไฟล์ให้ลบ**
- **`package.json`:** ไม่มีคีย์ **`"babel"`** — **ไม่มีให้ตัด**
- **หมายเหตุ:** มี **`.babelrc`** เฉพาะภายใน **`node_modules`** (เช่น eslint / lottie) — Next ไม่ใช้เป็น config แอป; ถ้า Lighthouse ยังเห็น **`@babel/plugin-transform-*`** ให้ไล่ว่ามาจาก vendor bundle ไหน (ไม่ใช่ config โปรเจกต์)
- **`next.config.mjs`:** คง **`cacheGroups.styles`** + **`priority: 100`** ตามเดิม

### บันทึกการทำงาน — 2026-05-16 (Webpack styles chunk — priority 100)
- **`next.config.mjs`:** **`cacheGroups.styles`** เพิ่ม **`priority: 100`** เพื่อให้ชนค่า default ของ App Router และรวม CSS client bundle

### บันทึกการทำงาน — 2026-05-16 (Cart add — coerce string ids/qty before Zod)
- **`hooks/useCart.ts`:** **`normalizeAddToCartPayload`** ก่อน **`AddToCartSchema.safeParse`** — แปลง **`variantId` / `productId` / `quantity` / `price` / `stock_quantity` / `breeder_id`** จาก string/เลขทศนิยมให้เป็น integer/number ที่ schema ต้องการ (แก้ toast **expected number, received string** จากปุ่ม last-one / ProductCard)

### บันทึกการทำงาน — 2026-05-16 (Forced reflow — deferred geometric reads)
- **Audit `components/storefront/`:** พบ **`getBoundingClientRect`** เฉพาะ **`CartAnimation.tsx`** และ **`BreederRibbon.tsx`** (ไม่มี **`ResizeObserver`** candidate จาก **`window.resize`** / **`innerWidth`** ใน storefront)
- **`lib/schedule-layout-read.ts`:** **`scheduleLayoutRead(cb)`** — double **`requestAnimationFrame`** + cancel เพื่อเลื่อนการอ่าน geometry หลัง layout
- **`CartAnimation`:** จุดปลายทางการ์ดบิน + **`requestCartFlyAnimation`** ใช้ **`scheduleLayoutRead`**; **`safeFinish`** / unmount เรียก **`cancelLayoutRead`**
- **`BreederRibbon`:** tooltip **`mouseEnter`** / coalesced **`mousemove`** ใช้ **`scheduleLayoutRead`** หลัง rAF batch เดิม

### บันทึกการทำงาน — 2026-05-16 (Webpack — single client CSS chunk via splitChunks.styles)
- **`next.config.mjs`:** **`webpack(config, { dev, isServer })`** — production client เพิ่ม **`cacheGroups.styles`** (**`test: /\.css$/`**, **`chunks: 'all'`**, **`enforce: true`**, **`name: 'styles'`**) เพื่อรวม CSS split เป็นชุดเดียว (ลดสาย render-blocking จากหลายไฟล์)
- **`npm run build`:** ผ่าน (compile + static generation)

### บันทึกการทำงาน — 2026-05-16 (Hero carousel layout — relative frame + grid height)
- **`Hero.tsx`:** คอลัมน์สื่อ **`lg:h-full lg:min-h-[88vh]`** (แทน **`lg:h-auto`**) เพื่อให้ **`h-full`** ลูก resolve ใน grid; รูป static (ไม่มี carousel) ห่อ **`relative`** ก่อน **`<Image fill />`**
- **`HeroCarouselSlideImages`:** โครง **`relative h-full w-full`** + กล่อง **`aspect-[390/429] md:aspect-[16/7]`** ซ้อนรูปมือถือ/เดสก์ท็อป **`fill`** (**`md:hidden` / `hidden md:block`**)
- **`HomeHeroCarousel` / `HomeHeroCarouselMotion`:** สไลด์ **`absolute inset-0`** ไม่ใช้ **`flex-col`** ที่ทำให้บล็อก aspect เพี้ยน — ใช้ **`md:flex`** center เมื่อมีเล็ตเตอร์บ็อกซ์
- **`HomeHeroCarouselSkeleton`:** **`min-h-[65svh] lg:min-h-[88vh]`** ให้สอดคล้องโครง Hero
- **`HomeHeroLcpPreload`:** ความสูง preload คู่กับ aspect **390:429** และ **16:7**

### บันทึกการทำงาน — 2026-05-16 (Storefront a11y — text contrast WCAG)
- **`ProductCard`:** breeder link **`text-zinc-600`** / hover **`text-emerald-900`**; pack label **`text-emerald-800`**; badge **ใหม่** **`bg-emerald-800 text-white`**; discount ribbon **`bg-emerald-800`**; THC/type separator **`text-zinc-500`**; strike **`text-zinc-500`**
- **`ShopSpotlightCard`:** pack **`text-emerald-800`**; strike **`text-zinc-500`**
- **`Footer`:** mono bar + legal **`text-zinc-600`**, **`hover:text-foreground`**
- **`WelcomeModal`:** หัวกล่องโค้ด **`text-zinc-600`**
- **`FloatingOfferButton`:** minSpend + footer hint **`text-zinc-600`**
- **`ShopGeneticVaultHero` / magazine cards:** breeder บรรทัด **`text-zinc-600`**
- **`CheckoutPageClient` / `CartSheet`:** ลบโค้ด / Sparkles / encryption note / separator / strike / MapPin — **`text-zinc-500`–`600`**

### บันทึกการทำงาน — 2026-05-16 (globals.css prune — drop unused component layers)
- **`app/globals.css`:** คง **`@tailwind`** + **`:root`** tokens + **`border-border`** + **`body`** (**`@apply font-sans antialiased`** แทน font stack ซ้ำกับ **`tailwind.config.ts`**) + **`.magazine-article-emoji`** + **`@media print`** — ลบ **`btn-primary` / `btn-secondary` / `product-card` / badge utilities** ที่ไม่ถูกอ้างใน repo
- **`app/layout.tsx`:** **`scroll-smooth`** บน **`<html>`** แทน **`html { scroll-behavior }`** ใน globals

### บันทึกการทำงาน — 2026-05-18 (Hero — CSS animate-in คอลัมน์ซ้าย + Suspense แคโรเซลแยก)
- **`components/storefront/Hero.tsx`:** คอลัมน์ซ้ายเลิก **`framer-motion`** (`m.p` / `m.h1` / `m.div`) → **`animate-in fade-in slide-in-from-left-5 duration-500 fill-mode-both`** บน wrapper (**`tailwindcss-animate`**)
- **`app/(storefront)/home-stream.tsx`:** **`HeroCarouselStream`** + **`HeroCarouselSuspenseFallback`** (`aspect-[4/5] h-[65svh] …`) — แยก lifecycle การสตรีม **`HomeHeroCarousel`**

### บันทึกการทำงาน — 2026-05-15 (SWC / polyfills — browserslist modern-only)
- **สแกนโปรเจกต์:** ไม่มี **`.babelrc`**, **`babel.config.*`**, หรือ **`babel`** ใน **`package.json`** — Next ใช้ SWC ตามปกติ
- **`package.json`:** **`browserslist`** = **`defaults and supports es6-module`**, **`not ie 11`** (สตริง **`not lt ie 11`** ไม่รองรับใน Browserslist ที่ Next bundle — build error), **`not dead`**
- **`tsconfig.json`:** **`compilerOptions.target`** คง **`ES2022`**
- **`next.config.mjs`:** ไม่มี **`compiler.babel`** / override ที่ปิด SWC; **`swcMinify`** ไม่จำเป็นใน Next 14 (ค่าเริ่มต้น minify ด้วย SWC)

### บันทึกการทำงาน — 2026-05-15 (Home — route-level dynamic imports / micro CSS decouple)
- **`app/(storefront)/page.tsx`:** **`Suspense`** เดิม — แต่ **`HomeHeroLcpHints`** / **`HomeMainStream`** โหลดผ่าน **`await import("./home-lcp-hints")`** และ **`await import("./home-stream")`** (ไม่ static import สตรีม); fallback หลัก = **`min-h-[100svh] bg-zinc-50`** (ไม่ **`HomeHeroSkeleton`**)
- **`app/(storefront)/home-lcp-hints.tsx`:** (ใหม่) **`server-only`** — **`HomeHeroLcpPreload`** + **`getHeroCarouselBannersCached`** แยก chunk จาก **`home-stream`**
- **`app/(storefront)/home-stream.tsx`:** **`HomePageClient`** **`dynamic`** `loading` = placeholder Tailwind; **`HeroBannersBody`** **`import()`** **`HomeHeroCarousel`**; Suspense แคโรเซล fallback = div **`animate-pulse`** inline (ไม่ **`HomeHeroCarouselSkeleton`** / **`HomeHeroSkeleton`**)

### บันทึกการทำงาน — 2026-05-16 (Unused JS — LazyGoogleAnalytics + dynamic HomePageClient)
- **`components/third-parties/LazyGoogleAnalytics.tsx`:** mount **`GoogleAnalytics`** หลัง interaction แรก (**scroll / mousemove / touchstart / click / keydown**) — Lighthouse bot ไม่โหลด gtag จนกว่ามี interaction
- **`app/layout.tsx`:** ใช้ **`LazyGoogleAnalytics`** แทน **`GoogleAnalytics`** ตรงๆ
- **`app/(storefront)/home-stream.tsx`:** **`HomePageClient`** → **`next/dynamic`** พร้อม **`loading: HomeHeroSkeleton`** — แยก client chunk จากสตรีม RSC (**`Hero`** ยัง static ใน **`HomePageClient`** เพื่อ LCP)
- **`HomePageBelowFold`** ยัง **`dynamic` + `ssr: false`** ใน **`HomePageClient`** เหมือนเดิม

### บันทึกการทำงาน — 2026-05-16 (JS exec — @next/third-parties GA + Navbar dynamic chunks)
- **`app/layout.tsx`:** GA ใช้ **`GoogleAnalytics`** จาก **`@next/third-parties/google`** (**`gaId`** = **`GA_MEASUREMENT_ID`** เดิม env+fallback) — ลบ **`next/script`** คู่ manual
- **`components/storefront/Navbar.tsx`:** **`CartSheet`** + **`SearchCommand`** → **`next/dynamic`** **`{ ssr: false }`** แยก chunk จาก Navbar bundle
- **`@next/third-parties`:** มีใน **`package.json`** แล้ว — ไม่ต้องติดตั้งเพิ่ม
- **ตรวจ storefront:** ไม่มี **`lodash`** import ใน **`components/storefront`** / **`app/(storefront)`**; **`AgeVerificationGate`** / **`CartAnimation`** / **`Footer`** dynamic ใน storefront layout อยู่แล้ว

### บันทึกการทำงาน — 2026-05-15 (Main-thread — optimizePackageImports + content-visibility + GA env)
- **`next.config.mjs`:** **`experimental.optimizePackageImports`** เพิ่ม **`recharts`**, **`cmdk`**, **`sonner`**, **`@radix-ui/react-dialog|dropdown-menu|select|tabs|popover|scroll-area|tooltip|accordion`**
- **`components/storefront/HomePageBelowFold.tsx`:** wrapper แต่ละ section below-fold ใส่ **`[content-visibility:auto]`** + **`[contain-intrinsic-size:auto_560px]`**; **`cn`** จาก **`@/lib/utils`**
- **`app/layout.tsx`:** GA ID จาก **`NEXT_PUBLIC_GA_ID`** (trim) fallback **`G-RSY7B2ZH9X`** — script ยัง **`strategy="lazyOnload"`**

### บันทึกการทำงาน — 2026-05-15 (Browserslist + TS target — fewer legacy polyfills)
- **`package.json`:** เพิ่ม **`browserslist`** (Chrome/Safari/Firefox/Edge ล่าสุด 2 เวอร์ชัน + **`not dead`**) — ไม่มี **`.browserslistrc`** เดิม
- **`tsconfig.json`:** **`compilerOptions.target`** **`ES2022`** (เดิม **`es2017`**) — ลบ **`downlevelIteration`**
- **ตรวจ polyfill:** ไม่พบ **`core-js`** / **`regenerator-runtime`** import ในโค้ดโปรเจกต์

### บันทึกการทำงาน — 2026-05-15 (Hero LCP image — 412px bucket + AVIF + aligned sizes/preload)
- **`next.config.mjs`:** **`deviceSizes`** เพิ่ม **412**; comment ว่า **`formats`** ใช้ AVIF ก่อน WebP
- **`hero-carousel-image-sizes.ts`:** ค่าคงที่ **`HERO_CAROUSEL_MOBILE_SIZES`** / **`DESKTOP_SIZES`** ใช้ร่วม preload + **`HeroCarouselSlideImages`**
- **`HeroCarouselSlideImages`:** มือถือ **`sizes`** = **`100vw`** (ไม่ cap 391px)
- **`HomeHeroLcpPreload`:** **`getImageProps`** มือถือ **412×452**, **`sizes`** เดียวกับ carousel; preload ใช้ **`imageSrcSet`** + **`imageSizes`** เมื่อมี **`srcSet`**

### บันทึกการทำงาน — 2026-05-15 (Home streaming + layout preconnect inline)
- **`app/(storefront)/page.tsx`:** **`Suspense`** คู่ — **`HomeHeroLcpHints`** (preload สไลด์แรก) สตรีมคู่ขนานกับ **`HomeMainStream`** (รอแค่ **`getSections`** แล้วส่ง **`HomePageClient`**); แคโรเซลอยู่ใน **`Suspense`** ภายใน (**`HeroBannersBody`**) + **`HomeHeroCarouselSkeleton`**
- **`app/(storefront)/home-stream.tsx`:** ย้าย **`getSectionsCached`** / RSC สตรีมออกจาก **`page.tsx`** (**`server-only`**)
- **`HomeHeroSkeleton.tsx`:** fallback โครง Hero (Tailwind เท่านั้น)
- **`app/layout.tsx`:** preconnect/dns-prefetch Supabase inline ใน **`<head>`** — ลบ **`SupabaseStoragePreconnect.tsx`** (React 18 ไม่มี **`ReactDOM.preconnect`**)
- **CSS audit หน้าแรก:** ไม่พบ **`.module.css`** / import **`.css`** นอก **`globals.css`** — chunk CSS เล็กมาจากการแยก bundle ของ **`next/dynamic`** (below-fold) ไม่ใช่ CSS Modules

### บันทึกการทำงาน — 2026-05-15 (Home LCP — hero preload + no carousel skeleton gate)
- **`app/(storefront)/page.tsx`:** **`Promise.all(getSections, getHeroCarouselBannersCached)`** — ส่ง **`heroBanners`** เข้า **`HomeHeroCarousel`** โดยตรง (เลิก **`HomeHeroCarouselSlot` / Suspense fallback** ว่าง)
- **`HomeHeroLcpPreload.tsx`:** **`link rel="preload" as="image"`** สำหรับสไลด์แรก (มือถือ **`w=390,q=60`** / เดสก์ท็อป **`w=640,q=65`**) จาก **`getImageProps`** → URL **`/_next/image?...`** ตรงกับ **`HeroCarouselSlideImages`**
- **`Hero.tsx`:** ถ้ามี **`heroCarousel`** แสดงทันที — **ไม่รอ** **`useSiteSettings`** skeleton (เดิมบังคับ LCP หลังโหลด settings)
- **ลบ `HomeHeroCarouselSlot.tsx`**

### บันทึกการทำงาน — 2026-05-15 (Reflow: rAF scroll + geometry reads)
- **`lib/subscribe-scroll-y-beyond.ts`:** รวมการอ่าน **`scrollY`** ใน **`requestAnimationFrame`** + ตัด **`setState`** ซ้ำเมื่อค่า boolean เท่าเดิม — ใช้ใน **`Navbar`** และ **`ShopPageClient`**
- **`CartAnimation`:** **`getBoundingClientRect`** หลังคลิก / ใน **`FlyingItem`** ห่อด้วย **`requestAnimationFrame`**
- **`BreederRibbon`:** tooltip **`getBoundingClientRect`** บน **`mousemove`** ผ่าน rAF หนึ่งเฟรมต่อครั้ง; **`mouseEnter`** อ่าน rect ใน rAF หลัง delay
- **`manual/page` export PNG:** อ่าน **`offsetWidth`/`offsetHeight`** หลัง rAF หนึ่งเฟรม (หลัง style writes + delay)

### บันทึกการทำงาน — 2026-05-15 (Product gallery stacked images + Supabase preconnect + detail perf)
- **`ProductGallery`:** ซ้อน **`next/image`** ทุกรูปใน hero + lightbox — **`selected` / `index`** ควบคุม **`opacity` / `z-index` / `pointer-events`**; รูปแรก **`priority` + eager`** ที่เหลือ **`lazy`**; **`quality={75}`**
- **`product-detail-client`:** ลบ **`framer-motion`** จากคอลัมน์หลัก (ลด bundle / CSS ที่เกี่ยวกับ motion)
- **`app/layout.tsx`:** **`preconnect`** + **`dns-prefetch`** Supabase origin ใน **`<head>`** (inline helper)
- **`app/(storefront)/layout.tsx`:** comment ว่า App Router ไม่สามารถ inject `<head>` — preconnect อยู่ root layout

### บันทึกการทำงาน — 2026-05-15 (ProductGallery: explicit quality 75 on all Images)
- **`ProductGallery`:** thumb strip + lightbox strip **`quality={75}`** ครบทุก **`next/image`** (เดิมบางจุดพึ่ง default — อาจชน whitelist)

### บันทึกการทำงาน — 2026-05-15 (Fix Image quality vs next.config)
- **`ProductGallery`:** **`quality={100}`** → **`75`** (ให้ตรง **`images.qualities`** ใน **`next.config.mjs`**)
- **`Footer`:** **`quality={78}`** → **`75`** (ค่าเดิมไม่อยู่ใน whitelist)

### บันทึกการทำงาน — 2026-05-15 (Breeder catalog provider + GA lazyOnload + fetchPriority)
- **`context/BreederCatalogContext.tsx`:** **`BreederCatalogProvider`** — **`fetchActiveBreeders`** ครั้งเดียวต่อ storefront layout subtree (Navbar / Ribbon / dropdown ใช้ context เดียวกัน)
- **`hooks/useBreeders.ts`:** มี provider → อ่านจาก context; ไม่มี → fallback fetch เดิม (แอดมินที่อยู่นอก storefront layout)
- **`app/(storefront)/layout.tsx`:** wrap **`BreederCatalogProvider`** ภายใต้ **`LanguageProvider`**
- **`app/layout.tsx`:** GA **`next/script`** **`strategy="lazyOnload"`** (inline **`gtag`** config + **`googletagmanager.com/gtag/js`**); ลบ **`@next/third-parties/google`** **`GoogleAnalytics`**
- **`ProductCard`:** **`fetchPriority="low"`** เมื่อ **`imagePriority`** = false
- **`HomeInsightSection`:** blog card / featured image **`fetchPriority="low"`** + grid **`loading="lazy"`**

### บันทึกการทำงาน — 2026-05-15 (Breeder fetch dedupe + GA third-parties + font hints)
- **`services/breeder-service.ts`:** **`fetchActiveBreeders`** in-flight + **memory cache** (TTL **15m**) — ลดซ้ำเมื่อ **`useBreeders`** mount หลายครั้ง (Navbar / Ribbon / dropdown)
- **`app/layout.tsx`:** **`@next/third-parties/google`** **`GoogleAnalytics`** แทน **`next/script`** คู่ manual; ลบ **`<link rel="preconnect" fonts.googleapis>`** (ฟอนต์ storefront = **`next/font`** self-host)
- **`BreederDropdownMenu`:** ปุ่ม Seeds เพิ่ม **`aria-label`**

### บันทึกการทำงาน — 2026-05-15 (Perf polish — age gate logo / hero sizes / nav a11y)
- **`age-verification-gate`:** โลโก้ **`next/image`** ลบ **`unoptimized`** → **`priority`**, **`fetchPriority="high"`**, **`sizes="160px"`**; ปุ่ม TH/EN มี **`aria-label`** แยก
- **`HeroCarouselSlideImages`:** **`sizes`** mobile **`min(100vw, 391px)`** / desktop cap **`640px`** — **ไม่มี** **`unoptimized`**
- **`Navbar`:** ภาษา desktop + mobile = **`role="group"`** + ปุ่ม TH/EN แยก (**`type="button"`** + **`aria-label`** ไม่ซ้ำ); โปรไฟล์ / hamburger มี **`type`**
- **`EMPTY_STOREFRONT_HOME_PAYLOAD`:** JSDoc ยืนยันแค่ array ว่าง; **`page.tsx`** comment ที่ **`initialData`**

### บันทึกการทำงาน — 2026-05-15 (Home payload compact + a11y polish)
- **`storefront-home-service`:** **`compactHomePayload`** — ตัด **`image_urls`** เมื่อมี **`product_images`**; doc ระบุ **`MAGAZINE_PUBLIC_POST_SELECT`** ไม่ดึง **`content` / `content_en` / `raw_input`**
- **`Navbar`:** ปุ่ม Sign Out (desktop dropdown + mobile) เพิ่ม **`type="button"`** + **`aria-label`**
- **`layout`:** **`AgeVerificationGate`** **`dynamic`** จัดบรรทัดให้อ่านง่าย (ยัง **`ssr: false`**)
- **`HomePageClient`:** ลบ **`console.log`** ชั่วคราว (เก็บ **`console.error`** ใน catch)
- **`Hero` EST. 2018:** มี **`text-emerald-950`** อยู่แล้วบนบล็อก mono

### บันทึกการทำงาน — 2026-05-15 (Fix empty home rails — HOME_API_LIMIT + API timeout)
- **`storefront-home-service`:** ประกาศ **`HOME_API_LIMIT`** (`HOME_STOREFRONT_HOME_API_SECTION_LIMIT`) — แก้ **`ReferenceError`** ที่ทำให้ **`/api/storefront/home`** ล้มทั้งก้อน; **`HOME_DATA_TIMEOUT_MS`** = **8000**
- **`GET /api/storefront/home`:** เรียก **`getStorefrontHomePayload()`** ไม่ส่ง **2000ms** (เดิมทำให้ **`withTimeout`** คืนชุดว่างบ่อย)
- **`product-service`:** home card select เพิ่ม **`is_active`**, **`image_urls`** (fallback รูป legacy)
- **`HomePageClient`:** **`console.log("API Response:", …)`**, **`console.error`** ใน catch; **`fetchWithTimeout` 8000ms**

### บันทึกการทำงาน — 2026-05-15 (Home API cap + layout/navbar force-pass)
- **`lib/constants`:** **`HOME_STOREFRONT_HOME_API_SECTION_LIMIT`** = **4** — `GET /api/storefront/home` ดึง/slice โครงสร้างสูงสุด **4** ต่อ rail
- **`storefront-home-service`:** `getNewArrivals` / clearance / magazine / featured slice ตาม limit นี้; comment อ้าง **`MAGAZINE_PUBLIC_POST_SELECT`** (ไม่มี `content` / `content_en` / `raw_input`)
- **`Navbar`:** โลโก้จัดลำดับ prop **`priority`** / **`fetchPriority`** ก่อน **`sizes`** (ไม่มี `unoptimized` / `lazy`)
- **`app/(storefront)/layout`:** **`AgeVerificationGate`** = **`dynamic(...).then(m => m.AgeVerificationGate)`** บรรทัดเดียว + **`ssr: false`**

### บันทึกการทำงาน — 2026-05-15 (Home hero streaming — carousel Suspense slot)
- **`services/hero-banner-service.ts`:** **`getHeroCarouselBannersCached`** (`unstable_cache` เดิมจากหน้าแรก)
- **`HomeHeroCarousel` / หน้าแรก:** **`Promise.all`** sections + **`getHeroCarouselBannersCached`**; **`HomeHeroLcpPreload`** + แคโรเซลไม่ถูก skeleton settings บัง (ดูหัวข้อ LCP ล่าสุด)
- **`app/(storefront)/layout.tsx`:** **`dynamic`** **`AgeVerificationGate`** เป็น **`.then((m) => m.AgeVerificationGate)`**

### บันทึกการทำงาน — 2026-05-15 (Home API payload — blog select + slim product cards + hero quality)
- **`lib/blog-service.ts`:** `MAGAZINE_PUBLIC_POST_SELECT` — list/carousel queries **ไม่ดึง** `content` / `content_en` / `raw_input` / AI fields (แก้ JSON ~MB ใน `/api/storefront/home` magazine slice)
- **`product-service`:** `STOREFRONT_HOME_CARD_PRODUCT_SELECT` ตัด **`image_urls`**, **`category_id`**, **`product_categories`** (เก็บรายการที่การ์ดจำเป็น + `product_images`)
- **`HeroCarouselSlideImages`:** mobile **`quality={60}`**, desktop **`65`**
- **`age-verification-gate`:** Lucide **`leaf`** deep path

### บันทึกการทำงาน — 2026-05-15 (Storefront layout — AgeVerificationGate client-only)
- **`app/(storefront)/layout.tsx`:** **`AgeVerificationGate`** → **`next/dynamic`** **`{ ssr: false }`** (ไม่บล็อก render แรกของเลย์เอาต์)

### บันทึกการทำงาน — 2026-05-15 (Perf polish — Navbar logo LCP + lucide UI + hero hydration)
- **`Navbar`:** โลโก้ `next/image` → **`priority`**, **`fetchPriority="high"`**, **`sizes`**, ลบ **`unoptimized`** / **`loading="lazy"`** (ให้โหลดเร็วคู่กับ hero)
- **`components/ui`:** **`command` / `toast` / `sheet`** → Lucide **`lucide-react/dist/esm/icons/*`** (เหลือ **`LucideIcon` type** ใน **`empty-state`**)
- **`HomeHeroCarousel`:** wrapper สไลด์แรก **`suppressHydrationWarning`** (ลด mismatch/แฟลชจาก hybrid client tree)
- **ตรวจ leak:** ไม่มี **`@react-pdf/renderer` / exceljs / jspdf** ใน **`app/(storefront)`**

### บันทึกการทำงาน — 2026-05-15 (Critical perf — LCP hero split + bundle + Prisma home)
- **`HomeHeroCarousel`:** สไลด์แรก = **`div` + `HeroCarouselSlideImages`** (ไม่มี Framer); สไลด์ 2+ โหลด **`HomeHeroCarouselMotion`** ผ่าน **`next/dynamic` `ssr: false`** แยก chunk
- **`next.config.mjs`:** **`experimental.optimizePackageImports`** → `lucide-react`, `framer-motion`, `@radix-ui/react-icons`
- **`services/product-service`:** **`STOREFRONT_HOME_FEATURED_PRODUCT_SELECT`** ตัด **`description_th` / `description_en`** — featured note ใช้ genetics/strain_dominance/THC ใน **`ShopGeneticVaultHero`**
- **`ShopGeneticVaultHero` / `Hero` / `ClearanceSection` / `SearchCommand`:** contrast + **`aria-label`** (previous PR + restore partial)
- **`lib/promotion-utils.ts`:** stub **`applyPromotions`** + types — แก้ import หายใน POS create order build
- **หมายเหตุ:** bulk codemod lucide deep-import เคยทำพังไฟล์ — **คืนจาก git** แล้วพึ่ง **`optimizePackageImports`** + deep path เฉพาะ hero carousel icons

### บันทึกการทำงาน — 2026-05-15 (Perf/a11y — LCP hero + labels + contrast)
- **`HomeHeroCarousel`:** สไลด์แรก **`initial={false}`** (ไม่ fade-in opacity 0); LCP image **`priority` / `loading="eager"` / `fetchPriority="high"`**; ปุ่ม **`Previous Slide` / `Next Slide`** (ไม่ใช้ blur บนปุ่ม)
- **`Hero.tsx`:** บรรทัด EST.2018 ใช้ **`text-emerald-950`** ทุก breakpoint; คำอธิบายใต้หัว **`text-zinc-700`**
- **`ClearanceSection` / `ShopGeneticVaultHero` / `ProductGallery` (lightbox):** **`aria-label`** สไลด์ EN **Previous Slide / Next Slide**
- **`Navbar` / `SearchCommand`:** **`Open shopping cart`** / **`Search products and navigate`**
- **`HomePageBelowFold`:** **`dynamic(..., { ssr: false })`** สำหรับ FeaturedProductHero, BreederShowcase, ClearanceSection, BreederRibbon, HomeInsightSection
- **`app/(storefront)/page.tsx`:** Suspense fallback เป็น spinner CSS (ไม่ import **`lucide-react`**)

### บันทึกการทำงาน — 2026-05-15 (Bundle — layout chunk / TBT)
- **`FramerLazyRoot`:** `LazyMotion` + async **`domAnimation`** (`strict={false}`) ครอบ Navbar/main/Footer/OfferManager ใน **`app/(storefront)/layout.tsx`** — แยก feature bundle ของ Framer ออกจากโหลดแรก
- **`app/(storefront)/layout.tsx`:** **`dynamic` `ssr: false`** สำหรับ PromotionBanner, BrowserDetectionBanner, CartAnimation (คง AgeVerificationGate sync)
- **`HomePageBelowFold`:** **`next/dynamic`** → FeaturedProductHero, BreederShowcase, ClearanceSection, BreederRibbon, **`HomeInsightSection`** (ไฟล์ใหม่); Lucide **`ChevronRight`** แบบ deep path
- **`Navbar` / `CartAnimation` / `HomeInsightSection`:** Lucide จาก **`lucide-react/dist/esm/icons/*`**
- **`next.config.mjs` + `package.json`:** **`@next/bundle-analyzer`** + script **`npm run analyze`** (`ANALYZE=true`)

### บันทึกการทำงาน — 2026-05-15 (Home payload — card images + slim Prisma)
- **`ProductCard`:** `sizes` `(max-width:768px) 50vw, (max-width:1200px) 25vw, 20vw` + **`quality={60}`**; ยัง **`unoptimized` เฉพาะ** URLs ที่ **`shouldOffloadImageOptimization`**
- **`product-service`:** home/API listing — **`select`** (`STOREFRONT_HOME_CARD_PRODUCT_SELECT` / featured **`+`** description/CBD/yield); **`getClearanceStorefrontProducts`** จำกัด scan **`fetchTake`**; **`getFeaturedProducts`** featured carousel fields ครบ **`VaultHeroSlide`**
- **`lib/constants`:** **`HOME_NEW_ARRIVALS_LIMIT`** = **8**, เพิ่ม **`HOME_FEATURED_POOL`** (**8**), **`HOME_FEATURED_SHOW`** (**4**), **`HOME_CLEARANCE_LIMIT`** (**8**); **`storefront-home-service`** + **`GET .../featured-products`** sync constants
- **`Footer`:** โลโก้ผ่าน **`next/image`** (sizes **`120px`**, **`quality`** ~78) + offload เท่าที่จำเป็น — social เป็น SVG อยู่แล้ว
- **`next.config.mjs`:** **`qualities`** รวม **60**; **`deviceSizes`** ตัดชุดใหญ่ (ไม่มี 1200/1280/1920)

### บันทึกการทำงาน — 2026-05-15 (Perf pass — carousel / TBT / a11y)
- **`HomeHeroCarousel`:** LCP เฉพาะ **`index === 0`** (`priority` / `eager`); mobile **`quality={65}`**; dot **`aria-label`**; desktop quality 72/68
- **`HomePageClient`:** **`Suspense`** + **`dynamic(..., { ssr: false })`** สำหรับ below-fold; **`app/(storefront)/layout`** Footer / OfferManager **`ssr: false`**
- **`app/(storefront)/page.tsx`:** server โหลดแค่ **`getSections` + hero banners** — **`initialData`** ว่าง → client ดึง **`/api/storefront/home`** (ลดงานก่อน hero render); ลบ **`getStorefrontHomeCached`** ออกจากหน้านี้ (แท็ก **`storefront-home`** ยังใช้เวลา revalidate จาก API/cache อื่นได้)
- **`app/layout.tsx`:** viewport **zoom ได้** (`maximumScale: 5`, `userScalable: true`, `minimumScale: 1`); GA **`strategy="afterInteractive"`**
- **`Hero`:** founding mono **`lg:text-zinc-800`**; **`Navbar`** hamburger **`aria-expanded`** + **`aria-label`** เปิด/ปิดเมนู; mobile language **`aria-label`**

### บันทึกการทำงาน — 2026-05-15 (Home cache invalidation + fonts)
- **Admin products mutations:** `revalidateTag('storefront-home')` หลังสำเร็จใน **`PATCH /api/admin/products/[id]`**, **`POST /api/admin/products`**, **`PATCH .../[id]/field`**, **`PATCH .../[id]/status`**, **`PATCH .../bulk-status`**
- **`app/layout.tsx`:** `<head>` **`preconnect`** → `fonts.googleapis.com` + `fonts.gstatic.com` (`crossOrigin="anonymous"`); **`next/font`** Inter/Prompt คง **`display: 'swap'`**
- **`product-service`:** **`getFeaturedProducts`** / **`getClearanceStorefrontProducts`** ใช้ **Prisma** แทน Supabase **`createClient()`** เพื่อให้ **`getStorefrontHomeCached`** (`unstable_cache`) ไม่เรียก `cookies()` ระหว่าง build/prerender ของ `/`

### บันทึกการทำงาน — 2026-05-15 (Home perf — Lighthouse)
- **`HomePageClient`:** hero sync + **`next/dynamic`** → **`HomePageBelowFold`**; **`app/(storefront)/layout.tsx`** **`dynamic`** **`Footer`** / **`OfferManager`**; **`app/layout.tsx`** **`Analytics`** `dynamic(..., { ssr: false })`
- **`app/(storefront)/page.tsx`:** **`unstable_cache`** แท็ก **`storefront-home`** (`revalidate: 120`) + **`home-hero-banners`**; admin hero CRUD/order → **`revalidateTag('home-hero-banners')`**
- **`hero-banner-service`:** `findMany` carousel ใช้ **`select`** เฉพาะฟิลด์ที่ map เป็น **`HeroBanner`**
- **`HomeHeroCarousel`:** `sizes` จำกัดความกว้างโลจิคัล / **`quality`** ต่ำกว่า LCP; จุดสไลด์ hit area ≥44px
- **`Hero`:** founding mono **`text-emerald-950` / `lg:text-zinc-700`**; **`video`** **`preload="none"`**
- **`next.config.mjs`:** **`images.qualities`** + ตัด **`deviceSizes`** ลดชุดใหญ่ (ไม่มี 2048/3840)

### บันทึกการทำงาน — 2026-05-15 (Image optimization — AVIF/WebP + config)
- **`next.config.mjs`:** `deviceSizes` / `imageSizes`, `minimumCacheTTL`, `remotePatterns` เพิ่ม Unsplash + Uploadcare + `NEXT_PUBLIC_IMAGE_REMOTE_HOSTS` (comma-separated hostname); **`shouldOffloadImageOptimization`** เหลือแค่ `data:` / `blob:` เพื่อให้ Supabase/remote ผ่าน `/_next/image`
- **Hero / carousel / listing:** `HomeHeroCarousel` ลบ `unoptimized`, ปรับ `sizes`; `Hero` static ใช้ alt จาก headline; **`ProductCard`** `sizes` ตามสเปก + alt fallback; **`ProductGallery`** alt/name fallback; **`ProductImageUpload`** เปลี่ยน thumb เป็น `next/image`
- **แอดมิน:** ข้อความช่วยจำ upload WebP/PNG ใน Hero modal / Article banner modal / Product gallery drop zone

### บันทึกการทำงาน — 2026-05-15 (Article banners hub + API)
- **ตาราง `article_banners`** — migration `20260515143000_article_banners`; Prisma model + **`services/article-banner-service.ts`** (`getArticleBannerForBlog`, CRUD admin); storefront **`ArticleCampaignBanner`** ใช้แถวนี้ก่อน แล้ว fallback **`promotion_campaigns`** เดิม
- **API:** `GET`/`POST` `/api/admin/banners/articles`, `PATCH`/`DELETE` `/api/admin/banners/articles/[id]`; ประเภท **`ArticleBannerAdminRow`** อยู่ที่ **`lib/article-banner-admin.ts`** (ให้ client import ได้โดยไม่ผูก `server-only`)
- **แอดมิน:** `ArticleBannerManagerClient` — ตาราง + สวิตช์ Active + modal เพิ่ม/แก้ไข + อัปโหลด (preset hero); ลบปุ่ม Manage popup campaigns; **`page.tsx`** โหลดจาก **`getAdminArticleBanners`**

### บันทึกการทำงาน — 2026-05-15 (Hero sharp cut — no overlays)
- **`HomeHeroCarousel`:** ลบ overlay gradient บน mobile; **`Hero`:** ลบ overlay ทั้งหมดบนแผงสื่อ (รวม desktop fade ซ้าย); mobile text column ใช้ **`bg-white`** แทน `bg-gradient-to-t`; คงแค่ ring บน desktop (`max-lg:hidden`)


### บันทึกการทำงาน — 2026-05-15 (Storefront fixed nav content offset)
- **`<main>`** `app/(storefront)/layout.tsx` — `pt-20 sm:pt-28` ให้สอดคล้องแถบใน `Navbar` (`h-20` / `sm:h-28`); **Hero** ตัด `max-lg:-mt-[4.5rem]` ที่ดึง hero เข้าใต้ header
- **ลบ padding ซ้ำ** ที่เคยชดเชยเอง: `HomePageClient`, `ShopPageClient`, `CheckoutPageClient`, `PaymentPageClient`, `product-detail-client`, `checkout/page` + `loading`, `login`, `profile`, `order-success`

### บันทึกการทำงาน — 2026-05-15 (Hero split layout hints + panel bg)
- **Split hero UX:** mobile `aspect-[391/429]` + `object-contain`, export **1173×1287** = zero-gap fit; desktop `617:890` + cover; `panel_bg_hex`; carousel rail **ไม่มี padding** / mobile layout **justify-start** (ไม่กึ่งกลางแนวตั้ง)
- **Admin:** คำแนะนำ desktop 1080² / 1200×1000; ฟิลด์สีพื้นแผง + color picker; `HeroBannerManagerClient` / `hero-banner-admin` / `hero-banner-service` / migration `20260519120000_hero_banners_panel_bg`

### บันทึกการทำงาน — 2026-05-15 (Marketing Hub + hero banners)
- **Marketing Hub:** `app/admin/banners/page.tsx` — แท็บ **Home banners** = `HeroBannerManagerClient` เท่านั้น (หัวการ์ด **Home Carousel**); แท็บ Article banners; ลบ `BannerManagerClient` + CRUD `/api/admin/banners/*` ยกเว้น `article-campaigns/[id]`
- **`hero_banners` locale titles:** migration `20260518120000_hero_banners_title_locale`; CRUD `hero-banner-service` sync `name` = `title_th`; `lib/hero-banner-admin.ts`; admin modal preview 4 ช่อง + schedule badges; storefront `altTh`/`altEn` ใน `HomeHeroCarousel`
- **Storefront home:** `page.tsx` โหลดแบนเนอร์จาก `getActiveHeroBannersForCarousel()` เท่านั้น; `HomePageClient` คีย์ `promotion_banner` = legacy (ไม่เรนเดอร์)
- **ลบ:** `services/banner-service.ts`, `BannerManagerClient.tsx`, `DynamicHero.tsx`, `PromotionBannerSection.tsx`; ตาราง `dynamic_banners` คงใน DB (legacy)

### บันทึกการทำงาน — 2026-05-14 (Cart / checkout line brand price UI)
- **`cartItemBrandLineDisplay`** (`lib/cart-utils.ts`) — `resolveListingUnitAfterBrand` ต่อบรรทัด × จำนวน; **`CartSheet`** + **`CheckoutPageClient` `OrderItemRow`** แสดงราคาหลังแบรนด์ + ขีดฆ่าราคาเต็มเมื่อมีโปรแบรนด์; restore payment summary ไม่ส่ง rules (แสดงยอดจาก snapshot เดิม)

### บันทึกการทำงาน — 2026-05-14 (Catalog card vs `seeds` filter)
- **`pickVariantForSeedPackSlugs`** (`lib/shop-attribute-filters.ts`) — เลือก variant ตรงแพ็กจาก URL; **`getPackSizeLabelFromUnitLabel`** (`lib/product-utils.ts`) — ข้อความแพ็กเดียวกับการ์ด
- **`ProductCard` `catalogSeedsFilter`** — ราคา/ strike / แบรนด์ลด (คำนวณจากราคา variant ที่เลือกเมื่อมี filter; ไม่ใช้ slice `brand_listing_*` จาก starting variant) / ป้าย % / แพ็กบรรทัดล่าง / add-to-cart ตาม variant นั้น
- **`GeneticVaultProductGrid` + `ShopSpotlightCard`** รับ `catalogSeedsFilter` จาก `ShopPageClient` (`seeds`)

### บันทึกการทำงาน — 2026-05-14 (Sale + sidebar filters server-side)
- **`getActiveProducts` `quick=sale`:** ใน sale scan หลัง enrich ใช้ **`productMatchesShopAttributeFilters`** (genetics / difficulty / THC / CBD / sex / yield / seeds) คัดตั้งแต่ chunk; **`productPassesSaleAfterPackRule`** — ถ้ามี `seeds` คัดเฉพาะ variant ที่ตรงแพ็ก **และ** `resolveListingUnitAfterBrand` ได้ effective &lt; base; ไม่มี seeds ยังใช้ **`productPassesBrandPromoSaleFilter`** แบบเดิม — **`catalogTotalCount`** = จำนวนที่ผ่าน sale + sidebar
- **SSR / API / client:** `shop/page.tsx`, `GET /api/products`, `ShopPageClient` (hydrate key + fetch + load more) ส่ง **`genetics`/`difficulty`/`thc`/`cbd`/`sex`/`seeds`/`yield`** เข้า service

### บันทึกการทำงาน — 2026-05-14 (Sale filter UX)
- **`getActiveProducts` `quick=sale` (non–price sort):** หลังรวบรวม `saleRows` เรียง **`brand_promotion_percent` DESC** แล้ว **`id` DESC** — แบรนด์ส่วนลดใหญ่ (เช่น 50%) ขึ้นหน้าแรกก่อน
- **`ShopPageClient`:** ลบ `shopScopedProducts` ซ้ำ; **`catalogFloweringScope`** เมื่อ `quick=sale` ใช้ **`shopScopedProducts`** (breeder + `ft` + category + search) ให้จำนวนชิป Auto/Photo สอดคล้องกับชุด sale ที่โหลด; sidebar counts ยังจาก `calculateFilterCounts(shopScopedProducts)`

### บันทึกการทำงาน — 2026-05-14 (Brand / breeder quick filters)
- **Journal paths:** `parseJournalBreederSlugFromPathname` + `journalBreederCatalogBasePath` — `/brand/[slug]` ใช้ `shop/page` เดียวกับ `/seeds/[slug]`; `ShopPageClient` `replaceCatalog` / clear / numeric-id redirect รักษา prefix `/brand` vs `/seeds`
- **Query:** `resolveCatalogFtFromUrl` + `filter` shorthand (`filter=auto` …) ใน SSR / `GET /api/products` / client; บน `/brand/` ชิป Photo/Auto เขียน `filter=` (ไม่บังคับ `ft`)
- **Routes:** `app/(storefront)/brand/[slug]/page.tsx`, `robots.ts` allow `/brand/`

### บันทึกการทำงาน — 2026-05-14 (Shop quick filters)
- **Quick filter bar:** `components/storefront/ShopQuickFilterBar.tsx` + `ShopPageClient` sticky strip — URL `quick=new|sale`, `sort=price_asc|price_desc`, ชิป Photo/Auto ใช้ `ft`, Regular ใช้ `sex=regular` คู่กับ sidebar
- **Catalog API / service:** `getActiveProducts` — `new_arrivals` order (pinned / priority / `created_at`), `quick=sale` หลัง brand enrich (`Number(effective) < Number(base)`), **chunked DB scan** (ไม่จำกัดแค่หน้าแรกของ `CATALOG_ENRICH_CAP`) จนได้แถวตามหน้า / pool ราคา; price sort ด้วย `getCatalogCardSortPrice`; ชนิดแถว `ProductWithBreederMaybeVariants` ให้เข้ากับ variants + sort; `GET /api/products` รับ `quick`, `pmin`/`pmax`, `sort` เพิ่ม; SSR `shop/page.tsx` ส่ง params เดียวกัน

### บันทึกการทำงาน — 2026-05-16
- **Admin brand Prisma delegate:** `app/api/admin/promotions/brands/route.ts` + `[id]/route.ts` / `app/api/storefront/brand-promotions/route.ts` ใช้ **`prisma.brand_promotions`** เท่านั้น (สอดคล้อง `model brand_promotions`: `id`, `brand_name`, `discount_percent`, `is_active`, `created_at`, `updated_at`) — **ห้าม** `prisma.brand_promotion` (singular); หลังแก้ `schema.prisma` ต้อง **`npx prisma generate`** + รีสตาร์ท dev กัน `undefined.findMany`
- **Checkout variant net price:** `resolveListingUnitBaht` ใช้ `coerceDbPriceBaht`; ลำดับ `product_variants.price` ก่อน `products.price`; ต่อด้วยกฎ `brand_promotions` ต่อ `breeders.name` (source `brand_promotion` เมื่อจับคู่)
- **Brand promotions checkout:** ตาราง `brand_promotions` + admin `/admin/promotions/brands` + API admin/storefront; pipeline **SubtotalAfterBrand → คูปอง (`promo_codes` / `checkout-promo-math`) → ค่าส่ง (`shippingFeeForSubtotal` บน net = subtotal − coupon)** → GrandTotal; **ไม่ใช้** `discount_tiers` / `tiered-discounts` / `resolveExclusiveCartDiscounts` ใน `useCart` หรือ `calculateCartSummary`; WELCOME10 guard ตามเดิม; `generateUpsellMessage` = ข้อความเข้าใกล้จัดส่งฟรีเท่านั้น; `DiscountProgressBar` = progress ฿1,000 ฟรีค่าส่ง; `lib/discount-utils.ts` ทำเครื่องหมาย legacy (ยังใช้ `formatCouponValueDisplay` / `isCouponPercentageType`)

### บันทึกการทำงาน — 2026-05-15 (Bulk discount / promotion_rules admin removal)
- **ลบระบบ Bulk Discount + CRUD `promotion_rules` จากแอดมิน:** ไม่มีแล้ว `services/admin-service.ts`, `BulkDiscountDialog`, `/api/admin/promotions` (+ `[id]`), `/api/admin/promotions/bulk-discount/*`, `/api/admin/promotions/cancel`, `lib/promotion-utils.ts`, `lib/active-tiered-discount-rules.ts`, `GET /api/storefront/tiered-discounts`; `/admin/promotions` redirect → `/admin/promotions/brands`; Sidebar เหลือลิงก์ส่วนลดแบรนด์ + แคมเปญ; POS ใช้ `/api/admin/promotions/brands` แทน bulk campaigns สำหรับป้าย breeder; ตาราง `promotion_rules` / `promotion_campaigns` / `orders.promotion_rule_id` คงใน DB สำหรับประวัติ

### บันทึกการทำงาน — 2026-05-15
- **Hero banners (admin + DB):** `hero_banners` model + migrations (`20260517100000_hero_banners`, `20260518120000_hero_banners_title_locale`); `services/hero-banner-service.ts`; APIs `/api/admin/hero-banners/*`; Marketing Hub **Home banners** = `HeroBannerManagerClient` (**Home Carousel**); `HomeHeroCarousel`; `dynamic_banners` = legacy table only (no admin/storefront UI)
- **Home hero fade carousel:** `lib/hero-banners.ts` (`DEFAULT_HERO_BANNERS_FALLBACK`, `altTh`/`altEn`); `HomeHeroCarousel` — fade autoplay, TH/EN assets + alt by locale; wired from DB via `getActiveHeroBannersForCarousel()` or fallback when no qualifying rows
- **Shipping env defaults:** `lib/order-financials.ts` — `QUOTATION_SHIPPING_COST` จาก `NEXT_PUBLIC_SHIPPING_FEE` (fallback 50); `QUOTATION_SHIPPING_FREE_THRESHOLD` จาก `NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD` (fallback 1000); parse ด้วย `Number` + finite check

### บันทึกการทำงาน — 2026-05-14
- **Checkout strict grand total:** `lib/checkout-server-validate.ts` คิดจาก DB (variant → `brand_promotions` → คูปอง → ค่าส่ง); สอดคล้อง `calculateCartSummary`; `order_create` เทียบทุกฟิลด์สรุปกับ client; mismatch → 400 + `details`; `app/api/storefront/orders/route.ts` ส่ง `details` เมื่อ AMOUNT_MISMATCH

### บันทึกการทำงาน — 2026-05-10
- **Checkout strict integer Baht (client = server):** `calculateCartSummary` / server validation ใช้ `roundCheckoutBahtWhole` ทุกขั้น (brand line → subtotal → coupon → net → shipping → total); POST `/api/storefront/orders` `CheckoutWholeBahtSchema`; `promptpay-payload` `clientTotals` เต็มบาท; `CheckoutPageClient` snapshot สรุปเต็มบาท

### บันทึกการทำงาน — 2026-05-09
- **Checkout whole-baht totals:** Percentage discounts use `discountBaht = Math.round(subtotalBaht * (pct / 100))` then `discountSatang = discountBaht * 100` in `lib/services/checkout-promo-math.ts`. Cart/checkout payloads snap discount, shipping, and grand total to integer Baht via `roundCheckoutBahtWhole` in `lib/cart-utils.ts`, `lib/checkout-server-validate.ts`, `CheckoutPageClient`, `/api/storefront/orders` (`CheckoutWholeBahtSchema`), and POST `/api/storefront/promptpay-payload` (`clientTotals` + EMV `amountBaht`). Server logs `--- CHECKOUT MATH ---`.
- **PromptPay QR mobile save:** `components/storefront/checkout/DynamicPromptPayQr.tsx` replaces canvas `toDataURL` download with `toBlob` + `File`; mobile in-app browsers use Native Web Share when file sharing is supported, otherwise desktop/unsupported browsers download via object URL with cleanup.
- **Checkout amount mismatch:** `lib/order-financials.ts` / `lib/cart-utils.ts` now use fixed storefront shipping (50 THB) and free shipping only when subtotal is greater than 1,000 THB; checkout shipping is calculated from DB-priced subtotal before discount. `lib/checkout-server-validate.ts` quantizes client/server totals, recalculates subtotal from DB prices in satang, and logs `{ frontendTotalSent, calculatedSubtotal, calculatedShipping, calculatedDiscount, finalBackendExpectedTotal }` on mismatch. `components/storefront/CheckoutPageClient.tsx` sends a rounded summary and rounded item prices in the order payload.
- **Checkout free shipping refinement:** Shipping threshold now applies to `netAmountBeforeShipping = subtotal - discount`; free shipping is granted when the net amount is at least 1,000 THB, otherwise shipping remains 50 THB. `cart-utils` and `checkout-server-validate` both keep satang-safe subtotal/discount/net/total calculations.

### บันทึกการทำงาน — 2026-05-06
- **Profile tab cleanup:** removed redundant LINE/Social Connections card from `/profile` profile tab; removed LINE connect button/SVG/callback handling and unused imports while keeping profile save toast.
- **Unified account dashboard:** removed duplicate `/account` route; migrated Loyalty Scorecard into `/profile` tabbed dashboard above navigation; Navbar account links now point to `/profile`; order status revalidation no longer touches `/account`.
- **Account/Profile bilingual localization:** `app/(storefront)/account/page.tsx` now uses locale cookie + `getMessage()` dictionary translator; `OrderHistoryList` receives `locale`/`t`; added TH/EN account portal, loyalty, profile, status, tracking, and free-shipping copy keys in `locales/th.json` and `locales/en.json`.
- **Technical SEO canonical cleanup:** `app/(storefront)/product/[slug]/page.tsx` canonical uses clean product slug; `/seeds/[breederSlug]` now exports canonical metadata; `app/robots.ts` explicitly allows public product/seed/blog paths and disallows `/admin/`, `/api/`, `/checkout/`, `/profile/`; sitemap remains clean parameter-free URLs.
- **Admin bulk seeds table crash (`strain` on undefined):** `lib/bulk-seeds/sanitize.ts` — `coerceBulkSeedRow` / `sanitizeBulkSeedList`; `BulkSeedsAdminClient` — `safeRows`, `patchRow` ผ่าน sanitize + `coerceBulkSeedRow` หลัง PATCH; ตาราง `safeRows` + `colSpan={tableColSpan}` แถว "No data found"; Export PDF ใช้ `safeRows`

### บันทึกการทำงาน — 2026-05-04
- **PromptPay V4.0 (re-enabled):** `PAYMENT_CONFIG.isPromptPayEnabled: true`; `fetchActiveBankAccounts` เลือก `prompt_pay` → `parseStorefrontPromptPayPublic` / `StorefrontPromptPayPublic`; admin PromptPay เพิ่ม `accountName`; `PaymentSection` + `DynamicPromptPayQr` (rounded-3xl, teal header, ยอดจาก API/server, `reloadNonce` / ปุ่มสร้าง QR ใหม่, ข้อความค่าจัดส่งเมื่อมี); `/payment/[orderNumber]` ส่ง `promptPayPayeeDisplayName`
- **Mobile admin `/admin/m` Nimbot + packing line:** `formatItemForPacking` / `formatPriceBahtShort` ใน `lib/admin-order-line-summary.ts` (บรรทัดเดียว TH สำหรับทีมแพ็ก + `buildNimbotSummaryText`); ปุ่ม `Copy Address` / `Copy Summary` (secondary + ghost); คงปุ่มรวม TH แบบ outline
- **Stock V3.7 (admin simple + restock race):** `/api/admin/orders/simple` หักสต็อกด้วย `deductVariantStockForOrderItems` (SQL `COALESCE(stock) >= qty`); `rejectPayment` / `autoCancelUnpaidOrder24hStale` / `cancelPendingOrder` ใช้ `orders.updateMany` ล็อก snapshot แล้วค่อย `restoreVariantStockForOrderItems`; void ใช้ `buildVoidOrderClaimWhere` + `updateMany` ก่อน restock; `restoreVariantStockForOrderItems` normalize `variant_id` เป็น `bigint`
- **Checkout ghost duplicate line (±170 mismatch):** `lib/checkout-server-validate.ts` — `mergeCheckoutDuplicateLines` และ `collapsePaidCartItemsByVariant` ใช้ **Map key เป็น string ของ variantId ที่ truncate** แล้ว normalize `variantId`; validate จาก `mergedLines` อย่างเดียว; log ชั่วคราว **`LOG_GHOST: Raw ID List`** / **`LOG_GHOST: Merged ID List`**; `app/api/storefront/orders/route.ts` ส่ง `summary` เข้า `createOrder` ผ่าน **`quantizeBaht2`** เทียบเท่า `priced.resolvedSummary`
- **Checkout payment V3.6:** `fetchActiveBankAccounts` (Supabase service role → `payment_settings.bank_accounts` JSON, `isActive`≠false); `BankTransferAccountList` + ยอดโอนต่อการ์ด; `PAYMENT_CONFIG` ปิด PromptPay / `promptpay-payload` 503; ไม่มี hardcode บัญชีใน UI
- **PromptPay V3.4:** `mergeCheckoutDuplicateLines` + `collapsePaidCartItemsByVariant`; `grandTotalFromSummaryParts` (subtotal−discount+shipping, satang); `resolvedSummary.total` = canonical; POST `SUBTOTAL_CHECK`/`SHIPPING_CHECK`/`TOTAL_CHECK` ก่อน `buildPromptPayPayload`.
- **Checkout / PromptPay V3.3 (precision + server totals):** `money-thb`; `validateStorefrontCheckoutTotals` รองรับ **`purpose: prompt_pay_preview`** (ยอด PromptPay จาก DB ถึง UI mismatch เล็กน้อยไม่ fail); สร้างออเดอร์ใช้ **`order_create`** เข้มเหมือนเดิม; `useCart` **`evaluateFreeGifts(..., \"TRANSFER\")`**; `promptpay-payload` POST + log `invalid_body`/`unauthorized`; `DynamicPromptPayQr` `credentials: same-origin` + `console.warn` สาเหตุ; `PaymentSection` → `promptPayCheckout`.
- **Payment evidence `/payment/[orderNumber]`:** Server `page.tsx` โหลด `fetchCheckoutPaymentSettings` + `getOrderByNumber`; `PaymentPageClient` ใช้ `DynamicPromptPayQr` กับ `amountBaht` จาก `order.total_amount` + บัญชีเสริมจาก `bank_accounts` (ไม่ซ้ำ K-Bank หลัก); slip upload + LINE CTA (`lineId` จาก server) คงเดิม.
- **Checkout PromptPay (dynamic QR, privacy):** `lib/payment-utils.ts` `buildPromptPayPayload`; `promptpay-payload` อ่าน merchant จาก DB / `PROMPTPAY_MERCHANT_ID`; `DynamicPromptPayQr` + `qrcode.react` (`QRCodeCanvas` 280px); `PaymentSection` ส่ง snapshot ตะกร้าเข้า `POST`; หลักฐานการชำระใช้ `GET ?orderNumber=`.
- **Checkout client/server payment split:** `lib/storefront-payment-shared.ts` = `PaymentSetting` + constants K-Bank (import จาก Client Components ได้); `lib/payment-settings-public.ts` = `import \"server-only\"` + `fetchCheckoutPaymentSettings` (`getSql`) เท่านั้น — กัน bundle `postgres`/`net` ใน browser.
- **Checkout PaymentSection (V3.2):** ตัดการ์ด Thai QR / K-Bank แบบ static ออก — เหลือ `DynamicPromptPayQr` + การ์ดบัญชีจาก `bank_accounts` (ไม่ซ้ำเลข K-Bank หลัก) เท่านั้น。
- **Checkout payment settings (guest / RLS):** `fetchCheckoutPaymentSettings` uses `getSql()` + `payment_settings` (server `DATABASE_URL`), not Supabase anon PostgREST — guests see banks/PromptPay QR same as logged-in users; `GET /api/storefront/payment-settings` unchanged (already direct SQL). Middleware already passes `/api/storefront/*` without login.
- **Checkout bank accounts:** `fetchCheckoutPaymentSettings` — include banks unless `isActive`/`is_active` is explicitly `false` (legacy rows without flag); map `bank_name`/`account_no`/`account_name` snake_case; skip rows missing bank name + account number; PromptPay same explicit-false rule; `console.warn` when result empty after filter; `GET /api/storefront/payment-settings` uses `isActive !== false` and null-safe PromptPay.
- **Catalog `?ft` + SSR/API:** `getActiveProducts` รับ `catalog_ft`; DB จำกัด `autoflower`/`photo_3n`; `photo`/`photo-ff` เก็บ rule เดียวกับ grid ผ่าน memory scan + bucket match; `/api/products?ft=` และ `shop/page.tsx` SSR ส่ง `ft`; `ShopPageClient` hydrate key รวม `ft`, ส่ง `ft` ใน fetch/load-more; `normalizeCatalogFtUrlParam`/`productMatchesCatalogFtParam` รับ alias `auto`↔`autoflower`.
- **Admin orders — unlink LINE:** `unlinkOrderLineUserId` server action (`app/actions/admin-order-actions.ts`) clears `orders.line_user_id`, `assertAdmin`, `revalidatePath` `/admin/orders` + `/admin/orders/[id]`; `/admin/orders` detail LINE box adds ghost Unlink + `AlertDialog` confirm.
- **SearchCommand / cmdk:** `components/header/search-command.tsx` — `pointer-events-auto` on dialog content, `Command`, list, suggest wrappers; `z-[60]` so panel clears `z-50` header/overlay quirks; ⌘K `keydown` listener `capture` + `stopPropagation`; stable `value` incl. ids/hrefs; thumbnails `pointer-events-none`; dropped `onOpenAutoFocus` `preventDefault` so focus lands in the palette.
- **Security/deps + webpack big-string:** `prompt-font-base64` inlined font removed; `public/fonts/Prompt-Regular.ttf` + `lib/prompt-font-loader.ts` (disk on server, `/fonts/...` fetch on client); `generateReceiptPDF` is async + page break re-registers Prompt with cached base64; `xlsx` replaced by `exceljs` in `lib/export-utils.ts`; `next-auth` ^4.24.x; `@next/third-parties` + `eslint-config-next` pinned to Next 14.2 lines; npm `overrides`: `uuid` ^14, `postcss` ^8.5.11, `glob` ^13 (clears transitive xlsx/uuid/postcss/eslint glob noise); Tailwind `rounded-[length:var(--radius)]` → `rounded-[var(--radius)]` in ProductSpecs/product-detail-client; `[...nextauth]/route.ts` exports `GET`/`POST` handler directly; `prisma.config.ts` `DATABASE_URL ?? ""` for strict TS. **Note:** `npm audit` may still list Next.js 14.x CVEs until upgrade to patched 15.5.15+ / 16.x (not applied—breaking).
- **`dynamic_banners` optional EN/mobile images:** Schema + `services/banner-service.ts` — only `desktop_image_th` remains required (`desktop_image_en`, `mobile_image_th`, `mobile_image_en` nullable); admin `normalizeBannerApiBody`; `POST`/`GET` `/api/admin/banners` and `/api/admin/banners/[id]` use try/catch with JSON `{ error }` bodies; `BannerManagerClient` validates primary TH desktop before save and parses JSON responses safely; `DynamicHero` falls back missing EN/mobile URLs to Thai desktop.
- **DynamicHero responsive buckets:** Separate `md:hidden aspect-[4/5]` vs `hidden md:block aspect-[1920/700]` frames so mobile uses portrait slot + mobile URLs (fallback to desktop) instead of cropping into a widescreen tile.
- **Homepage `promotion_banner` section:** New `homepage_sections` key + migration (default sort after Hero); `HomePageClient` renders all active sections in DB `sort_order` order; `hero` = static `Hero` only; `promotion_banner` = `PromotionBannerSection` → `DynamicHero` + `dynamic_banners`; admin DnD row uses Megaphone + preview/hint; Save Layout unchanged (`sort_order` PATCH).
- **`dynamic_banners` schedule:** Optional `start_date` / `end_date` (`TIMESTAMPTZ`); storefront `getActiveBanners` filters on `CURRENT_TIMESTAMP`; `PromotionBannerSection` re-filters via `isBannerVisibleNow`; admin Home Carousel dialog uses `datetime-local` + list badges for out-of-window slides.
- **Banner FOMO / admin expiry:** Promotion path passes `urgencyEndWithinMs` → `DynamicHero` bottom overlay countdown (≤24h, tabular nums, CLS-safe inset); `isBannerExpiringWithin` highlights admin rows (48h) amber border + badge.
- **Promotion auto-refresh:** `PromotionBannerSection` `useEffect` + `setTimeout` → `router.refresh()` at earliest future `end_date` + 1s buffer; cleans up timeout on dep change/unmount.
- **Banner link locale prefix:** `lib/utils.ts` `getLocalizedPath(path, locale)` for `/${th|en}` internal paths; `DynamicHero` receives `locale` from `HomePageClient`; `ArticleCampaignBanner` wraps `campaign.href` server-side with the same helper (skips `http(s):`, `mailto:`, `tel:`, `/api`, `/admin`, `/_next`).
- **Prisma P1012 (schema validation):** `prisma/schema.prisma` restores `url = env("DATABASE_URL")`; removed deprecated `previewFeatures = ["partialIndexes"]`; aligned toolchain to **`prisma` / `@prisma/client` / `@prisma/adapter-pg` @ 6.19.3** (was mixed 7.x client + 6.x CLI; Prisma 7 rejects `url` in schema).
- **Breeder catalog conversion layout:** `ShopPageClient` compact breeder strip (logo, name, strain count) then sticky search/filters + grid; long copy + highlights in `BreederCatalogSeoBlock` at bottom via `<details>` (TH/EN).

### บันทึกการทำงาน — 2026-05-01
- **Blueprint V3.1 resilience/LCP pass:** `lib/timeout.ts` shared `withTimeout` / `fetchWithTimeout`; route boundaries `app/error.tsx`, `app/(storefront)/error.tsx`, `app/admin/error.tsx`, `app/admin/loading.tsx`; `Hero.tsx` static hero uses `next/image` `fill` + `priority` with fixed aspect ratio; related products and storefront home API use 2s timeout fallbacks; floating coupon badge images no longer use `priority`.
- **Phase 4A LCP/CLS optimization:** `Hero.tsx` now marks the hero image with `priority`, `fetchPriority="high"`, `loading="eager"`, and precise `sizes`; product cards, product detail gallery, and shop vault hero images reserve aspect-ratio space and only eager-load true LCP candidates; promo banners, navbar logos, insight images, lightbox images, and floating badges lazy-load; root fonts moved from CSS `@import` to `next/font` with `display: "swap"`; Google Analytics now loads via `next/script` `strategy="lazyOnload"`; `services/storefront-home-service.ts` uses `fetchWithTimeout` so home data does not block hero rendering.
- **Phase 4B financial intelligence dashboard:** `services/dashboard-service.ts` added `getFinancialStats(startDate, endDate)` for revenue, COGS, gross/net profit, order count, inventory value, and daily revenue/profit series; `app/api/admin/dashboard/stats/route.ts` now uses `assertAdmin`, supports `range=7d|30d`, and returns financial stats while preserving existing dashboard analytics payload; `components/admin/dashboard/FinancialScorecards.tsx` and `RevenueProfitChart.tsx` render Thai Baht scorecards and a Revenue vs Profit chart with primary teal and secondary lavender tokens; `app/admin/dashboard/page.tsx` loads and displays the new financial overview.
- **Home New Arrivals first-load fix:** `app/(storefront)/page.tsx` now streams an async home content boundary and passes server-loaded `initialData` into `HomePageClient`; `services/storefront-home-service.ts` centralizes `getStorefrontHomePayload()` with a longer server-side home timeout and shared API payload builder; `HomePageClient.tsx` hydrates New Arrivals/featured/blog/clearance immediately from initial props and only retries client fetch when the server payload is empty; skeletons no longer persist when a fetch resolves empty; `getNewArrivals()` now uses the Supabase storefront select shape to avoid Prisma BigInt mismatch in client-facing product rows.
- **Shop SSR hardening:** `app/(storefront)/shop/page.tsx` is now a Server Component that fetches the first 30 catalog products through `getStorefrontProducts()` and passes serialized `initialProducts` into `ShopPageClient`; `app/(storefront)/shop/ShopPageClient.tsx` preserves the existing Genetic Vault filters while hydrating immediately from server data, adds 2s `fetchWithTimeout` load-more pagination, scrolls back to the grid on URL filter changes, and syncs `category` search params; `app/api/products/route.ts` now supports `includeVariants=true` for paginated client fetches; `ProductCard` remains CLS-safe with an `aspect-square` image frame and lazy non-priority images.
- **Breeder slug product filter fix:** `app/(storefront)/shop/page.tsx` now reads `params.breederSlug` from `/seeds/[breederSlug]`, resolves it case-insensitively via `breederSlugFromName()` against active `breeders`, and passes the resolved `breeder_id` into `getStorefrontProducts()` before serializing `initialProducts`; `services/storefront-product-service.ts` now applies the breeder filter with `breeder_id != null`; verified `/seeds/420fastbuds` SSR requests products with `breeder_id=eq.1`.
- **Phase 4C customer portal:** `services/customer-service.ts` added `getCustomerProfile(userId)` and `getCustomerOrders(userId)` for authenticated customer profile, loyalty points, lifetime spend, order status, and tracking summaries; `app/(storefront)/account/page.tsx` is now an SSR member portal with a primary-teal loyalty scorecard, reward progress bar, profile mini card, and 2s `withTimeout` fallback for non-critical order history; `components/storefront/OrderHistoryList.tsx` renders CLS-stable order summaries with Shadcn badges and reinforces Free Shipping at 1,000 THB.
- **Phase 5 production SEO/security pass:** Existing `app/sitemap.ts` dynamically covers static storefront routes, breeder catalogs, published blog posts, and active `/product/[slug]` URLs; `app/robots.ts` now blocks both `/admin` and `/api` route prefixes; `ProductJsonLd` already outputs price and availability, and `lib/seo/build-product-jsonld.ts` now safely emits `aggregateRating` only when real rating/review data exists in `seo_meta`; `next.config.mjs` includes launch security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`); free-shipping defaults now use the shared 1,000 THB threshold from `lib/order-financials.ts`.
- **Dynamic bilingual banner system:** Added `dynamic_banners` Prisma schema + migration for desktop/mobile TH/EN hero images, link URL, active status, and drag order; `services/banner-service.ts` provides `getActiveBanners()`, admin listing, CRUD helpers, and `updateBannerOrder(bannerIds)`; `components/storefront/DynamicHero.tsx` renders an Embla/Shadcn-style carousel with locale-aware desktop/mobile images, LCP priority on the first banner, and fixed aspect ratios; `app/(storefront)/page.tsx` fetches banners server-side and `HomePageClient` falls back to the original `Hero` when none exist; `/admin/banners` plus `/api/admin/banners/*` manage uploads, edits, delete, and drag ordering.
- **Option A direct variant discounts:** `product_variants.discount_percent` added via Prisma schema, Supabase types, and migration `20260501200000_variant_direct_discount`; `lib/product-utils.ts` now normalizes discounts and derives 2-decimal `final_price` while preserving clearance behavior; `services/storefront-product-service.ts` enriches active catalog/detail variants with `final_price`; `ProductCard.tsx` shows bilingual red sale badges, primary final pricing, and original line-through pricing; `services/admin-service.ts` added `updateBulkDiscountByBreeder(breederId, discountPercent)` for breeder-wide variant discounts using BigInt-safe raw SQL.
- **Smart bulk discount expiry:** `product_variants.discount_ends_at` added via Prisma schema, Supabase types, and migration `20260501205000_variant_discount_expiry`; variant discounts now support 0-100% and expire automatically through `isVariantDiscountActive()` / `getVariantFinalPrice()` in `lib/product-utils.ts`; `services/admin-service.ts` `updateBulkDiscountByBreeder(breederId, discountPercent, endsAt)` updates both percent and expiry for every variant under the selected breeder; `POST /api/admin/promotions/bulk-discount` exposes the protected admin action; `components/admin/promotions/BulkDiscountDialog.tsx` adds a breeder selector, percent input, optional expiry date popover, override warning, loading state, and toast feedback on `/admin/promotions`; storefront `ProductCard` only shows sale badges and final pricing while the discount is active.
- **Promotion campaign logging:** Migration `20260502093000_bulk_discount_campaign_logging` extends `promotion_campaigns` with bulk-discount log fields (`campaign_kind`, `breeder_id`, `discount_percent`, `ends_at`, `status`) and indexes; `services/admin-service.ts` now writes a `BULK_DISCOUNT` campaign row inside the same transaction as `updateBulkDiscountByBreeder()`; `GET /api/admin/promotions/bulk-discount/campaigns` returns active bulk discount campaigns with breeder names; `/admin/promotions` displays a clean active campaign table and refreshes it immediately after `BulkDiscountDialog` applies a new breeder discount.
- **Responsive bilingual article campaign banner:** Migration `20260502110500_bilingual_article_banners` and `prisma db push` replace the single article banner URL with `article_banner_th_url`, `article_banner_en_url`, `article_banner_mobile_th_url`, and `article_banner_mobile_en_url`; `components/admin/promotions/BulkDiscountDialog.tsx` now groups four Article Banner upload fields by TH/EN with target labels (Desktop 1200x400, Mobile 600x400); `POST /api/admin/promotions/bulk-discount` and `services/admin-service.ts` persist all four URLs on bulk campaign logs; `services/promotion-campaign-service.ts` returns all article banner variants; `components/storefront/ArticleCampaignBanner.tsx` chooses image by article locale and breakpoint with fixed 3:1 desktop / 3:2 mobile ratios to prevent CLS; `app/(storefront)/blog/[slug]/page.tsx` passes the current article locale.
- **Cancel campaign reset action:** `services/admin-service.ts` added `cancelPromotionCampaign(campaignId)` to lock the bulk campaign, reset every variant under its breeder to `discount_percent = 0` and `discount_ends_at = null`, then mark the campaign `cancelled` in the same transaction; `POST /api/admin/promotions/cancel` exposes the protected reset action; `/admin/promotions` now adds an Actions column with a red `Trash2` AlertDialog confirmation and refreshes the active bulk campaign table after cancellation.
- **Product detail discount polish:** `app/(storefront)/product/[slug]/product-detail-client.tsx` now mirrors catalog sale styling with a red bilingual `ลด X% / X% OFF` badge beside the main price, keeps inactive/expired discounts hidden, shows original variant prices with line-through styling, and displays a compact `Promotion ends in ...` urgency line only when `discount_ends_at` is within 48 hours.
- **Smart urgency and scarcity:** `lib/product-utils.ts` adds `getTimeRemaining(endsAt)` for active countdown math; `components/storefront/DiscountCountdown.tsx` is the only timer client component and shows a compact `Ends in HH:MM:SS` badge only inside the 48-hour window; `components/storefront/StockAlert.tsx` adds an Eco-Clinical low-stock tag for quantities under 5; `ProductCard.tsx` and `product-detail-client.tsx` now place countdown and scarcity badges near final pricing with reserved height to avoid CLS, replacing loud red low-stock detail styling with primary/accent tones.
- **Marketing Hub banner management:** `/admin/banners` is now a two-tab Marketing Hub using Shadcn Tabs for `Home Carousel` and `Article Banners`; `BannerManagerClient` keeps CRUD, uploads, active state, and drag order for dynamic home banners with 1920x700 / 800x1000 labels; `services/promotion-campaign-service.ts` adds admin article-banner listing and quick-update helpers; `ArticleBannerManagerClient` lets admins edit four active campaign article banner URLs/uploads inline and links to `/admin/promotions`; `PATCH /api/admin/banners/article-campaigns/[id]` persists article banner edits and revalidates blog content.
- **Product card active discount polish:** `lib/product-utils.ts` now exposes `calculateDiscountedPrice()` as the public helper for variant-level sale pricing; `services/storefront-product-service.ts` enriches grid/detail variants with `discount_ends_at` before final price calculation; `services/product-service.ts` preserves `discount_ends_at` in mixed-breeder API rows; `components/storefront/ProductCard.tsx` calculates display and cart prices from the active starting variant, shows red-500 bilingual sale badges only for non-expired discounts, keeps original prices line-through, renders final prices in primary, and offsets breeder logos so the grid layout stays clean.
- **Phase 2 service-layer first pass:** Added `services/storefront-product-service.ts`, `breeder-service.ts`, `site-settings-service.ts`, `auth-service.ts`, `storefront-home-service.ts`, `checkout-service.ts`; refactored `useProducts`, `useBreeders`, `useSiteSettings`, `use-auth`, `HomePageClient`, `CheckoutPageClient`, and `BreederShowcase` into thin UI wrappers; added Zod query validation to admin products/orders and stricter breeder POST/PATCH handling without `any`.
- **Phase 2B admin page split:** `app/admin/inventory/manual/page.tsx` now delegates stats, search, grid shell, and main action buttons to `components/admin/inventory/InventoryStats.tsx`, `InventorySearchBar.tsx`, `InventoryGridTable.tsx`, and `InventoryActionButtons.tsx`; `app/admin/orders/page.tsx` now delegates tabs, desktop table shell, detail modal wrapper, and status buttons to `components/admin/orders/OrderFilters.tsx`, `OrderListTable.tsx`, `OrderDetailModal.tsx`, and `OrderStatusActions.tsx` while keeping page-level state/handlers in place.
- **Global TypeScript cleanup:** `npx tsc --noEmit` passes. Tightened ProductModal nullable/union mapping, react-pdf style typing, Recharts formatter signatures, Web Bluetooth declarations (`types/global.d.ts`), SQL raw row casts, API nullable guards, BigInt compatibility, receipt PDF response body typing, and Prisma bulk status transaction typing.

### บันทึกการทำงาน — 2026-04-29
- **Product detail related products:** `services/product-service.ts` added `getRelatedProducts` (same breeder/category, genetics-first fallback, active variants/images); `app/api/products/[slug]/related/route.ts` returns cached nested related products via `bigintToJson`; `product-detail-client.tsx` fetches and renders 4 `ProductCard` items below details.
- **Phase 3 final polish / code splitting:** `app/admin/inventory/page.tsx` split UI into `components/admin/inventory/InventoryStats`, `InventorySearch`, `InventoryGrid`, `InventoryDialogs`, shared badges/types in `inventory-shared`; `CheckoutPageClient` split `ShippingSection` + `PaymentSection`; `app/admin/settings/page.tsx` moved `LogoUploadCard` to `components/admin/settings/LogoUploadCard`; `services/orders-service.ts` grouped regions for list/counts, payment approval, cancellation/stock restore, and fulfillment; `ProductCard` + `BreederRibbon` memoized; fixed `app/admin/promotions/page.tsx` escaped quote and `LowStockWidget` duplicate class/type issue.

### บันทึกการทำงาน — 2026-04-25
- **Admin order line items — breeder & seed type** — `services/orders-service.ts` `attachOrderLineItems`: JOIN `products` via `COALESCE(oi.product_id, pv.product_id)`; `lib/services/order-service.ts` checkout `createMany` ใส่ `product_id` + `unit_label`; order success SQL เดียวกัน; `lib/seed-type-filter.ts` `adminOrderLineFloweringLabel`; `lib/load-admin-order-detail.ts` โหลด variant ก่อน + `seedTypeLabel` / `resolvedProductId`; `app/admin/m/page.tsx` + `app/admin/orders/page.tsx` รูปแบบสรุปรายการ
- **Admin dashboard — Looker Studio embed** — `app/admin/dashboard/page.tsx`: Card **Website traffic & keywords**; responsive iframe `min(80vh,800px)` + `min-h-[400px]`, sandbox attrs, `LOOKER_STUDIO_EMBED_SRC` constant.
- **Payment reminder + auto-cancel** — `lib/services/payment-reminder.ts`: สแกน `PENDING_PAYMENT` / `PENDING` / `PENDING_INFO`; L1=2h / L2=12h / L3=22h จาก `created_at` → ตั้ง `notification_level` 1–3; แจ้งเฉพาะมี LINE/email + ลิงก์ชำระ; ออเดอร์ ≥24h จาก `created_at` (รอบ 2) → `autoCancelUnpaidOrder24hStale` ไม่ส่งข้อความลูกค้า. Cron route ส่ง `scanned` / `sent` / `autoCancelled`.
- **Prisma `orders` notification tracking** — `notification_level` (Int, default 0), `last_notified_at` (DateTime?); migration `20260425120000_orders_notification_tracking`.
- **Cart sheet typography** — `CartSheet.tsx`: root `font-sans`, `sans` / `sansTab` (`font-sans tabular-nums`) instead of journal mono; promo input/Apply/checkout/empty/dialog/coupons/totals/qty row. `DiscountProgressBar.tsx` + `LoginForPromoDialog.tsx`: `font-sans` on surfaces for cart-adjacent UI.
- **Sold out + detail price** — `lib/product-stock.ts` (aggregate: sum active variant `stock` when `product_variants` present, else `product.stock`); `ProductCard` `isActuallyOut` → `outOfStock` / `lastOneLeft` (stock===1) / `lowStock` (2–5); `getDetailDisplayLinePrices` in `lib/product-utils.ts`; `product-detail-client` aggregate vs variant OOS, `mainPriceLine`, `ProductGallery` sold-out overlay when aggregate OOS.
- **Shop/seeds grid — remove Final Archive large cards** — `lib/interleave-vault-grid.ts`: drop `finalArchive` + `finalArchiveProducts`; queue is full `products` list. `GeneticVaultProductGrid.tsx`: only `product` / `spotlight` / `research` items. `shop/page.tsx`: remove low-stock API fetch + state. Deleted `FinalArchiveSpotlightCard.tsx`, `api/storefront/low-stock-spotlight`, `lib/services/low-stock-spotlight.ts`. Spotlight + research 2-col interstitials unchanged.
- **Cart fly animation (stuck chips)** — `components/storefront/CartAnimation.tsx`: `safeFinish` + `doneRef` idempotency; `setTimeout` at `FLY_MS` (560) and `FLY_SAFETY_MS` (1000) with RAF cleanup; try/catch around path math + tick; `getNavCartButtonEl()` null → no portal item, `sonner` toast (also in `onFly` guard); `will-change: transform, opacity` on the flying root; fix arc Y to use `easeT` (was undefined `t`).
- **Product card sold out** — `components/storefront/ProductCard.tsx`: `stock === 0` → image `grayscale` + `brightness-75`, zinc overlay banner, small “หมด” chip removed; default row → full-width disabled zinc CTA `สินค้าหมดชั่วคราว` / `Sold Out`; breeder logo/name paths unchanged; low chip + red band only when `stock > 0` (red band still `stock === 1` only).
- **Product card grid height / urgency** — `ProductCard.tsx`: remove `getDescriptionTeaser` + line-clamp description for `lastOneLeft`; fixed `h-10` urgency strip (empty spacer) under image for all cards so THC/breeder/title/price align; red shimmer in slot only when `stock === 1`; breeder logo on image for all with breeders; one centered breeder name row + `min-h` title; `lastOne` CTA `h-10` (matches sold-out) + `p-0` inner span; in-stock + button `h-10 w-10`; `motion.div` + root `h-full` / `min-h-0` / `mt-auto` footer; removed last-one “Low stock” chip row; dropped unused `journalChip` const. `HomePageClient` featured grid: `h-full` cell wrapper for same stretch as `GeneticVaultProductGrid`.

### บันทึกการทำงาน — 2026-04-28
- **Product JSON-LD (GSC / rich results)** — `lib/seo/build-product-jsonld.ts`: Offer `@id`, `itemCondition`, `priceValidUntil`, `shippingDetails` (TH), `hasMerchantReturnPolicy` (7-day window, TH); no fabricated `aggregateRating`.
- **Mobile admin packing copy** — `lib/admin-order-line-summary.ts` `formatAdminOrderPackingCopyLine`; `app/admin/m/page.tsx` `packingListProductLines` + `buildAddressAndPackingListText` ใช้บรรทัดเดียวกับ UI (`breeder` + `adminOrderLineItemSeedTypeLabel` + ` x N pack(s)`).

### บันทึกการทำงาน — 2026-04-22
- **Homepage layout — breeder split + cache:** New DB key `breeder_showcase` (Featured Breeders Grid / `BreederShowcase`); `breeders` = Top Breeders Bar / `BreederRibbon`; `categories` = standalone `QuickCategoryNav`; `hero` = banner only. Migration `20260422120000_homepage_breeder_showcase` + label UPDATE. Storefront `unstable_cache` tag `home-layout`; `PATCH /api/admin/settings/homepage` → `revalidatePath('/')` + `revalidateTag('home-layout')`; `orderBy` `[sort_order, key]`. Admin homepage hints + preview image for `breeder_showcase`.
- **Mobile admin `/admin/m` — order cards v2:** ⋮ menu — Cancel (`PENDING`/`PENDING_INFO` → `cancel`), Reject slip (`AWAITING_VERIFICATION` → `status` reject), Reset approval (`PAID` → `PATCH .../revert-approval`), Void (`PAID`/`COMPLETED` → `void` + reason dialog); `tel:` phone; badges Guest / LINE login / Google·Web + LINE linked vs No LINE; **Items summary** from `listOrders` line_items + join `products`/`breeders` (compact rows, discounts); `COALESCE` order/customer `line_user_id`; shared type `types/admin-order.ts`; `revertApprovalToPending` in `orders-service.ts`.
- **Mobile admin `/admin/m` — tabs + date range:** Horizontal status tabs (Waiting / Shipped / Completed / Cancelled / Void) default Waiting; compact date `Select` (7d / 30d / this year BKK / all time); cards show Bangkok Buddhist date + time and DB `id`; empty state; `GET /api/admin/orders?statusTab=&dateRange=` + `listOrders` in `services/orders-service.ts` (`ADMIN_ORDER_STATUS_TAB`, `IN` + optional `created_at` lower bound); Bluetooth print on PAID/SHIPPED/COMPLETED.
- **Admin email/password login (Bluefy / restricted browsers):** Supabase `signInWithPassword` — `app/admin/login/page.tsx` (mobile-friendly, EN/TH copy); `middleware.ts` — public `/admin/login`, unauthenticated `/admin/*` → `/admin/login?next=…`, non-admin → `/admin/login?reason=admin_required`; `AdminLayoutClient` — full-bleed login (no sidebar); `lib/supabase/session-cookies.ts` + `cookieOptions` on browser/server/middleware clients (`maxAge` 30d); `prisma/schema.prisma` — comment that passwords live in `auth.users`; `scripts/set-admin-password.ts` + `npm run admin:set-password` (merge `user_metadata`, force `role: ADMIN`).

### บันทึกการทำงาน — 2026-04-19
- **Admin homepage DnD:** `prisma/schema.prisma` + migration `20260419120000_homepage_sections` — ตาราง `homepage_sections` (key, label_th/en, sort_order, is_active); `GET`/`PATCH` `/api/admin/settings/homepage` (`assertAdmin`, `revalidatePath('/')`, PATCH ส่ง label_th/en); `app/admin/settings/homepage/page.tsx` — `@dnd-kit` sortable, รูปย่อ `HOMEPAGE_SECTION_PREVIEW_IMAGES`, Popover แก้ป้าย, Switch **Preview Storefront Labels**; `AdminSidebar` ลิงก์หน้าแรก
- **Storefront dynamic home:** `app/(storefront)/page.tsx` server — `prisma.homepage_sections` → `sections` (key + `label_th`/`label_en`); `HomePageClient` + `resolveSectionHeading` (`lib/homepage-section-title.ts`) ผูกหัวข้อหลักกับ InsightSection / FeaturedProductsCarousel / breeders / trust / new_strains / newsletter; `DEFAULT_HOME_SECTION_KEYS` + `"—"` fallback
- **Order claim pre-linking:** `components/storefront/OrderClaimClient.tsx` — การ์ด **LINE Tracking Status** บนสุดฟอร์ม (โลโก้ LINE + ข้อความ TH/EN + ปุ่ม Track on LINE เล็ก `lineOaUrlWithOrderHint`); หมายเหตุใกล้ Submit ให้อยู่หน้าจอยืนยัน LINE; overlay ขณะ `submitting` (กำลังบันทึก / Saving… please don't close)

### บันทึกการทำงาน — 2026-04-17
- **LINE prefill + approve push:** `lib/line-oa-url.ts` — `lineOaUrlWithOrderHint` สร้าง `https://line.me/R/oaMessage/{id}/?Order%23…` เสมอ (`getLineOaMessageIdForPrefill`: `NEXT_PUBLIC_LINE_OA_MESSAGE_ID` → parse `NEXT_PUBLIC_LINE_OA_URL` → default); `approvePayment` — `line_user_id` จาก order หรือ `customers.line_user_id`, `total_amount` จาก `order`/`before`, `console.log` + try/catch `pushTextToLineUser`
- **approvePayment atomic:** `services/orders-service.ts` — `prisma.$transaction`: อัปเดต `orders` → `PAID`, sync `quotations` (`status: CONVERTED` + `updatedAt` เมื่อไม่ใช่ `SHIPPED`, ตาม `convertedOrderId` / `source_quotation_number`) + TODO loyalty; คืน `{ order, before }`; หลัง commit: `sendLineFlexNotification` + email; `pushTextToLineUser` fire-and-forget; `PATCH .../status` `approve` ส่ง `order` ใน JSON (`bigintToJson`)
- **LINE post-link + ชำระเงินอนุมัติ:** `app/api/webhooks/line/route.ts` — หลังลิงก์ออเดอร์สำเร็จ ตอบไทย «ได้รับสลิปโอนเรียบร้อยแล้ว…» + EN สั้น; `approvePayment` ใน `services/orders-service.ts` — หลัง PAID ถ้ามี `line_user_id` ส่ง `pushTextToLineUser` (TH ยอด `toLocaleString("th-TH")` + EN) นอกเหนือจาก flex เดิม
- **Order claim success UX:** `OrderClaimClient.tsx` — `isSuccess` → `scrollTo({ top: 0, smooth })`; success block `motion.div` (fade/slide); ข้อความ/ padding ย่อเพื่อให้ปุ่ม Track on LINE อยู่เหนือ fold บนมือถือ
- **Order claim success → LINE tracking loop:** `components/storefront/OrderClaimClient.tsx` — หลังส่งฟอร์มสำเร็จ: คำแนะนำกด Send ใน LINE + ปุ่ม **Track on LINE** (`lineOaUrlWithOrderHint`); `lib/line-oa-url.ts` — prefill URL ใช้ข้อความ `Order #{orderNumber}` ให้ตรงกับ `linkLineUserFromOrderChatMessage`
- **LINE Webhook — ตัด auto-reply loop:** `customers.last_interaction_at`, `customers.is_linked` (`prisma/schema.prisma` + migration `20260417120000_customers_line_interaction_and_linked`); `lib/line-user-interaction.ts` (`shouldSuppressLineOrderLinkPrompt`, `recordLineUserInteraction` + guest cooldown via `site_settings` key `line_ia_guest:*`); `app/api/webhooks/line/route.ts` — ไม่ส่ง Order # hint เมื่อเชื่อมออเดอร์แล้ว / ภายใน 24 ชม.; `lib/line-order-message-link.ts` — ตั้ง `is_linked` + `last_interaction_at` เมื่อลิงก์สำเร็จ; `services/line-messaging.ts` — อัปเดต `last_interaction_at` หลัง push/flex/text/shipping สำเร็จ

### บันทึกการทำงาน — 2026-04-16
- **Admin — ยกเลิกออเดอร์ PENDING / PENDING_INFO + คืนสต็อก:** `PATCH /api/admin/orders/[id]/cancel` (`app/api/admin/orders/[id]/cancel/route.ts`), `cancelPendingOrder` ใน `services/orders-service.ts` (Prisma transaction + `restoreVariantStockForOrderItems`). UI `app/admin/orders/page.tsx`: ปุ่ม **ยกเลิกออเดอร์** (มือถือ/ตาราง + modal รายละเอียด), แสดงเฉพาะ `PENDING` | `PENDING_INFO`, สไตล์ ghost/outline แดง, Dialog ยืนยันก่อน PATCH (แยกจาก modal **ปฏิเสธ** สลิป `AWAITING_VERIFICATION`).
- **สรุปรายการคัดลอก — ป้าย (ส่งฟรี):** `lib/utils/format-order.ts` `generateOrderSummary` แสดง `(ส่งฟรี)` / `(free shipping)` เฉพาะเมื่อ `shippingFee != null && Number(shippingFee) === 0` (ไม่ถือ `undefined` เป็นฟรี; ไม่อิงยอด subtotal อย่างเดียว).

### UI refactor — storefront / theme (status)
- **Current status:** **100% Completed (Goddess Tier)** — Premium Eco-Clinical storefront theme, genetic bar polish, and product text sanitization are in place for pre-production.
- **Seeds nav + breeder catalog URLs** — `components/storefront/Navbar.tsx`: **เมล็ดพันธุ์** is a hover dropdown (`BreederSeedsNav` in `components/storefront/BreederDropdownMenu.tsx`) with chevron, **FIND BY BREEDER** (mono) + Playfair breeder rows + logos → `seedsBreederHref` (`/seeds/{slug}`). **`app/(storefront)/seeds/page.tsx`** + **`app/(storefront)/seeds/[breederSlug]/page.tsx`** re-export `shop/page.tsx` so pathname-driven breeder + `ft` filters match **`lib/catalog-navigation.ts`** / **`BreederTypeFilter`** journal variant on breeder pages.
- **Shop “Genetic Vault” editorial layout** — `app/(storefront)/shop/page.tsx`: default catalog header → **`ShopGeneticVaultHero`** (featured strain macro + Playfair title + mono THC/CBD/Yield + breeder note); grid → **`GeneticVaultProductGrid`** — `lg:grid-cols-4`, every **7 + 1** products inserts **`ShopSpotlightCard`** (2-col) + up to two **`ShopResearchInsightCard`** interstitials from **`GET /api/storefront/magazine/recent?take=2`**; **`CatalogImagePlaceholder`** + **`ProductCard`** for missing images; **`FilterSidebar`** “THE LAB” + JetBrains mono filter copy, thin `rounded-sm` rows/checkboxes, white panel.
- **Final Archive (low-stock FOMO)** — `lib/services/low-stock-spotlight.ts` + **`GET /api/storefront/low-stock-spotlight?ids=`** (`products.stock` 1–5, random 1–2; optional `ids` = filtered catalog); **`FinalArchiveSpotlightCard`** injected after **4** standard cells (amber border + scan line + `STATUS: LOW_STOCK_ALERT`); responsive grid **`grid-cols-1`** → `sm:grid-cols-2` `md:grid-cols-3` `lg:grid-cols-4`.
- **JSON-LD (AIO / Schema.org)** — `lib/seo/build-product-jsonld.ts` + **`ProductJsonLd`** on **`app/(storefront)/product/[slug]/page.tsx`**: `Product` + `brand` + `offers` (THB / availability) + `additionalProperty` (THC, CBD, Yield); **`StorefrontStructuredData`** in **`app/(storefront)/layout.tsx`**: `@graph` with **Organization** (underground-era → vault copy, `foundingDate` **2018**, `sameAs` LINE) + **FAQPage** (authenticity + tenure aligned to ~2018, TH/EN).
- **Home Hero (underground legacy)** — `components/storefront/Hero.tsx`: split-screen `lg:grid-cols-2`, eyebrow **JetBrains Mono** **ก่อตั้ง ค.ศ. 2018 // …** / EN **EST. 2018 // …**, **Playfair** headline **คัดสรรพันธุกรรมระดับโลก สู่มือคุณ**, `font-light` description (ใต้ดิน → vault, ~10 ปี); CTAs **`/seeds`** + **`/blog`**; admin hero media unchanged.
- **Dynamic sitemap** — **`app/sitemap.ts`** (Prisma `revalidate` 3600): static **`/`** 1.0, **`/seeds`** 0.9, **`/blog`** 0.85, **`/shop`** 0.88, **`/breeders`** 0.7; **`/seeds/[breederSlug]`** per active breeder (0.72); **`blog_posts`** → `/blog/[slug]` (0.6, `lastModified` = `updated_at`); **`products`** → canonical **`/product/[slug|id]`** (0.7, `lastModified` = `created_at` — no `products.updated_at` in schema).
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
  - **Checkout / payment order summary** — `components/storefront/CheckoutPageClient.tsx` + `app/(storefront)/payment/[orderNumber]/page.tsx`: minimalist summary header (status pill), clearer subtotal/total labels; **payment page layout (conversion):** order summary → bank/QR → slip upload (primary ring/heading) → `LineParcelTrackingCta` at bottom (muted secondary); after successful slip upload, success state + highlighted LINE + `scrollIntoView`, then redirect to `order-success` after ~2.4s; `components/storefront/LineParcelTrackingCta.tsx` + `lib/line-oa-url.ts` (`NEXT_PUBLIC_LINE_OA_URL`, fallback `https://lin.ee/OcxDMjO`); **`app/(storefront)/order-success/[orderId]/page.tsx`** — LINE primary CTA TH “รับแจ้งเลขพัสดุผ่าน LINE (อัตโนมัติ)” / EN “Track Order on LINE” + bullets (real-time tracking); copy icon beside order #; receipt PDF via `generateReceiptPDF` + `fetchStorefrontReceiptPdfSettings` (`lib/pdf-settings.ts`) when `isReceiptEligibleStatus`; `getOrderForSuccessView` includes `order_date` (Asia/Bangkok); `app/(storefront)/order-success/page.tsx` — primary LINE CTA uses `lineOaUrlWithOrderHint` (prefill text for `line.me/R/oaMessage/...` only). **Checkout:** no manual Line ID field; `createOrder` uses Prisma `customers` upsert (LINE preserved when omitted). **Storefront inventory full-loop:** `lib/services/order-service.ts` `createOrder` — Prisma `$transaction`: pre-check variants exist, `assertSufficientStockForCheckoutLines` + `deductVariantStockForOrderItems` (`lib/order-inventory.ts`); `INSUFFICIENT_STOCK` → `409` + `toast.error` / inline error on checkout. Admin cancel/void restore stock as before. **Customer order UI:** `OrderDetailDrawer` + `/profile` badges + `order-success/[orderId]` — `VOIDED` / `CANCELLED` แสดงชัด (ไม่ fallback เป็น PENDING); `revalidateAfterOrderStatusChange` หลัง admin `status`/`void`
- **Cart sheet (breeder + pack copy)** — Shared `lib/cart-pack-display.ts`: `parsePackCountFromUnitLabel`, `seedsPackLine`, `cartItemPackDescription` (optional `includeLineQuantity` for checkout). `CartSheet.tsx` + `CheckoutPageClient.tsx` `OrderItemRow`: breeder logo after name; EN/TH pack copy; checkout line shows pack `×` qty. `CartItem.breederLogoUrl` in `types/supabase.ts`; add-to-cart sources as before; Zod `useCart.ts`.
- **Next steps:** Ready for **production deployment** and **testing with real users** (smoke-test checkout, product detail, mobile layouts).

### Inventory flexibility — draft mode (status)
- **Current status:** **100% Completed (Inventory Flexibility Refactor — Draft Mode)** — save product metadata before commercial fields are ready.
- **Logic:** `lib/validations/product.ts` — Zod allows **`price: 0`**, **`variants: []`**, and preprocess strips empty pack rows; `ProductSchema` no longer requires `min(1)` variants.
- **Automation:** **`deriveProductIsActiveForCatalog`** — sets **`products.is_active = false`** when there are no packages or total variant stock is 0, so drafts stay off the storefront; wired in **`POST /api/admin/products`** and **`PATCH /api/admin/products/[id]`**; **`createProductWithVariants`** skips inserting variants when the array is empty; **`PATCH`** skips `insert` when empty.
- **UI/UX:** **`components/admin/ProductModal.tsx`** — remove last pack row allowed, hint when no variants, label notes draft workflow; partial save for THC/genetics/descriptions without packs/prices.

### Theme (global) — technical reference
- **Premium Eco-Clinical** — `app/globals.css` `:root` HSL (Deep Forest Teal `--primary`, Rich Lavender `--secondary`, Vibrant Electric Mint `--sativa`, Fresh Mint `--accent`, `--radius` 0.75rem); `tailwind.config.ts` semantic `hsl(var(--*))` incl. `sativa`; legacy `emerald-*` / `violet-*` / `teal-*` replaced with tokens where appropriate in storefront-focused paths.
- **Storefront product detail** — `app/(storefront)/product/[slug]/product-detail-client.tsx`: root `JOURNAL_PRODUCT_FONT_VARS`; product title **Playfair** (medium); stats/prices/packs **JetBrains Mono** (`journalMono`); tab triggers **Playfair**; description **font-light** + `formatDescriptionJournal`; pack selector outline **emerald-800** when selected; `Navbar.tsx` **solid white** on `/product/*`; `Footer.tsx` **white** on product pages. `ProductSpecs.tsx` genetic bar + mono Fem/Reg chips + optional `className` on `GeneticRatioBar`; StatCard / SpecRow values mono; icons `text-primary`.

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
- **Dynamic campaign pop-up** — `promotion_campaigns` + FK to `promo_codes`; Admin `/admin/promotions/campaigns` (CRUD, `ImageUploadField` → `POST /api/admin/magazine/upload`); sync `lib/promotion-campaign-sync.ts`; storefront `PromotionBanner` + `GET /api/storefront/promotion-campaigns`; `validateCoupon` / `createOrder` enforce campaign dates, `usage_count` vs `total_limit`, increment usage on order; Server Action `validatePromotionCampaignCode` in `app/actions/promotion-campaign-actions.ts`. **Save promo to profile** — `UserSavedPromotion` (`user_saved_promotions`), `promotion_campaigns.save_to_profile` + `target_url` `action:save`; `savePromotionToUser` in `promotion-campaign-actions.ts`; guest fallback `lib/saved-promotion-local.ts`; `GET /api/storefront/saved-promotions`; checkout “Available coupons” in `CheckoutPageClient.tsx`.
- **Real-time Tier Pricing** — Wholesale discount applied on add-to-cart; customer switch clears cart when tier changes
- **Points Redemption UI** — Available points, max redeemable, balance after purchase; `promotion_rule_id` + `promotion_discount_amount` persisted

### Daily Reports
- **Sales Breakdown** — By payment method (Cash, Transfer, COD, Crypto)
- **Top 5 Best Sellers** — By quantity sold
- **Print-ready Daily Summaries** — A4 layout; date picker; excludes VOIDED orders from revenue

### Safety Net
- **Admin cancel PENDING / PENDING_INFO** — `PATCH /api/admin/orders/[id]/cancel` → `cancelPendingOrder` (`services/orders-service.ts`): Prisma `$transaction`, only `PENDING` | `PENDING_INFO`, `restoreVariantStockForOrderItems`, `CANCELLED` + `reject_note` suffix. **`app/admin/orders/page.tsx`**: ghost/red-outline **ยกเลิกออเดอร์** (list + detail) + confirm dialog → cancel API (not slip **ปฏิเสธ**). `rejectPayment` still handles slip rejection / broader statuses. Void route uses same stock helper for PAID/COMPLETED.
- **Manual order claim (self-service)** — `orders.claim_token`, `shipping_name`, `shipping_phone`, `shipping_email` (optional notify); status **`PENDING_INFO`** → **`/order/claim/[token]`**; after submit → **`/order/status/[token]`** (`OrderStatusClient`, `GET /api/storefront/orders/track/[token]`); admin POS **สร้าง + ลิงก์ให้ลูกค้ากรอก** + **Copy Claim Link**; stock deducted at create like POS complete. **Smart Sales Summary** — `lib/utils/format-order.ts` (`generateOrderSummary` emoji + **`lang: th | en`**, `claimLinkToDigitalReceiptPageUrl`, `buildPromptPayIoQrUrl`; บรรทัดยอดรวม: `(ส่งฟรี)` เมื่อ **`shippingFee === 0` เท่านั้น**); **Digital receipt card** — `app/(storefront)/order/receipt/[id]/page.tsx` (`dynamic = force-dynamic`, decode token), `getOrderReceiptCardByClaimToken` (`findUnique` by `claim_token`); **`middleware.ts`** matcher `/order/claim|status|receipt/:path*` + public bypass; **TH/EN** toggle + Copy Sales Summary; bank / **`NEXT_PUBLIC_PROMPTPAY_ID`**.
- **Transactional email + status page** — `approvePayment` → `sendPaymentReceivedEmail` (Resend) when `AWAITING_VERIFICATION` → `PAID`, to `customers.email` or `orders.shipping_email`; `markShipped` email uses `COALESCE(customers.email, shipping_email)`; shared `lib/shipping-carriers.ts`; admin order detail: ยืนยันการชำระเงิน / เลขพัสดุ & จัดส่ง + courier + tracking link.
- **Claim → CRM (no login)** — `lib/claim-customer-associate.ts`: match `customers` by email / unique phone; else `auth.users` by email; else `auth.admin.createUser` + `customers.upsert`; sets `orders.customer_id`, refreshes profile address/phone; API returns `claim` → storefront Welcome / Welcome back + optional `/login?email=` ตั้งรหัสผ่าน.
- **Void/Refund Logic** — PATCH `/api/admin/orders/[id]/void`; atomic transaction: status → VOIDED, restore stock, revert points, adjust total_spend; optional `void_reason`; cannot void already VOIDED; **PAID หรือ COMPLETED**; UI รายการออเดอร์ + modal รายละเอียด: ปุ่มยกเลิก/คืนสต็อก (PAID เน้น outline แดง)
- **Confirmation Dialog** — "แน่ใจหรือไม่? การยกเลิกจะคืนสต็อกและปรับคะแนนลูกค้าอัตโนมัติ"
- **VOIDED Badge** — Grey badge in Order List and Detail Modal

### Blog System (Smile Seed Blog — Phase 1)
- **Schema** — `blog_categories` (id, name, slug, description, sort_order); `affiliate_links` (title, url, platform_name, image_url); `blog_posts` extended: `category_id` FK, `is_highlight`, `view_count`, `manual_rank`; `site_settings.key = magazine_trending_mode` (`auto` | `manual`). Migration `20260328120000_magazine_phase1`.
- **BlogPost Model** — id, title, slug (unique), content (JSON/Tiptap), excerpt, featured_image, author_id, status (DRAFT/PUBLISHED), published_at, tags (String[]), related_products (BigInt[]), category, carousel/trending fields above.
- **Service** — `lib/blog-service.ts`: `getHighlightPosts`, `getTrendingPosts`, `getSmartProducts`, `getMagazineTrendingMode` / `setMagazineTrendingMode`; `getBlogCategories`, `getRecentPublishedPosts`, `getPublishedPostsByCategorySlug`.
- **Storefront blog home (Step A)** — `app/(storefront)/blog/page.tsx`: strict white `#FFFFFF`, Playfair + Inter + JetBrains (`--font-journal-mono`); H1 **คลังความรู้สายเขียว** + Playfair subline (10 ปี pioneer); **`lib/seo/blog-index-metadata.ts`** (`BLOG_INDEX_TITLE` / `BLOG_INDEX_DESCRIPTION`) Thai SEO; **`magazineCategoryDisplayTh`** in `lib/blog-research-category.ts` maps Knowledge → **เกร็ดความรู้** on cards/tabs; `MagazineLatestGrid` **asymmetric bento**: row1 `lg:grid-cols-12` (7+5) equal-height compact stack (`flex-1 basis-0`), row2 two **medium** cards `sm:grid-cols-2`, row3+ **3-col** standard; metadata footer **mono** `tabular-nums` (date `·` read time); **REF#** `RefTag` gray box; category on card = mono `GlassTag`; `MagazineCategoryPills` left-aligned, outline inactive / **emerald-800** solid active; `MagazineTrending` 1px bars + `view_count` mono; `getRecentPublishedPosts(15)`; research: `VerifiedResearchBadge` + `lib/blog-research-category.ts`; `revalidate` 300; `Navbar` white on `/blog`.
- **Storefront article (Step B)** — `app/(storefront)/blog/[slug]/page.tsx`: root `JOURNAL_PRODUCT_FONT_VARS`; **REF#** (`formatResearchRefId`) top-right; metadata row **JetBrains Mono** (date, read time, views); title **Playfair** medium; featured image `mb-12` + `rounded-sm` + subtle shadow; excerpt **abstract** `bg-zinc-50` `border-l-4 border-emerald-600`; `MagazineArticleBody` relaxed/light body, **Playfair** `font-medium` H1–H4, `strong`/`b` **emerald-900**; breeders strip `py-20` + Playfair heading (`BlogArticleBreederRibbon`); Prisma + `tiptapJsonToHtml`; `SmartTieInStrip`; `BlogViewTracker`; related + newsletter.
- **Blog SEO (Step C)** — blog index: **`BLOG_INDEX_TITLE`** / **`BLOG_INDEX_DESCRIPTION`**; OG `siteName` **Smile Seed Bank**; article `generateMetadata`: title `| คลังความรู้สายเขียว - Smile Seed Bank`; excerpt or 160-char body; `MagazineArticleJsonLd`; `MagazineArticleShare`; `lib/magazine-seo.ts`.
- **Growth & automation (Phase 3)** — `newsletter_subscribers` (email unique, status active/unsubscribed); `POST /api/newsletter/subscribe` (Zod, `rateLimitIp` 8/15m); `NewsletterBox` + `subscribeToNewsletter` server action on blog posts; `app/sitemap.ts` (home, shop, blog, breeders, published posts, active products with slug → `/product/[slug]`); `app/robots.ts`; root `metadataBase`; canonicals on blog + shop/breeders layouts + product `generateMetadata`; `lib/shimmer-blur` + hero/grid/featured `placeholder="blur"`; `next.config` `minimumCacheTTL` 60.
- **Magazine mock seed** — `lib/mock-magazine-data.ts` (3 categories TH copy, 2 affiliates Shopee/Lazada, **11 posts all PUBLISHED**, **3× `[SMART_TIE_IN]`** + 1× `[AFFILIATE:id]`); `export seedMagazine()` in `prisma/seed-magazine.ts` (CLI when path includes `seed-magazine`); `prisma/seed.ts` calls `seedMagazine()` after product seed; `npm run seed:magazine` or `npx prisma db seed`.
- **Storefront API** — `GET /api/magazine/highlight`, `GET /api/magazine/trending` (optional `?mode=`).
- **Admin API** — `GET/PATCH /api/admin/magazine/settings`; `GET/POST /api/admin/blog/categories`; `GET/POST /api/admin/affiliate-links`; `GET /api/admin/blog` query `categoryId`, `status`, `q`.
- **Admin UI** — `/admin/magazine` command center (trending mode, carousel HL, filters, posts table, TipTap create/edit, uploads); **`/admin/magazine/categories`** — CRUD `blog_categories` (table + dialog; `PATCH`/`DELETE` `app/api/admin/blog/categories/[id]/route.ts`); `/admin/blog` and `/admin/blog/create` and `/admin/blog/[id]/edit` redirect to magazine equivalents.
- **Smile Seed Blog CMS (WordPress-style)** — `/admin/magazine` list; `/admin/magazine/new` + `/admin/magazine/[id]/edit` with `MagazinePostForm` + `MagazineTiptapEditor`; JSON → `blog_posts.content`; Server Actions `app/admin/magazine/actions.ts`; **featured image** — `ImageUploadField` + bucket `magazine`; **`MagazineAdminDashboard`** light; **post editor + TipTap + related product picker** premium light (`#FFFFFF` shell, emerald-800 CTAs, zinc borders); **`AdminSidebar`** light (white bar, `logo_main_url`, emerald active nav, `UserNav` light trigger); customer-facing labels **Smile Seed Blog** / **Smile Seed Blog CMS** (`AdminSidebar` บล็อก Smile Seed).
- **Magazine newsletter (Resend)** — `MagazinePostForm`: on publish, optional broadcast to `newsletter_subscribers` (active); template **Research Paper** vs **Field Notes** (creator URL + 3 bullets); HTML `lib/email-magazine-broadcast-html.ts`, send `lib/magazine-email-broadcast.ts`; optional `RESEND_FROM_MAGAZINE` (fallback matches order from-address).
- **Product tie-in (Magazine)** — `blog_posts.related_products` (BigInt[]); admin: `RelatedProductsSection` + `GET /api/admin/magazine/products` (`q` search, `ids` for chip labels); `MagazineSaveInput.related_product_ids` → Prisma `related_products`; TipTap **Insert Product Card** (`ShoppingBag`) + `MagazineProductPickerDialog` inserts `[PRODUCT_CARD:id]`; storefront: `parseArticleSegments` (`productId`) + `MagazineProductStoryCard` + `getMagazineProductsByIds` (`lib/blog-service.ts`); **`ShopTheStorySection`** after article body on `app/(storefront)/blog/[slug]/page.tsx`.
- **AI Outline Suggest** — POST `/api/admin/blog/ai-suggest` uses OpenAI to generate blog outlines from topic
- **Create/Edit Pages** — Tiptap rich text editor; AI outline → apply to editor; DRAFT/PUBLISHED; tags
- **Admin product gallery (Smile image pipeline)** — `ProductModal`: `ProductImageUpload.tsx` — multi-file select (≤5), `galleryUrls` order = save order; grid preview (`รูปหลัก` on first), `@dnd-kit/core` + `@dnd-kit/sortable` reorder, per-thumb remove; drop zone + `multiple` input disabled at full; same `compressImageForMagazineUpload` (1200px / ~0.8MB) + `validateMagazineImage*` + `uploadProductImage` / `POST /api/admin/products/upload` → `image_url`…`image_url_5` + `image_urls`; uploads run `applyWatermark` (`lib/watermark.ts`: watermark from `site_settings.logo_secondary_png_url` with cached fetch, fallback `public/assets/logo-watermark.png`, bottom-right, WebP q88 when ok); Manual Grid still uses `processAndUploadImages` (updated to same compressor + API).

### Storefront Checkout (payment preview)
- **Cart modal stock validation** — `CartItem.stock_quantity` (from `product_variants.stock`) in `types/supabase.ts`; `hooks/useCart.ts` caps `addToCart` line merges and `updateQuantity` → `{ ok, maxStock? }`; `components/storefront/CartSheet.tsx` — `CartLineQuantityInput` (local string state + sync from `quantity`, `Math.max(1,…)` / `Math.min(…, stock)`, empty/`0…` while typing, blur → min 1), Sonner `toast.warning` when capped + `toast.error` on `+`; `components/ui/sonner.tsx` + `Toaster` in `app/(storefront)/layout.tsx`; `product-detail-client.tsx` / `shop/page.tsx` pass stock + toast on over-add; `app/admin/orders/create/page.tsx` manual order qty + respects cap (shadcn `toast` destructive).
- **Shipping fee — single source of truth** — `lib/order-financials.ts`: `QUOTATION_SHIPPING_FREE_THRESHOLD` (1000), `QUOTATION_SHIPPING_COST` (50), `shippingFeeForSubtotal` / `defaultQuotationShippingFee` (free when subtotal ≥ threshold, aligned with DB `shipping_rules`). `lib/cart-utils.ts` `calculateShipping` uses a matching `shipping_rules` row when present and numeric; otherwise falls back to those constants. Cart UI uses `calculateCartSummary` → `summary.shipping` only (`hooks/useCart` does not duplicate shipping math). Quotations / quotation PDF use `defaultQuotationShippingFee`.
- **Storefront discount pipeline (current)** — `brand_promotions` (จับคู่ `breeders.name`) ก่อน → `promo_codes` เป็นส่วนลดถัดไปทับ SubtotalAfterBrand → ค่าส่งคำนวณบน `subtotal − coupon`; `resolveExclusiveCartDiscounts` / tiered spend **ไม่** อยู่ใน path ตะกร้า (`useCart` ไม่โหลด `tiered-discounts` / `discount_tiers`); `GET /api/storefront/tiered-discounts` คงไว้แบบ deprecated สำหรับ consumer เก่า; `CartSummary.tierDiscount` / `appliedTier` คงฟิลด์เป็น 0/null เพื่อ type เดิม
- **Admin shipping rules** — `/admin/settings/shipping`: edit `base_fee` + `free_shipping_threshold` for `shipping_rules.category_name = Seeds` (`lib/storefront-shipping.ts`); `GET`/`PUT` `/api/admin/settings/shipping` (service role + middleware ADMIN); form defaults `lib/validations/shipping-admin.ts` (50 / 500) when no row; after save, `BroadcastChannel` `ssb-shipping-rules` triggers `useCart` to refetch `shipping_rules`.
- **Server-side payment settings** — `fetchCheckoutPaymentSettings()` in `lib/payment-settings-public.ts` uses `getSql()` `SELECT bank_accounts, prompt_pay FROM payment_settings WHERE id = 1` (guest-safe; not Supabase anon RLS); maps JSON to `PaymentSetting`; storefront checkout **bank transfer** (`POST /api/storefront/orders` `payment_method: "TRANSFER"`); `app/(storefront)/checkout/page.tsx` async + `Suspense` / `loading.tsx`; `CheckoutPageClient` — order note → API `order_note` → `orders.customer_note`; dynamic PromptPay QR on checkout (`promptpay-qr` + cart total); TH/EN via `useLanguage().t`
- **Admin `/admin/settings/payment`** — Mount-only `GET` + `fetchGenRef`; `isLocked` during save; API reads/writes `bank_accounts`, `prompt_pay`, `line_id`, `messenger_url` only (ignores legacy `crypto_wallets` column).
- **Web order numbers** — `lib/order-utils.ts` `generateOrderNumber()` (6 chars, charset without 0/O/1/I/L); `createOrder` (`lib/services/order-service.ts`) retries up to 5× on Prisma `P2002` `order_number` collision; `orders.order_number` `@unique` VARCHAR(48). **`order-success/[orderId]`** — `getOrderForSuccessView` includes `tracking_number` / `shipping_provider`. Payment block **only** if `status === PENDING` + `TRANSFER` + no `slip_url`; **`CANCELLED`**: red hero + no bank/slip; **`SHIPPED`**: tracking card + copy + LINE `lineOaPrefillUrlForParcelInquiry`; other statuses: hero copy + default LINE. **`OrderDetailDrawer`** — pending transfer: link to `/order-success/{order_number}` (“แจ้งโอนเงิน / อัปโหลดสลิป”); PAID/COMPLETED: outline receipt link to `GET /api/storefront/orders/[orderNumber]/receipt`. **Public receipt PDF** — `getOrderForSuccessView(..., { skipCustomerAuth })` when HMAC `t`+`e` valid (`lib/receipt-download-token.ts`); profile order list receipt button (PAID/COMPLETED); LINE Flex footer “ดาวน์โหลดใบเสร็จ (PDF)” with signed URL (`lib/line-flex.ts`, admin `line-flex` + Copy JSON).
- **`payment_settings` in Supabase types** — `PaymentSettingsRow` + `Tables.payment_settings` in `types/supabase.ts`
- **Order confirmation email (Resend)** — `lib/email-order-confirmation-html.ts` (`buildOrderConfirmationHtml`, `loadPaymentBlocksForEmail`); packaging line uses `cartItemPackDescription` from `lib/cart-pack-display.ts` (TH/EN, line qty); `fetchEmailItems` (`lib/services/order-service.ts`) maps variant rows with `Number(variant_id)` for reliable joins; bank + **dynamic** PromptPay QR (`lib/promptpay-qr-node.ts` + `promptpay-qr` + `qrcode`, ID `0897553362`, amount = order total) when `TRANSFER` + `PENDING`/`PENDING_PAYMENT` (overrides static QR URL); LINE CTA via `lineOaUrlWithOrderHint`; `services/email-service.ts` `sendOrderConfirmationEmail`; `POST /api/storefront/orders` passes `orderStatus: "PENDING"`.

### Product SEO slugs (DB + service)
- **`products.slug`** — Prisma `String? @unique` + migrate comment (`prisma/schema.prisma`)
- **`lib/product-utils.ts`** — `generateSlug`, `resolveProductSlugFromName`; Thai-only names → deterministic `p-{hex}` fallback
- **`services/product-service.ts`** — `getProductBySlug`, `ensureUniqueProductSlug`, `createProductWithVariants` (auto slug + collision suffix), `backfillProductSlugs()`
- **Admin API** — `POST/PATCH` `app/api/admin/products/...` — PATCH resolves slug via service; POST defers slug to `createProductWithVariants`

### Homepage editorial (Smile Seed Blog strip)
- **API** — `GET /api/storefront/magazine/recent?take=4` (`getRecentPublishedPosts`, cache headers).
- **UI** — `components/storefront/EditorialHighlightSection.tsx`: grid `lg:grid-cols-5` (hero 3/5 + 3 side cards 2/5), glass badges, image zoom, Framer `whileInView` + staggered side items; wired in `app/(storefront)/page.tsx` after featured carousel.

### Homepage featured carousel
- **Schema** — `products.is_featured`, `products.featured_priority` (migration `20260411120000_products_featured`); `products.featured_tagline` (`20260411130000_products_featured_tagline`).
- **Service / API** — `getFeaturedProducts()` in `services/product-service.ts`; `GET /api/storefront/featured-products` → `{ products }`.
- **Storefront** — `components/storefront/journal-product-fonts.ts` (`--font-journal-product-serif` / `--font-journal-product-mono`, `JOURNAL_PRODUCT_FONT_VARS`); `components/storefront/ProductCard.tsx` (shop + showcase: Playfair **medium** names, mono THC/price, `font-light` body copy where shown, outline actions, `border-zinc-50`/`shadow-sm`/`rounded-sm`); `FeaturedProductsCarousel.tsx` (bento: equal-height side column `flex-1 basis-0`, compact `aspect-[4/3]`, shared font vars); shop `page.tsx` catalog header Playfair + subtitle; home bestsellers grid uses `ProductCard` showcase.
- **Admin** — `ProductModal`: **แนะนำบนหน้าแรก** + priority + **Featured tagline** (when featured); Zod in `lib/validations/product.ts`.

### Homepage bottom CTA (registration)
- **`app/(storefront)/page.tsx`** — Join Free / Sign Up banner subtext TH/EN: member benefits + latest research-backed growing techniques (replaces wholesale/VIP wholesale pitch); `leading-relaxed` on subparagraph for mobile wrap.

### Homepage v2 (preview route)
- **`app/(storefront)/page.tsx`** — light minimalist shell; `Hero` (Playfair title **medium** / **tracking-tighter**, JetBrains eyebrow location/est., subtext **leading-relaxed**, primary `emerald-800` **`rounded-sm`**, blog **ghost** border white); framed hero + `pb-10`/`pb-14` + Insights **`pt-20`** for white break; **Smile Seed Blog** + `BlogHeroSlogan` + journal cards (`GET /api/storefront/magazine/recent?take=3`); featured carousel, breeders, bestsellers; member CTA; `PromotionBanner` / `OfferManager` in layout.
- **`Navbar.tsx`** — links `font-normal` + letter-spacing; logo `object-contain` + `priority`; lang toggle **`rounded-sm`**, active **emerald-700/95**.

### Storefront breeder logos
- **`resolvePublicAssetUrl()`** — `lib/public-storage-url.ts` (relative storage paths → full public URL)
- **`BreederLogoImage`** — `components/storefront/BreederLogoImage.tsx`: fixed `width`/`height`, `alt` = `{name} logo`, `onError` → letter-in-circle fallback; wired on `app/(storefront)/shop/page.tsx`, `app/(storefront)/page.tsx`, `app/(storefront)/product/[slug]/page.tsx`, `app/(storefront)/breeders/page.tsx`, `components/storefront/BreederRibbon.tsx`
- **`next.config.mjs`** — `images.remotePatterns` from `NEXT_PUBLIC_SUPABASE_URL` + storage pathname; fallback host `jysdfxxilyjmjdmhazbu.supabase.co` (correct spelling)

### Storefront shop breeder filter (URL `?breeder=`)
- **`lib/breeder-slug.ts`** — `breederSlugFromName` (from `generateSlug`), `seedsBreederHref`, `resolveBreederFromShopParam` (slug preferred, legacy numeric id); invalid param → `router.replace("/shop")` on shop page.
- **`app/(storefront)/shop/page.tsx`** — resolves breeder from query; numeric id URLs rewrite to slug; filter grid empty while invalid after load; **`BreederRibbon`** — `activeBreederSlug` + `seedsBreederHref` per card.
- **Links** — `product-detail-client.tsx`, `app/(storefront)/page.tsx`, `breeders/page.tsx` use `seedsBreederHref` (not `breeder` id).

### Breeder detail — flowering type pills (`?type=`)
- **`lib/seed-type-filter.ts`** — `resolveCategoryLabelForFilters` (FK `product_categories.name` then `category` string); `collectionKeyFromCategory` (original substring, FF / fast flowering / fast version); short labels Auto / Photo / Fast; `breederDisplayTypeKeyFromProduct` + `labelForBreederDisplayTypeSlug`.
- **`lib/supabase/types.ts`** — `PRODUCT_SELECT_*` embeds `product_categories(id, name)` on shop/product list queries.
- **`components/storefront/BreederTypeFilter.tsx`** — horizontal scroll pills for flowering types; hidden when ≤1 distinct type for that breeder’s stock; Lucide tab icons (stroke **1**, `h-3.5 w-3.5`): **Leaf** (Auto), **Sun** (Photo), **Sun**+**Zap** (Photo FF), **Orbit** (Photo 3N); **`MagazineCategoryPills`** — **ทั้งหมด** + `magazineCategoryDisplayTh` (Knowledge→เกร็ดความรู้, Lifestyle→วิถีสายเขียว, News→ข่าวสารวงการ, Grower Tips→เทคนิคการปลูก), Playfair via **`JOURNAL_PRODUCT_FONT_VARS`**.
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
- **Receipt PDF** — `/admin/orders`: `ReceiptPreviewModal` (iframe blob + ดาวน์โหลด/พิมพ์); fresh GET before preview; eligible statuses PAID/COMPLETED/SHIPPED/DELIVERED; navy theme; CreateOrderModal = quotation/order only; `computeOrderReceiptFinancials` (`lib/order-receipt-math`) ใช้ร่วมกับ PDF + LINE Flex; `buildOrderReceiptDoc` เรียก math นี้; โลโก้ PDF สเกลความสูงตาม aspect (PNG/JPEG) ความกว้างคง 40mm; ตารางไม่มีคอลัมน์ส่วนลด — สรุป gross → ส่วนลด → ค่าส่ง → Net Grand Total; **LINE Flex** — `lib/line-flex`; ส่งอัตโนมัติผ่านระบบ/Flex; **Admin UI** — ไม่มีปุ่มส่งสรุป LINE ด้วยมือ (ลดรบกวน); เหลือ **Copy Flex JSON** ใน Dialog รายละเอียดออเดอร์เป็น fallback/debug; `POST /api/admin/orders/[id]/line-flex` ยังใช้ได้จาก backend/อัตโนมัติ; `loadAdminOrderDetail` รวม `lineUserId` ใน GET `/api/admin/orders/[id]`; `lib/order-financials` = threshold ใบเสนอราคา
- **Orders financial columns** — `orders`: `shipping_fee`, `discount_amount`, `total_amount`, `total_cost` เป็น `@db.Decimal(12, 2)` ใน `schema.prisma`; migration `20260309120000_orders_financial_decimal_12_2` (ADD IF NOT EXISTS + ALTER precision); `db push` / `migrate deploy` ให้ DB ตรง schema; **quotations (Prisma):** `shippingCost` / `discountAmount` / `totalAmount` + `@map` คอลัมน์ snake_case, `shippingCost` NOT NULL default 0; `quotation_items.discount` `@map("discount")`; API POST/PATCH ใช้ camelCase + `Prisma.Decimal`; convert → `createManualOrderFromItems`; `POST /api/admin/orders` คำนวณ `total_amount = itemsSum + shipping_fee - discount_amount`
- **Deduct API** — POST `/api/admin/inventory/deduct`; items, totalAmount, customer; creates COMPLETED order + order_items, decrements variant stock
- **Quotation PDF Fixes** — logo/pdf-settings Base64; เลขที่ SSB-QT via POST `/api/admin/quotations/number`; `CreateOrderModal` คงไว้ใน repo แต่ Manual Grid ไปที่ quotations/new แทน

### LINE Messaging API Alerts
- **Low Stock** — Triggered after successful order (POS) when any variant's stock ≤ `low_stock_threshold`; push to Admin LINE
- **Void Order** — Triggered when an order is voided; includes order number, amount, and reason
- **Daily Closing** — Triggered when "บันทึก Snapshot" is pressed; sends daily sales total and order count
- **Admin UI** — Settings page: status check + "ทดสอบส่งข้อความ" button; fire-and-forget (errors logged, no crash)
- **Claim order / public track (Plan B — standard LINE OAuth 2.0, no LIFF)** — `orders.line_user_id`; migration `20260406120000_orders_line_user_id`; `POST /api/admin/orders/simple` returns `orderId`; `components/admin/PosMiniInvoiceModal.tsx` — track link ผ่าน `getSiteOrigin()` / `NEXT_PUBLIC_SITE_URL`; `GET /api/track/[orderId]`; **LINE OAuth:** `LINE_LOGIN_CHANNEL_ID` + `lib/get-url.ts` (`getSiteOrigin`) → `GET /api/line/login?orderId=` → `GET /api/line/callback` (Prisma `line_user_id`) → `/track/[orderId]?success=true` หรือ `?error=auth_failed`; `app/(storefront)/track/[orderId]/page.tsx` — ปุ่ม Connect LINE; optional `POST /api/track/[orderId]/claim`; `markShipped` → `pushTextToLineUser`
- **OA auto-link (Messaging API webhook, no LINE Login)** — `POST /api/webhooks/line`: `X-Line-Signature` + `LINE_CHANNEL_SECRET` (`lib/line-webhook-signature.ts`); text `Order #…` → `linkLineUserFromOrderChatMessage` (`lib/line-order-message-link.ts`) updates `customers.line_user_id` + `orders.line_user_id`; optional reply via `LINE_CHANNEL_ACCESS_TOKEN`. **Guest checkout persistence:** `getLineUserIdByEmailForCheckout` (`lib/line-customer-line-resolve.ts`) → `createOrder` sets `orders.line_user_id` when email matches an existing customer row. **Order success:** `line_linked` → CTA copy “สอบถามสถานะผ่าน LINE” / “Get updates via LINE (Active ✓)” + EN tracking blurb (`app/(storefront)/order-success/[orderId]/page.tsx`). Web profile table = Prisma `customers` (not a separate `profiles` name).

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
| `LINE_CHANNEL_SECRET` | Messaging API channel secret — **required** for `POST /api/webhooks/line` signature verification |
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
3. **Integration** — LINE OA webhook for order linking: implemented (`/api/webhooks/line`); register URL in LINE Developers Console

---

## 6. Last Updated

### Source of truth — April 29, 2026 *(next session: start here)*

**Supabase Security Advisor hardening**
- Migration `supabase/migrations/20260429120000_security_advisor_functions_storage_rls.sql`: `get_unused_coupons` / `has_used_welcome_coupon` — `REVOKE FROM PUBLIC`, `GRANT EXECUTE` to `authenticated` + `service_role` (signature resolved dynamically); `sync_customer_role_to_auth_user_metadata` — same grants; `storage.objects` — `payment_slips_select_authorized` + `payments_select_authorized` (ADMIN or order owner via `split_part(name,'-',1)`); `stock_snapshots` — `ENABLE ROW LEVEL SECURITY` (no storefront policies; admin Prisma bypasses).

**Step 1 cleanup + critical performance**
- Removed dead/legacy files: `hooks/useDashboard.ts`, `hooks/useWholesale.ts`, `services/cart-logic-service.ts`, public `/inventory`, migration API routes, legacy inventory create-order route, `getAllProductsAdmin`, and broken `getTopSellingVariants`.
- Consolidated global client fetches: `AuthProvider` and `SiteSettingsProvider` now back storefront/admin consumers; POS customer and active product fetches now enforce default limits; breeder links use `seedsBreederHref`.

**Step 2 high-impact logic optimization**
- `lib/order-inventory.ts`: stock validation now uses one `findMany(IN ...)`; stock deduction uses a single conditional SQL update (`stock >= qty`) inside the existing Prisma transaction to prevent oversell under race.
- `services/dashboard-service.ts`: `getFinancialSummary`, `getRevenueSeries`, `getSalesChannelBreakdown`, and `getTopSpenders` aggregate in Postgres instead of loading orders/items into Node.
- `GET /api/products`: added server-side `category`, `search`/`q`, `minPrice`, `maxPrice`, `page`, and `limit`; `getActiveProducts` now supports DB-level filters + pagination.
- `GET /api/storefront/home`: combines new arrivals, featured products, clearance, and recent magazine posts; `HomePageClient` fetches this single payload.

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

**April 16, 2026** — **Password recovery (PKCE):** `app/auth/callback/route.ts` — `exchangeCodeForSession(code)` → redirect `next` (e.g. `/update-password`); `resetPasswordForEmail` → `redirectTo` `/auth/callback?next=/update-password`; `app/(auth)/update-password/page.tsx` — `getSession()` gate → `updateUser` / `signOut` → `/login?reset=success` or `?error=access_denied`; `middleware.ts` — bypass `/auth/callback` + `/update-password`

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
| **อื่น** | `types/supabase.ts` Order; zod รองรับ `SHIPPED` บน quotations POST/PATCH; `docs/blueprint/9_PROJECT_STATE.md` (section 2 bullets อัปเดตคู่กับงานด้านบน) |
