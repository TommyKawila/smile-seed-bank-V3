# Database Schema & RLS (Supabase)

## Core Tables (โครงสร้างตารางหลักและ ERP)

### 1. store_settings (ตั้งค่าร้านค้าส่วนกลาง)
- `id`: integer (PK)
- `store_name`: text
- `logo_url`: text (Logo ร้าน Smile Seed Bank)
- `contact_email`, `support_phone`, `address`: text

### 2. breeders (ผู้ผลิต)
- `id`: bigint (PK)
- `name`, `logo_url`, `description`: text
- `is_active`: boolean (default: true)

### 3. products (สินค้าหลัก)
- `id`: bigint (PK)
- `breeder_id`: bigint (FK -> breeders.id)
- `name`, `category`: text
- `description_th`, `description_en`: text
- `price`: numeric (Starting Price)
- `stock`: integer (Total Stock)
- `is_active`: boolean
- `image_url`, `image_url_2`, `image_url_3`, `video_url`: text
- *--- AI Extracted Specs ---*
- `thc_percent`, `cbd_percent`: numeric
- `genetics`: text
- `indica_ratio`, `sativa_ratio`: numeric
- `flowering_type`: text (AUTO/PHOTO)
- `seed_type`: text (FEMINIZED/REGULAR)
- `yield_info`, `growing_difficulty`: text
- `effects`, `flavors`, `medical_benefits`: jsonb

### 4. product_variants (แพ็กเกจย่อย)
- `id`: bigint (PK)
- `product_id`: bigint (FK -> products.id)
- `unit_label`: text (e.g., "1 Seed")
- `cost_price`: numeric (ต้นทุนต่อหน่วย - ใช้คำนวณกำไร)
- `price`: numeric (ราคาขายปลีก)
- `stock`: integer
- `is_active`: boolean (default: true)

### 5. discount_tiers & shipping_rules
- **discount_tiers**: `id`, `min_amount`, `discount_percentage`, `is_active`
- **shipping_rules**: `id`, `category_name`, `base_fee`, `free_shipping_threshold`

### 6. promotions & promo_codes
- **promotions**: `id`, `name`, `condition_type`, `condition_value`, `reward_variant_id`, `reward_quantity`, `is_active`
- **promo_codes**: `id`, `code`, `discount_type`, `discount_value`, `min_spend`, `is_active`
- **promo_code_usages**: `id`, `promo_code_id`, `order_id`, `customer_email`, `customer_phone`

### 7. customers (Profiles & Wholesale)
- `id`: uuid (PK -> auth.users.id)
- `full_name`, `email`, `phone`, `address`, `line_user_id`: text
- `is_wholesale`: boolean (default: false)
- `wholesale_discount_percent`: numeric

### 8. orders (ออเดอร์และการเงิน)
- `id`: bigint (PK)
- `order_number`: varchar(6)
- `customer_id`: uuid (FK -> customers.id)
- `order_origin`: text (enum: 'WEB', 'MANUAL')
- `payment_method`: text
- `total_amount`: numeric (ยอดขายสุทธิ)
- `total_cost`: numeric (บันทึกต้นทุนรวม ณ วันที่ขาย)
- `status`: text (PENDING, PAID, SHIPPED, CANCELLED)
- `tracking_number`: text

### 9. blogs (บทความ SEO)
- `id`: bigint (PK)
- `slug`: text (Unique)
- `title`, `title_en`, `excerpt`, `excerpt_en`, `content`, `content_en`: text
- `image_url`, `category`: text
- `view_count`: integer
- `is_published`: boolean

*(Note: Row Level Security (RLS) ต้องเปิดใช้งานทุกตาราง)*