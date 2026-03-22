# Smile Seed Bank V3 — Project State & Progress Tracker

*ไฟล์นี้ใช้เพื่อบันทึกสถานะล่าสุดของโปรเจกต์ เพื่อป้องกัน AI ลืม Context*

---

## 1. System Overview

A **premium Seed Bank Management System** with integrated AI Inventory, CRM, POS, and Automated Accounting. Built for retail and wholesale cannabis seed sales with full Thai localization, loyalty points, and multi-channel order fulfillment.

---

## 2. Completed Modules & Features

### Inventory 2.0
- **AI Genetic Extractor** — Gemini 1.5 / GPT-4o mini toggle; multimodal image upload for packaging/brochure text extraction; auto-fill product specs (genetics, THC/CBD, Indica/Sativa ratio, effects, flavors)
- **Genetic Mapping** — Strain dominance (Mostly Indica / Mostly Sativa / Hybrid 50/50); filter in Manual Grid, POS, Shop, and Dashboard
- **Manual Grid** — Bulk editing by Breeder + Category; custom package sizes; auto-SKU generation; inline stock/price; Sync to main catalog; PNG/PDF export
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

**March 7, 2026** — Quotation PDF: embedded Base64 logo, SSB-QT-YYYYMMDD-XXX numbering, read-only เลขที่, async preview with blob, Thai lineHeight 7.5

---

## 7. สรุปงาน session (มีนาคม 2026)

ไฟล์อ้างอิงหลักอยู่ใน repo ตาม bullet ด้านล่าง (ไม่สร้างไฟล์สรุปแยก)

| หัวข้อ | รายละเอียดสั้น / ไฟล์ |
|--------|----------------------|
| **Dashboard** | Top 5 strains: join `products`/`breeders`, legend `ชื่อ (Breeder)`, `Unknown Breeder` + toast; empty state เมื่อ revenue+orders = 0; `hooks/useExecutiveStats.ts`, `app/api/admin/dashboard/stats/route.ts`, `app/admin/dashboard/page.tsx` |
| **Quotations API** | `shippingCost` / `discountAmount` / `totalAmount` + `Prisma.Decimal`; schema `shippingCost` NOT NULL default 0; PATCH nested items เป็น Decimal — `app/api/admin/quotations/route.ts`, `[id]/route.ts`, `prisma/schema.prisma` |
| **Orders financial** | `shipping_fee`, `discount_amount`, `total_amount` Decimal(12,2); `createManualOrderFromItems` ใช้ `total_amount` / `shipping_fee` / `discount_amount` + Decimal; `POST /api/admin/orders` คำนวณ total ฝั่งเซิร์ฟเวอร์ — `lib/services/manual-order-create.ts`, `app/api/admin/orders/route.ts`, `orders/simple/route.ts`, migrations `20260309120000_*` |
| **เลขออเดอร์ ↔ ใบเสนอราคา** | แปลง QT→OR (`-QT-`→`-OR-`); `orders.order_number` VARCHAR(48); `source_quotation_number`; `lib/pdf-filename.ts` (ชื่อไฟล์ QT_/RE_); UI `doc.save` / `ReceiptPreviewModal` — `convert/route.ts`, migration `20260311120000_*` |
| **ประวัติใบเสนอราคา** | Tabs ทั้งหมด / รอจัดการ / แปลงแล้ว + `lifecycle` query; sort `updatedAt`; badge ปิดดีล / ส่งแล้ว — `app/admin/quotations/page.tsx`, `app/api/admin/quotations/route.ts` GET |
| **Ship → ใบเสนอราคา** | `markShipped` อัปเดต `quotations.status = SHIPPED` (convertedOrderId หรือเลข QT); API ตอบ `quotationStatusSynced`; toast ใน `app/admin/orders/page.tsx`; badge "ส่งแล้ว (ปิดดีล) ✅" — `services/orders-service.ts`, `app/api/admin/orders/[id]/status/route.ts` |
| **สคริปต์ DB** | `scripts/merge-rainbow-melon-products.sql` — merge duplicate Rainbow Melon / orphan products |
| **อื่น** | `types/supabase.ts` Order; zod รองรับ `SHIPPED` บน quotations POST/PATCH; `docs/blueprint/6_PROJECT_STATE.md` (section 2 bullets อัปเดตคู่กับงานด้านบน) |
