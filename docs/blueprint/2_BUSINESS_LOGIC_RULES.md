# Business Logic Rules (V3.1 Compliance)

## 1. Inventory & Draft Mode
- **Draft Logic:** สามารถบันทึกสินค้าได้แม้ไม่มีราคาหรือ Variant (is_active จะเป็น false อัตโนมัติ)[cite: 5, 8]
- **Hierarchy:** `products` (Parent) -> `product_variants` (Child). ราคาสินค้าหลักคือราคาที่ถูกที่สุดของ Variant[cite: 5, 8]
- **Genetics:** รองรับ Auto, Photo, Photo FF (Fast Flowering), และ Photo 3N (Triploid)[cite: 8]

## 2. Resilience (The 2-Second Rule)
- ข้อมูลประกอบ (Related Products, Ads) ต้องใช้ `withTimeout` ไม่เกิน 2000ms เพื่อไม่ให้บล็อก LCP[cite: 8]

## 3. Auto-Discount & Loyalty
- **Points:** 100 THB = 1 Point. คำนวณจากยอดสุทธิ (Math.floor). แลก 1 Point = 1 THB[cite: 5, 8]
- **Wholesale:** เมื่อลูกค้าระบบ `is_wholesale: true` ล็อกอิน ราคาจะปรับเป็นราคาขายส่งทันที[cite: 5, 8]

## 4. AI & Media
- **AI Scanner:** สกัดข้อมูลแบบ "Read & Discard" (ไม่เก็บรูปต้นฉบับเข้า Storage เพื่อประหยัดพื้นที่)[cite: 8]
- **Watermark:** รูปสินค้าแกลเลอรีจะถูกใส่ Watermark อัตโนมัติที่มุมขวาล่าง[cite: 8]