# Smile Seed Bank V3 - Project State & Progress Tracker
*ไฟล์นี้ใช้เพื่อบันทึกสถานะล่าสุดของโปรเจกต์ เพื่อป้องกัน AI ลืม Context*

## 🟢 Phase 1: The Foundation (COMPLETED)
- [x] Initialized Next.js 14 (App Router) with TypeScript & Tailwind.
- [x] Configured `tailwind.config.ts` (Sage Green / Zinc) and `globals.css` (CSS Variables).
- [x] Set up Supabase clients (`lib/supabase/client.ts`, `lib/supabase/server.ts`).
- [x] Generated TypeScript interfaces in `types/supabase.ts` matching the DB schema.
- [x] Created utility functions in `lib/utils.ts` (`formatPrice`, `generateOrderNumber`).

## 🟢 Phase 2: Service Layer (COMPLETED)
- [x] `services/product-service.ts`: Implemented parent-child transaction logic, auto-calculate stock/price.
- [x] `services/wholesale-service.ts`: Implemented B2B discount logic.
- [x] `services/cart-logic-service.ts`: Implemented discount tiers, free shipping, and anti-abuse promo code validation (Email & Phone).
- [x] `services/dashboard-service.ts`: Implemented financial metrics (Revenue, COGS, Profit, Inventory Value) prepared for Recharts.

## 🟢 Phase 3: Custom Hooks & State Management (COMPLETED)

### `hooks/useProducts.ts`
- [x] **Zod `VariantSchema`**: validate `unit_label`, `price` (positive), `cost_price` (≥0), `stock` (int ≥0), `is_active`
- [x] **Zod `ProductSchema`**: validate ชื่อ (min 2), category, image URLs, THC/CBD range (0–100), `flowering_type` enum (AUTO/PHOTO), `seed_type` enum (FEMINIZED/REGULAR), nested `variants` array (min 1)
- [x] `fetchProducts()` — ใช้ Supabase browser client, support filter by `category`, `breeder_id`, `limit`
- [x] `fetchProductFull(id)` — ดึงสินค้าพร้อม variants + breeder, filter เฉพาะ `is_active` variants ให้ storefront
- [x] `createProduct(formData)` — Zod validate ก่อน → POST `/api/admin/products` (server-side API, Phase 4)
- [x] Re-exports: `computeStartingPrice`, `computeTotalStock`, `isLowStock` จาก product-service

### `hooks/useCart.ts`
- [x] **Zod `PromoCodeSchema`**: format uppercase alphanumeric, 3–20 chars, regex `/^[A-Z0-9_-]+$/`
- [x] **Zod `AddToCartSchema`**: validate `variantId`, `productId`, `price` (positive), `quantity` (int positive)
- [x] **localStorage persistence** — key `ssb_cart_v3`, อ่านตอน mount, เขียนทุกครั้งที่ items เปลี่ยน
- [x] **Parallel fetch on mount** — `Promise.all([discount_tiers, shipping_rules, promotions])` ด้วย browser client
- [x] `summary` คำนวณด้วย `useMemo` จาก `calculateCartSummary()` — recalculate อัตโนมัติทุกครั้ง
- [x] **Free Gift auto-apply** — `useEffect` เปรียบเทียบ triggered promotions กับ cart items ปัจจุบัน แล้วเพิ่ม/ลบ gift items (`isFreeGift: true`, `price: 0`) อัตโนมัติ
- [x] `addToCart()` — Zod validate ก่อน, merge กับ item ที่มีอยู่ถ้า variantId ซ้ำ
- [x] `removeFromCart()`, `updateQuantity()` — ลบถ้า quantity ≤ 0
- [x] `applyPromoCode(code, email?, phone?)` — Zod format → fetch DB → check `min_spend` → anti-abuse ตรวจ email/phone ใน `promo_code_usages`
- [x] `clearPromoCode()`, `clearCart()` — clear localStorage ด้วย
- [x] `applyWholesaleToItems(discountPercent)` — ปรับราคาทุก non-gift item เป็นราคา wholesale
- [x] `itemCount` — `useMemo` นับจาก non-gift items เท่านั้น

### `hooks/useWholesale.ts`
- [x] **Zod `WholesaleUpdateSchema`**: validate `customerId` (UUID), `isWholesale` (boolean), `discountPercent` (0–99)
- [x] `fetchContext()` — ดึง `is_wholesale` + `wholesale_discount_percent` จาก `customers` table ด้วย browser client
- [x] ถ้าไม่มี `customerId` คืน `{ isWholesale: false, discountPercent: 0, multiplier: 1 }` ทันที
- [x] `updateWholesaleStatus(input)` — Zod validate → PATCH `/api/admin/customers/wholesale`
- [x] Re-exports: `applyWholesalePrice`, `applyWholesaleToCart`, `WholesaleContext` type

### `hooks/useDashboard.ts`
- [x] **Zod `DateRangeSchema`**: validate `YYYY-MM-DD` format + `.refine()` ตรวจ `from <= to`
- [x] Default date range: วันที่ 1 ของเดือนปัจจุบัน → วันนี้
- [x] `fetchDashboard()` — Parallel fetch **4 endpoints** พร้อมกัน: `/summary`, `/revenue-series`, `/channel-breakdown`, `/inventory`
- [x] `setDateRange(range)` — Zod validate ก่อน setState, set `validationError` ถ้า invalid
- [x] `setPeriod("daily" | "monthly")` — trigger refetch อัตโนมัติผ่าน `useCallback` dependency
- [x] Re-exports types: `FinancialSummary`, `RevenueDataPoint`, `ChannelBreakdown`, `InventoryValueResult`

### tsconfig.json (แก้ไขในระหว่าง Phase 3)
- [x] เพิ่ม `"target": "es2017"` และ `"downlevelIteration": true` เพื่อรองรับ Set iteration

---

## 🟢 Phase 4: Admin Backend Structure (COMPLETED)

### shadcn/ui Setup
- [x] Created `components.json` and ran `npx shadcn@latest add` → generated 11 components in `components/ui/` (button, card, badge, table, dialog, input, label, select, textarea, separator, scroll-area)

### Layout & Navigation
- [x] `app/admin/layout.tsx` — Responsive shell: Fixed sidebar (desktop), mobile hamburger overlay
- [x] `components/admin/AdminSidebar.tsx` — Dark zinc sidebar, 8 nav links (Dashboard, สินค้า, Breeders, ออเดอร์, POS, ลูกค้า, โปรโมชั่น, บทความ) + active state highlight

### Financial Dashboard
- [x] `app/admin/dashboard/page.tsx` — Date range + period picker, 4 Scorecards (ยอดขาย/กำไร/สินค้าคงคลัง/COGS), Low stock alert banner, Bar Chart + Pie Chart layout, connected to `useDashboard` hook
- [x] `components/admin/charts/RevenueBarChart.tsx` — Recharts Bar Chart (ยอดขาย/ต้นทุน/กำไร), THB formatter, Skeleton loading
- [x] `components/admin/charts/ChannelPieChart.tsx` — Recharts Donut Pie Chart (B2C vs B2B Wholesale), % breakdown

### Products Management
- [x] `app/admin/products/page.tsx` — Search bar, data table (thumbnail, ชื่อ, หมวดหมู่, แบรนด์, ราคา, สต็อก, สถานะ), low stock indicator, skeleton loader, connected to `useProducts` hook
- [x] `components/admin/ProductModal.tsx` — Full Add Product form: **AI Extraction box** (Textarea + Wand2 button → calls `/api/admin/ai-extract`), TH/EN description, THC/CBD/Type specs, dynamic Variants builder (add/remove/toggle), Zod validation errors displayed inline

### Manual Order / POS
- [x] `app/admin/orders/create/page.tsx` — Left panel: product search + variant selector (add to cart), Customer info form (ชื่อ, โทร, ที่อยู่, วิธีชำระ). Right panel: live cart (qty +/-, remove), promo code input, upsell message, summary rows (subtotal/discount/shipping/total), submit button → POST `/api/admin/orders`

### API Routes
- [x] `app/api/admin/dashboard/summary/route.ts` — GET (from/to query params) → `getFinancialSummary()`
- [x] `app/api/admin/dashboard/revenue-series/route.ts` — GET (from/to/period) → `getRevenueSeries()`
- [x] `app/api/admin/dashboard/channel-breakdown/route.ts` — GET → `getSalesChannelBreakdown()`
- [x] `app/api/admin/dashboard/inventory/route.ts` — GET → `getInventoryValue()`
- [x] `app/api/admin/products/route.ts` — POST with Zod validation → `createProductWithVariants()`
- [x] `app/api/admin/customers/wholesale/route.ts` — PATCH with Zod → `setWholesaleStatus()`

### TypeScript
- [x] `npx tsc --noEmit` → 0 errors ✅

---

## 🟢 Phase 5: Storefront Shell & UI Theme (COMPLETED)

### shadcn/ui Sheet
- [x] `components/ui/sheet.tsx` — ติดตั้งผ่าน `npx shadcn@latest add sheet`

### Cart Context
- [x] `context/CartContext.tsx` — wrap `useCart()` ใน React Context เพิ่ม `isOpen`, `openCart()`, `closeCart()` เพื่อให้ Navbar และ CartSheet ใช้ cart state ร่วมกันโดยไม่ต้อง prop drill

### Global Storefront Layout
- [x] `app/(storefront)/layout.tsx` — Wraps `<CartProvider>` → `<Navbar>` → `<main>` → `<Footer>`

### Navbar
- [x] `components/storefront/Navbar.tsx` — Sticky top bar, scroll-aware (transparent → white/blur), Logo ซ้าย, Links กลาง (Desktop), Cart icon ขวา พร้อม animated badge count (`framer-motion` scale bounce), Hamburger + AnimatePresence dropdown (Mobile)

### Footer
- [x] `components/storefront/Footer.tsx` — 4-column grid layout (Brand + Social icons, Quick Links, Contact), Bottom bar with copyright

### CartSheet
- [x] `components/storefront/CartSheet.tsx` — Shadcn Sheet slide-in จากขวา, แสดง items พร้อมรูป, qty +/-, remove, Free Gift badge, Promo code input, Upsell message, Summary (subtotal/discount/shipping/total), ปุ่ม Checkout → `/checkout`

### Home Page
- [x] `app/(storefront)/page.tsx`
  - **Hero Section**: Ken Burns background effect (`animate-ken-burns` CSS animation), gradient overlay, Text Reveal ด้วย `framer-motion` (Fade-in + Slide-up ทีละ element delay 0/0.1/0.2/0.3s), CTA buttons (ดูสินค้า + อ่านบทความ), Scroll indicator animation
  - **Features Strip**: 3-column (คัดสรรคุณภาพ, จัดส่งรวดเร็ว, สายพันธุ์หายาก)
  - **Bestsellers Grid**: `useProducts({ limit: 8 })` → 2-4 col responsive grid, ProductCard (hover scale-105, Breeder logo overlay, THC/Seed type badges, Low stock badge), Skeleton loading state
  - **CTA Banner**: Sage Green gradient banner สมัครสมาชิก / Wholesale

### Build Status
- [x] `npx next build` → `✓ Compiled successfully` / 0 errors

---

## 🟢 Phase 6: Final Integration — Shop, Product Details & Checkout (COMPLETED)

### shadcn/ui Tabs
- [x] `components/ui/tabs.tsx` — ติดตั้งผ่าน `npx shadcn@latest add tabs` (ใช้ใน Product Detail page)

### useAuth Hook (อัพเดต)
- [x] `hooks/use-auth.ts` — implement จริง: `createBrowserClient` → `getSession()` + `onAuthStateChange()` → fetch customer profile จาก `customers` table → expose `user`, `customer`, `isLoading`, `signOut()`

### API Routes
- [x] `app/api/storefront/orders/route.ts` — POST: Zod validation → upsert customer → fetch cost_price snapshot → insert `orders` → insert `order_items` → record `promo_code_usages` → return `orderNumber`

### Shop Page
- [x] `app/(storefront)/shop/page.tsx` — Product catalog grid (2-4 col responsive), Search bar, Filter panel (Category + Breeder), Active filter chips, Breeder logo overlay (bottom-right absolute), Status badges (หมด/เหลือน้อย), Framer Motion stagger animation

### Product Details Page
- [x] `app/(storefront)/product/[slug]/page.tsx` — uses `fetchProductFull(id)`, Framer Motion slide-in, Variant Selector buttons (price + stock display, disabled if sold out), Add to Cart feedback ("✓ เพิ่มแล้ว!" 2s), Indica/Sativa ratio bar, **3-tab layout (Shadcn Tabs)**:
  - Tab 1: คำบรรยาย TH+EN
  - Tab 2: AI Specs (Genetics, THC%, CBD%, Flowering Type, Seed Type, Yield, Difficulty)
  - Tab 3: Effects & Flavors (chip badges from JSON arrays)

### Checkout Page
- [x] `app/(storefront)/checkout/page.tsx` — Zod form validation (full_name min 2, phone min 9, address min 10), **Auto-fill จาก `customer` profile** เมื่อ `useAuth` login, Payment method selector (โอน/Crypto/COD), Order summary panel (sticky, items + discount + shipping + total), Submit → `/api/storefront/orders` → redirect `/order-success?order=XXXXXX`, Guard: empty cart redirect

### Order Success Page
- [x] `app/(storefront)/order-success/page.tsx` — animated scale-in card, Order number display (3xl bold), Step-by-step guide (3 steps), **Line OA Deep Link button** (pre-filled message: เลขออเดอร์ #XXXXXX), secondary buttons (ดูออเดอร์, หน้าแรก, ช้อปต่อ)

### Build Status
- [x] `npx next build` → `✓ Compiled successfully` / 0 errors

---

## ⚠️ Known Gotchas & Resolved Issues

1. **Client imports Server code** — `useProducts`, `useCart`, `useWholesale` ล้วน import pure functions จาก services ที่ใช้ `next/headers` → แก้ด้วยการแยก `lib/product-utils.ts`, `lib/wholesale-utils.ts`, `lib/cart-utils.ts`

2. **Zod v4 breaking change** — `z.enum(..., { errorMap: ... })` ถูกลบออก ต้องใช้ `{ message: ... }` หรือ `.refine()` แทน

3. **Framer Motion `ease: number[]`** — Variant ที่ระบุ `ease` เป็น cubic-bezier array `[0.22, 1, 0.36, 1]` จะ fail TypeScript — ต้องใช้ string shorthand เช่น `"easeOut"`

4. **`[slug]` route = product ID** — Product type ไม่มี `slug` field ตามที่ Supabase schema กำหนด → ใช้ `product.id` เป็น URL parameter แทนไปก่อน (แนะนำเพิ่ม `slug` field ในตาราง products ภายหลัง)

5. **`Order` type ไม่มี `full_name`/`address`** — ข้อมูลลูกค้าอยู่ใน `customers` table แยกต่างหาก → checkout API upsert ข้อมูลลูกค้าก่อน แล้วผูก `customer_id` ใน order

6. **`shipping_address` column เพิ่มแล้ว (Post-Phase 6 Hotfix)** — เพิ่ม `shipping_address TEXT` ทั้งใน `types/supabase.ts` และ DB จริง (SQL ด้านล่าง) และ API routes ทั้ง storefront + admin/POS บันทึก snapshot ที่อยู่ลง `orders.shipping_address` ทุกครั้ง

### SQL Migration (รันใน Supabase SQL Editor)
```sql
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_address TEXT;
```


---

## ✅ System-Wide Audit (Phases 1–6) — COMPLETED

**วันที่:** Post Phase 6

### สิ่งที่ตรวจสอบและผ่าน (10/10 Checks Clean)
| Check | ผลลัพธ์ |
|---|---|
| `shipping_address` data flow (types → API → DB) | ✅ PASS |
| Zod schemas alignment กับ Supabase types | ✅ PASS |
| Dead code / duplicate logic | ✅ ไม่พบ (3 stubs ตั้งใจสำหรับ Phase 7) |
| `useEffect` dependency arrays / infinite loops | ✅ PASS (free gifts guard ทำงานถูกต้อง) |
| `.map()` key props ทุก component | ✅ PASS |
| API ↔ Hook connectivity | ✅ PASS |
| CartContext ↔ Navbar ↔ CartSheet | ✅ PASS |
| useAuth auto-fill ↔ Checkout | ✅ PASS |
| `fetchProductFull` dep stability | ✅ PASS (useCallback deps = []) |
| `lib/utils.ts` exports (`formatPrice`, `generateOrderNumber`) | ✅ PASS |

### สิ่งที่แก้ไข
- `app/(storefront)/product/[slug]/page.tsx` — ChipList component: เปลี่ยน `key={i}` (index-only) → `key={\`${String(item)}-${i}\`}` เพื่อป้องกัน key collision เมื่อ items มีค่าซ้ำ

### Intentional Stubs (Phase 7)
- `services/ai-extractor.ts` — รอ Gemini/OpenAI API integration
- `services/email-service.ts` — รอ Resend integration
- `services/line-messaging.ts` — รอ Line Messaging API integration

### Final Build
- `npx next build` → `✓ Compiled successfully` — **0 errors, 0 warnings**

---

## ✅ Phase 7 — External Integrations & SEO Blog [x] COMPLETED

### Step 1: External API Services

#### `services/ai-extractor.ts` — Google Gemini 1.5 Flash
- ส่ง raw text จาก Breeder website ไปยัง Gemini REST API (`generativelanguage.googleapis.com`)
- System prompt สั่งให้ Gemini ส่งกลับ JSON เท่านั้น (`responseMimeType: application/json`)
- Return: `ExtractedProductData` (name, genetics, thc_percent, cbd_percent, indica_ratio, effects, flavors, description_th/en ฯลฯ)
- ใช้ `GEMINI_API_KEY` จาก `.env.local`
- Error handling: ห่อด้วย try-catch, return `{ data, error }` pattern

#### `app/api/admin/ai-extract/route.ts`
- POST endpoint รับ `{ rawText: string }`, validate ด้วย Zod (min 20 chars)
- เรียก `extractProductData()` แล้ว return JSON ตรงๆ
- ปุ่ม "Wand" ใน `ProductModal` เชื่อมต่อแล้ว → auto-fill form fields เมื่อ AI ส่งผลกลับมา

#### `services/email-service.ts` — Resend
- `sendOrderConfirmationEmail()`: ส่ง HTML email สวยงามพร้อม order details, totals, shipping address, Line OA button
- `sendTrackingEmail()`: ส่งเลข tracking ให้ลูกค้าหลัง admin อัปเดต status
- ใช้ `RESEND_API_KEY` จาก `.env.local`
- ทั้งสอง function return `{ success, error }` — ไม่ throw เพื่อป้องกัน crash หลัก

#### `services/line-messaging.ts` — Line Messaging API
- `notifyAdminNewOrder()`: ส่ง LINE Flex Message สวยงามไปยัง OA (broadcast) แจ้งเตือน admin เมื่อมี order ใหม่
- Flex Message แสดง: order number, ชื่อลูกค้า, จำนวนสินค้า, ยอดเงิน, ที่อยู่จัดส่ง, ปุ่ม "ดูออเดอร์"
- `broadcastTextMessage()`: helper สำหรับส่ง plain text notification
- ใช้ `LINE_CHANNEL_ACCESS_TOKEN` จาก `.env.local`

#### Wire-up: `/api/storefront/orders/route.ts`
- หลัง insert order สำเร็จ: เรียก `sendOrderConfirmationEmail()` + `notifyAdminNewOrder()` แบบ **fire-and-forget** (`void`)
- ถ้า email/Line ล้มเหลว → ไม่กระทบ response ของ checkout (**Graceful Failure**)

### Step 2: Blog System

#### `app/(storefront)/blog/page.tsx` — Server Component (ISR 10 min)
- Fetch ด้วย Supabase Server client โดยตรง (ไม่ผ่าน API route)
- Featured post (บทความล่าสุด) แสดง layout แนวนอน full-width พร้อม badge "บทความแนะนำ"
- Grid บทความที่เหลือ: responsive 1→2→3 columns
- Animation hover: -translate-y-1 + shadow
- รองรับ bilingual (Thai fallback to English)

#### `app/(storefront)/blog/[slug]/page.tsx` — Server Component (ISR 10 min)
- **`generateMetadata()`**: สร้าง SEO meta tags ครบ (title, description, og:title, og:image, og:type=article, twitter:card, canonical URL)
- **`generateStaticParams()`**: pre-generate paths สำหรับ blog ที่ published ทุกบทความ (SSG-ready)
- แสดง bilingual: TH เป็นหลัก, EN อยู่ใน `<details>` ที่กางออกได้
- Related articles: fetch บทความ category เดียวกัน 3 บทความ
- Render HTML content ด้วย `dangerouslySetInnerHTML` (รองรับ Rich Text จาก CMS)
- View count, date, category badge แสดงครบ

---

## ✅ Hotfix & Feature Patches (Post Phase 7)

### Hotfix: Line Messaging Privacy Fix
- เปลี่ยน `notifyAdminNewOrder()` จาก **Broadcast** → **Push** (`/v2/bot/message/push`)
- ส่งเฉพาะ `LINE_ADMIN_USER_ID` เท่านั้น ป้องกันข้อมูลออเดอร์รั่วไหลไปยัง followers ทั้งหมด
- เพิ่ม `pushTextToAdmin()` สำหรับ admin alerts (push เท่านั้น)
- `broadcastMarketingMessage()` ใช้ได้เฉพาะ marketing — **ห้ามใส่ข้อมูลลูกค้า**
- เพิ่ม `LINE_ADMIN_USER_ID="Uxxxxx..."` ใน `.env.local` (ต้องไปอัปเดตค่าจริง)

### Hotfix: /admin Redirect
- สร้าง `app/admin/page.tsx` — `redirect("/admin/dashboard")` ป้องกัน 404 เมื่อเข้า `/admin`

---

## ✅ AI Provider Switch & Vision Upgrade (Post Phase 7)

### AI Provider Toggle (Gemini vs OpenAI)
- `services/ai-extractor.ts` — แยก `extractWithGemini()` / `extractWithOpenAI()` ชัดเจน
- Unified `extractProductSpecs(rawText, provider, images[])` entry point
- Zod API: `provider: z.enum(["gemini", "openai"]).default("gemini")`
- UI: Toggle button 2 ตัว (**✨ Gemini 1.5** / **🤖 GPT-4o mini**) สีเขียว Sage Green เมื่อเลือก
- Error state `aiError` แสดง message เมื่อ API key หายหรือ AI ล้มเหลว

### AI Vision (Multimodal Image Upload)
- `services/ai-extractor.ts` — รองรับ `Base64Image[]`:
  - **Gemini**: แนบรูปเป็น `inlineData` (mimeType + pure base64 หลัง strip prefix)
  - **OpenAI**: แนบรูปเป็น `{ type: "image_url", image_url: { url: dataUrl, detail: "high" } }`
- System prompt อัปเดต: ระบุให้อ่านข้อความจากรูป packaging/brochure และ combine กับ text
- API route: `images: z.array(z.string().startsWith("data:")).max(5).default([])`
- UI: Image upload zone (hidden `<input type="file" multiple>`), thumbnail 64×64 พร้อมปุ่มลบ, จำกัด 5 รูป
- `readAsBase64(File)` → Promise helper แปลงไฟล์เป็น data-URI
- Wand button: disable เมื่อ text ว่าง **และ** ไม่มีรูป, loading text เปลี่ยนเป็น "กำลังวิเคราะห์ภาพ..."

### Breeder Selection in ProductModal
- `hooks/useBreeders.ts` — hook ใหม่ fetch active breeders จาก Supabase client, sort by name
- `components/admin/ProductModal.tsx` — เพิ่ม `<select>` Breeder dropdown bind กับ `form.breeder_id`
- Default: "— ไม่ระบุ Breeder —" (null)

---

## 🚨 Known Gotchas & Resolved Issues
*(บันทึก Error สำคัญระดับโครงสร้างที่แก้แล้ว เพื่อไม่ให้ AI ทำผิดซ้ำ)*
- **Next.js Config:** ห้ามใช้ `next.config.ts` ให้ใช้ `next.config.mjs` เสมอ เพื่อป้องกัน Error ตอนรัน `npm run dev`
- **Zod Validation:** ต้องใช้ `.safeParse()` ดัก Error เสมอก่อนยิง API ห้ามยิงข้อมูลดิบไปที่ Backend โดยตรง
- **Line API — Privacy Critical Fix:** Fixed Line API to use **Push Message to Admin** (`/v2/bot/message/push` + `to: LINE_ADMIN_USER_ID`) instead of **Broadcast** (`/v2/bot/message/broadcast`) to prevent customer order details from being sent to all OA followers — a massive privacy breach. Admin must set `LINE_ADMIN_USER_ID="Uxxxx..."` in `.env.local`. Broadcast endpoint is now reserved ONLY for `broadcastMarketingMessage()` (no customer data allowed).
- **LINE_ADMIN_USER_ID:** Find your Admin User ID in Line Developers Console → Provider → Channel → Messaging API → "Your user ID" field.
- **`createAdminClient()` is async:** ต้อง `await createAdminClient()` เสมอในทุก API route — ถ้าลืม `await` จะได้ `Promise` แทน client จริง → `.from()` = undefined → 500 error
- **Storage RLS blocks browser uploads:** ห้ามอัปโหลด file ตรงจาก browser ด้วย `createClient()` (anon key) ไปยัง Supabase Storage — ต้องส่งผ่าน server-side API route ที่ใช้ `createAdminClient()` เสมอ

---

## ✅ Feature Sprint: Image Upload, Brand Assets & Breeder System (Feb 25, 2026)

### Direct Image Upload with Auto-Resizing (ProductModal)
- ติดตั้ง `browser-image-compression` (npm)
- สร้าง `lib/supabase/storage-utils.ts` — `processAndUploadImages(files[])`: compress → WebP (max 0.8MB, 1200px) → POST ไปยัง server API
- สร้าง `app/api/admin/products/upload/route.ts` — รับ FormData, ใช้ `createAdminClient()` upload ไป `product-images` bucket (bypass Storage RLS)
- เพิ่ม `image_urls JSONB` column ใน `types/supabase.ts` + `lib/validations/product.ts`
- อัปเดต `ProductModal.tsx`:
  - Upload Zone ใหม่: drag-and-drop (`onDragOver`, `onDrop`), `isDragging` state, highlight border
  - Thumbnail previews 5 slot พร้อมปุ่ม X ลบ, badge "หลัก" รูปแรก, จุดสีเขียว = รอ upload
  - Save flow: upload files → ได้ URLs → set ทั้ง `image_urls[]` และ `image_url`/`image_url_2-5` (backward compat)
- อัปเดต `ProductGallery` (`product/[slug]/page.tsx`) — อ่านจาก `image_urls` JSONB ก่อน, fallback ไป separate columns

**SQL ที่ต้องรัน:**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;
```

---

### Brand Settings Page (Admin)
- สร้าง `app/admin/settings/page.tsx` — อัปโหลด Main Logo (SVG/PNG) พร้อม preview, สำรองไว้สำหรับ Watermark (ถูกลบออกในภายหลัง)
- สร้าง `hooks/useSiteSettings.ts` — fetch/update `site_settings` table (`logo_main_url`, `site_name`)
- สร้าง `app/api/admin/settings/route.ts` — GET + POST (upsert) สำหรับ `site_settings` table ด้วย `createAdminClient()`
- สร้าง `app/api/admin/settings/upload/route.ts` — รับ FormData file, upload ไป `brand-assets` bucket ด้วย service role
- อัปเดต `Navbar.tsx` + `Footer.tsx` — ถ้ามี `logo_main_url` ใน DB → แสดง `<Image>` แทน Leaf icon (fallback graceful)
- **Watermark logic ถูกลบออกทั้งหมด** (`lib/utils/watermark.ts` deleted) — ตัดสินใจไม่ใช้ feature นี้

**SQL ที่ต้องรัน:**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON site_settings FOR SELECT USING (true);
CREATE POLICY "admin write" ON site_settings FOR ALL
  USING (auth.role() = 'service_role');
```

---

### Navbar Logo Size Upgrade
- `Navbar.tsx` — Logo: `h-16` mobile / `h-24` desktop, Header bar: `h-20` mobile / `h-28` desktop, padding: `px-5`/`px-8`

---

### Breeder Management Upgrade (Admin Modal)
- ลบ "URL โลโก้" text input ออกจาก Breeder modal
- เพิ่ม Direct Upload Zone (80×80px, rounded-2xl) — คลิกหรือใช้ปุ่ม, preview ทันที
- Auto-compress → WebP (max 0.3MB, 400px) ก่อน upload
- Upload ทันทีเมื่อเลือกไฟล์ → URL เก็บใน `form.logo_url` รอ save
- สร้าง `app/api/admin/breeders/upload/route.ts` — upload ไป `brand-assets/breeders/` ด้วย service role
- Table logo: เปลี่ยนจาก `object-cover` → `object-contain p-1` ให้เห็นโลโก้ครบ

---

### Floating Breeder Logo Overlay (Storefront)
- **Product Gallery** (`product/[slug]/page.tsx`) — Breeder badge: `top-3 right-3`, `h-16 w-16`, `rounded-2xl`, `bg-white/75 backdrop-blur-md shadow-xl`, `object-contain p-1.5`, hover scale-110, always visible (fallback Leaf icon)
- **ProductCard** (home page + shop page) — Breeder badge: `top-2 right-2`, `h-10 w-10`, `rounded-xl`, `bg-white/80 backdrop-blur-sm shadow-md`, hover scale-110

---

### Breeder Showcase Section (Home Page)
- `app/(storefront)/page.tsx` — เพิ่ม section "Our Trusted Partners" ระหว่าง Hero และ Features Strip
- Horizontal scroll carousel ซ่อน scrollbar (CSS: `[scrollbar-width:none]`)
- แต่ละ logo: `h-24/w-24` → `h-28/w-28` บน desktop, Glassmorphism card, hover lift
- แสดงเฉพาะ active breeders ที่มี `logo_url` สูงสุด 8 ราย
- Desktop: "View All →" บน header, Mobile: ปุ่ม "ดู Breeder ทั้งหมด" ด้านล่าง → link ไป `/breeders`
- Section ซ่อนอัตโนมัติถ้าไม่มี active breeder ที่มีโลโก้

---

### Dedicated Breeders Page
- สร้าง `app/(storefront)/breeders/page.tsx` — หน้าแสดง Breeder ทั้งหมด
- Grid: 1→2→3→4 columns responsive, แสดงเฉพาะ `is_active = true`
- Card: Logo 128px `object-contain`, ชื่อ, `line-clamp-3` description, CTA "Explore Genetics →"
- CTA link → `/shop?breeder=[id]`
- Loading spinner + empty state ครบ
- Bilingual TH/EN ทุก label

---

### Filtered Shop Page with Breeder Header
- `app/(storefront)/shop/page.tsx` — อ่าน `?breeder=ID` query param ด้วย `useSearchParams()`
- Import `useBreeders` — หา breeder data จาก ID
- **Breeder Banner** (เมื่อมี URL param):
  - `bg-gradient-to-r from-emerald-50 via-white to-emerald-50` soft green gradient
  - Logo (128px) + ชื่อ Breeder + full description + จำนวนสายพันธุ์
  - ปุ่ม "แสดงสินค้าทั้งหมด ←" → `router.push("/shop")` reset
  - Framer Motion fade-in animation
- **Product filtering**: กรองโดย `breeder_id === urlBreeder.id` (ID-based, แม่นยำกว่า name-based)
- URL param override filter panel: ถ้ามี `?breeder=` จะ bypass panel breeder filter
- `clearFilters()` อัปเดตให้ `router.push("/shop")` ล้าง URL param ด้วย

---

## ✅ Tiered Discounts: Pivot to Total Spend (Mar 2026)

- **Schema**: `min_items` → `min_spend` (ยอดซื้อขั้นต่ำ ฿)
- **Logic**: เปรียบเทียบ Subtotal กับ `min_spend` tiers, ใช้ % สูงสุดที่ qualify
- **Fallback**: ฿2,000+ = 10%, ฿4,000+ = 15%, ฿5,000+ = 20%

**SQL Migration:** ใช้ไฟล์ `supabase/migrations/20260228000000_tiered_discount_rules.sql` (CREATE IF NOT EXISTS + GRANT + NOTIFY pgrst)

---

## 📋 สรุปงาน Tasks วันที่ 26-27 ก.พ. 2026

### 26 ก.พ.
| Task | ไฟล์หลัก | รายละเอียด |
|------|----------|------------|
| **Hotfix: Line Messaging Privacy** | `services/line-messaging.ts` | เปลี่ยน Broadcast → Push เฉพาะ `LINE_ADMIN_USER_ID`, ป้องกันข้อมูลออเดอร์รั่ว |
| **Hotfix: /admin Redirect** | `app/admin/page.tsx` | redirect `/admin` → `/admin/dashboard` ป้องกัน 404 |
| **AI Provider Toggle** | `services/ai-extractor.ts`, `ProductModal.tsx` | Toggle Gemini 1.5 / GPT-4o mini, Zod `provider` enum |
| **AI Vision (Multimodal)** | `services/ai-extractor.ts`, `app/api/admin/ai-extract/route.ts` | รองรับ Base64Image[] สูงสุด 5 รูป, อ่านข้อความจาก packaging/brochure |
| **Breeder Selection** | `hooks/useBreeders.ts`, `ProductModal.tsx` | Dropdown เลือก Breeder ในฟอร์มเพิ่มสินค้า |

### 27 ก.พ.
| Task | ไฟล์หลัก | รายละเอียด |
|------|----------|------------|
| **Login Page** | `app/(storefront)/login/page.tsx` | Tab เข้าสู่ระบบ/สมัคร, Google OAuth + Email/Password, Framer Motion |
| **Profile Page** | `app/(storefront)/profile/page.tsx` | Tab ประวัติออเดอร์/ข้อมูลส่วนตัว, เลขพัสดุ Copy, แก้ไขโปรไฟล์ |
| **Profile Orders API** | `app/api/storefront/profile/orders/route.ts` | GET orders + order_items + variants + products (join) |
| **Fix: Logo Upload** | `app/api/admin/settings/upload/route.ts`, Storage RLS | แก้ไข upload brand-assets ให้ bypass RLS ผ่าน service role |
| **Fix: Product Image Upload** | `app/api/admin/products/upload/route.ts`, `storage-utils.ts` | แก้ไข upload product-images, ตรวจ bucket policy + CORS |

---

## 📋 สรุปงาน 5 Tasks ล่าสุด (Feb 28, 2026)

| # | Task | ไฟล์หลัก | สถานะ |
|---|------|----------|-------|
| 1 | **Breeder Management Upgrade** — ลบ URL input, เพิ่ม Direct Upload Zone 80×80, auto-compress WebP, API `/api/admin/breeders/upload` | `app/admin/breeders/page.tsx`, `app/api/admin/breeders/upload/route.ts` | ✅ |
| 2 | **Floating Breeder Logo Overlay** — Product Gallery + ProductCard แสดง Breeder badge แบบ glassmorphism overlay | `app/(storefront)/product/[slug]/page.tsx`, `app/(storefront)/page.tsx`, `app/(storefront)/shop/page.tsx` | ✅ |
| 3 | **Breeder Showcase Section** — Home page carousel "Our Trusted Partners" แสดง Breeder logos สูงสุด 8 ราย | `app/(storefront)/page.tsx` | ✅ |
| 4 | **Dedicated Breeders Page** — `/breeders` grid cards พร้อม CTA "Explore Genetics" → `/shop?breeder=ID` | `app/(storefront)/breeders/page.tsx` | ✅ |
| 5 | **Filtered Shop with Breeder Header** — อ่าน `?breeder=ID`, แสดง Breeder Banner, กรองสินค้าตาม breeder_id | `app/(storefront)/shop/page.tsx` | ✅ |
| 6 | **Dynamic Tiered Discounts CRUD** — Admin แก้ไขขั้นบันไดได้เต็มที่: rules state, input rows, Add/Delete, API POST `/api/admin/discounts/tiered-discounts` (validate, clear, bulk insert) | `app/admin/discounts/page.tsx`, `app/api/admin/discounts/tiered-discounts/route.ts` | ✅ |
| 7 | **Tiered Discounts Schema Fix** — SQL migration + GRANT + NOTIFY pgrst, DiscountProgressBar ใน CartSheet/Checkout, fallback rules เมื่อ table not found | `supabase/migrations/`, `DiscountProgressBar.tsx`, `useCart.ts` | ✅ |
| 8 | **Advanced Promo Validation** — `requires_auth`: error "Please login" if not logged in; `first_order_only`: check orders (PAID/SHIPPED) by user_id or email; usage check via `coupon_redemptions` | `app/api/storefront/coupons/validate/route.ts`, migration `20260228500000`, admin discounts page | ✅ |

---

## 📋 สรุปงาน: Shipping, Notifications & LINE Linking (Feb 28, 2026)

### Shipping Management (Admin + Client)
| รายการ | ไฟล์ / รายละเอียด |
|--------|---------------------|
| **DB** | `supabase/migrations/20260228800000_orders_shipping_provider.sql` — เพิ่มคอลัมน์ `shipping_provider` ใน `orders` |
| **Admin: Mark as Shipped** | `services/orders-service.ts`: `markShipped(orderId, trackingNumber, shippingProvider)` — Direct SQL อัปเดต status=SHIPPED, tracking_number, shipping_provider |
| **Admin UI** | `app/admin/orders/page.tsx`: ปุ่ม "ยืนยันการจัดส่ง" สำหรับ order สถานะ PAID, Ship Modal (เลือก carrier: Thailand Post / Kerry / Flash / J&T + กรอกเลขพัสดุ) |
| **Status API** | `app/api/admin/orders/[id]/status/route.ts`: รองรับ action `"ship"` พร้อม `trackingNumber`, `shippingProvider` (Zod) |
| **Client: Dynamic Tracking** | `components/storefront/OrderDetailDrawer.tsx`: ฟังก์ชัน `trackingUrl(trackingNumber, shipping_provider)` — สร้าง URL ตาม carrier (Thailand Post, Kerry, Flash, J&T) |
| **Profile Orders API** | `app/api/storefront/profile/orders/route.ts`: คืน `shipping_provider` ใน order data |

### Automated Shipping Confirmation Email
| รายการ | ไฟล์ / รายละเอียด |
|--------|---------------------|
| **Template** | `services/email-service.ts`: `sendShippingConfirmationEmail()` — ธีม Emerald, แสดง Carrier + เลขพัสดุ, ปุ่ม "ติดตามพัสดุ" ลิงก์ไป carrier tracking URL |
| **Integration** | `services/orders-service.ts`: หลัง `markShipped` อัปเดต DB สำเร็จ → fire-and-forget เรียก `sendShippingConfirmationEmail` (ดึง email/full_name จาก customers) |

### LINE Shipping Alert (Customer)
| รายการ | ไฟล์ / รายละเอียด |
|--------|---------------------|
| **Flex Message** | `services/line-messaging.ts`: `sendCustomerShippingAlert()` — Header "พัสดุของคุณถูกส่งออกแล้ว!", Body: เลขพัสดุ + carrier, ปุ่ม "ติดตามพัสดุ" + "ดูรายละเอียดออเดอร์" |
| **Integration** | `services/orders-service.ts`: ใน fire-and-forget block — ถ้ามี `line_user_id` ใน customers เรียก `sendCustomerShippingAlert()` (แยก try-catch ไม่กระทบ email) |

### One-Click LINE Account Linking
| รายการ | ไฟล์ / รายละเอียด |
|--------|---------------------|
| **OAuth Start** | `app/api/auth/line/connect/route.ts`: GET — ตรวจ session (Supabase), สร้าง state cookie (`userId:random`), redirect ไป LINE authorization (`scope=profile`) |
| **OAuth Callback** | `app/api/auth/line/callback/route.ts`: ตรวจ state, exchange code → token → ดึง LINE profile (userId), Direct SQL `UPDATE customers SET line_user_id = ? WHERE id = ?`, redirect `/profile?tab=profile&line_connected=1` |
| **Profile UI** | `app/(storefront)/profile/page.tsx`: Section "Social Connections" — ปุ่ม "เชื่อมต่อ LINE" (official green), แสดงสถานะ "เชื่อมต่อแล้ว" ถ้ามี `customer.line_user_id`; Toast เมื่อ `line_connected=1` |
| **Env** | ใช้ `LINE_LOGIN_CHANNEL_ID`, `LINE_LOGIN_CHANNEL_SECRET` (LINE Login channel แยกจาก Messaging API) |

### Email & Notification Data Flow Fixes
| รายการ | ไฟล์ / รายละเอียด |
|--------|---------------------|
| **Product Names in Email** | `lib/services/order-service.ts`: `fetchEmailItems()` join product_variants → products → breeders สร้างชื่อแบบ "Lemon Paya (Photo) by Sensi Seeds"; Order confirmation email ใช้รายการนี้ ไม่แสดง "Product #id" |
| **Full Address** | Order confirmation ใช้ `shippingAddress` จาก customer/checkout (เก็บใน orders.shipping_address) — แสดงเต็มใน email ด้วย `white-space: pre-line` |
| **Thailand Post URL** | ทุกจุดใช้ `https://track.thailandpost.co.th/?trackNumber={tracking_number}`: `services/email-service.ts`, `services/line-messaging.ts`, `components/storefront/OrderDetailDrawer.tsx` |
| **Deep Link View Order** | ปุ่ม "ดูรายละเอียดออเดอร์" ใน Email + LINE Shipping Alert → `/profile?tab=orders&open={order_id}`; `sendOrderConfirmationEmail` / `sendShippingConfirmationEmail` / `sendCustomerShippingAlert` รับ `orderId` และใส่ใน URL |
| **Profile Auto-Open Drawer** | `app/(storefront)/profile/page.tsx`: อ่าน `?open=` จาก URL หลังโหลด orders → หา order ที่ id ตรง → `setTab("orders")`, `setSelectedOrder(order)` → ลบ param ออกจาก URL |

### สรุปไฟล์ที่สร้าง/แก้ไขในชุดงานนี้
- **Migrations:** `20260228800000_orders_shipping_provider.sql`
- **Services:** `services/orders-service.ts` (markShipped, fire-and-forget email+LINE), `services/email-service.ts` (sendShippingConfirmationEmail, orderId ใน link), `services/line-messaging.ts` (sendCustomerShippingAlert, orderId ใน link, trackNumber)
- **API:** `app/api/auth/line/connect/route.ts`, `app/api/auth/line/callback/route.ts`, `app/api/admin/orders/[id]/status/route.ts` (ship action)
- **Pages/Components:** `app/admin/orders/page.tsx` (Ship Modal, ปุ่มจัดส่ง), `app/(storefront)/profile/page.tsx` (Social Connections, ?open= drawer), `components/storefront/OrderDetailDrawer.tsx` (dynamic tracking URL, trackNumber)