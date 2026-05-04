# Database Schema & RLS (Supabase)

## Core Tables

### 1. products (Standardized Attributes)
- `id`: bigint (PK)
- `slug`: text (Unique) - ใช้ชื่อสินค้าทำ slug อัตโนมัติ[cite: 6, 8]
- `flowering_type`: `autoflower` | `photoperiod` | `photo_ff` | `photo_3n`[cite: 8]
- `sex_type`: `feminized` | `regular`[cite: 8]
- `is_featured`: boolean, `featured_priority`: int[cite: 8]

### 2. product_variants (Pack Sizes)
- `id`: bigint (PK)
- `cost_price`, `price`: numeric(12,2)[cite: 8]
- `stock`: integer (ใช้ระบบ Atomic Deduction ป้องกันการขายเกิน)[cite: 6, 8]

### 3. customers & orders (CRM Integration)
- `notification_level`: int (0-3) สำหรับระบบทวงสลิปอัตโนมัติ[cite: 8]
- `loyalty_points`: int (default: 0)[cite: 5, 8]

## RLS & Security
- **Storage:** `payment_slips` ต้องเช็ค `auth.uid()` หรือบทบาท ADMIN เท่านั้น[cite: 6, 8]
- **Functions:** ฟังก์ชันคำนวณส่วนลดต้อง REVOKE FROM PUBLIC[cite: 8]