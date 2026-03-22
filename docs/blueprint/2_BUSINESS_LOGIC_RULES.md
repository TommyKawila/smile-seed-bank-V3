# Business Logic Rules (Smile Seed Bank V3)

## 1. Product & Variant Relation (โครงสร้างสินค้าหลักและแพ็กเกจ)
* **Insertion Flow:** ต้องสร้างข้อมูล Parent (`products`) ก่อน แล้วนำ ID ไปผูกสร้าง Child (`product_variants`) ใน Transaction เดียวกัน
* **Pricing:** ราคาขายจริงอยู่ที่ `variants.price` ส่วน `products.price` (ราคาเริ่มต้น) ให้ระบบคำนวณจาก Variant ที่ถูกที่สุดอัตโนมัติ
* **Stock Management:** จำนวนสต็อกรวม (`products.stock`) คำนวณอัตโนมัติจากผลรวมของทุก Variants ในหน้า Admin หากสต็อก <= 5 ให้แสดงแจ้งเตือนตัวสีแดง

## 2. Visibility & Status Control (การเปิด/ปิดการขาย)
* **Master Switch:** `products.is_active` ควบคุมการแสดงผลของสินค้าหลัก ถ้ายกเลิก จะซ่อนทั้งหมด
* **Package Switch:** `product_variants.is_active` สามารถเลือกปิดการขายเฉพาะบางแพ็กเกจย่อยได้ (เช่น ปิดแค่แพ็ก 10 seeds)

## 3. Auto-Discount Logic (ส่วนลดขั้นบันได)
* คิดจากยอด Subtotal ของสินค้าในตะกร้า เทียบกับตาราง `discount_tiers`
* ระบบจะเลือกส่วนลดที่ให้เปอร์เซ็นต์สูงสุดเพียงขั้นเดียว (Highest Tier)
* ต้องมีข้อความ Upselling กระตุ้นยอดขายในตะกร้า (เช่น "ซื้ออีก 500 บ. เพื่อลด 15%")

## 4. Category-Based Shipping (ค่าจัดส่งตามหมวดหมู่)
* การคิดค่าส่งและเงื่อนไขส่งฟรี (Free Shipping Threshold) อิงตามหมวดหมู่ (เช่น 'Seeds') เพื่อรองรับสินค้าน้ำหนักเยอะในอนาคต
* ถ้ายอดถึงเกณฑ์ ให้แสดงค่าส่งเป็น 0 บาท (Free) ชัดเจนในหน้า Checkout

## 5. Free Gift & Promotional Logic (ของแถมอัตโนมัติ)
* เงื่อนไข (Triggers) ได้แก่: ยอดซื้อขั้นต่ำ, ช่วงเวลา, หรือ ช่องทางชำระเงิน (เช่น จ่าย Crypto แถมเมล็ด)
* ของแถมจะถูกเพิ่มลงตะกร้าอัตโนมัติ (ราคา ฿0) ล็อกจำนวนไว้ และเมื่อจ่ายเงินสำเร็จจะไปตัดสต็อกจริงในตาราง `product_variants`

## 6. Promo Code & Anti-Abuse (โค้ดส่วนลดและกันสแปม)
* ใช้งานได้ 1 ครั้ง / 1 ลูกค้า / 1 โค้ด
* ระบบต้องตรวจสอบการใช้งานซ้ำซ้อนจาก **Email** หรือ **เบอร์โทรศัพท์** ในตาราง `promo_code_usages` อย่างเข้มงวด

## 7. Order Tracking & Line Handoff (แจ้งเตือนผ่าน Line OA)
* สร้าง Order Number (6 หลัก) หลังชำระเงิน
* หน้า Success Page มีปุ่มแอด Line พร้อม Pre-fill ข้อความเลข Order
* เมื่อ Admin กด "Shipped" พร้อมใส่เลขพัสดุ ระบบจะ Push Message แจ้ง Tracking ทาง Line ทันที

## 8. Authentication & Profile (ระบบสมาชิก)
* Login ผ่าน Google และ Line (Supabase Auth)
* ระบบจดจำชื่อ เบอร์โทร และที่อยู่ล่าสุด เพื่อนำไป Auto-fill ในหน้า Checkout
* ลูกค้าสามารถเช็ค Order History ย้อนหลังได้

## 9. Blog & SEO (ระบบบทความ 2 ภาษา)
* รองรับ TH/EN มีฟิลด์ `slug` สำหรับ URL
* ใช้ Next.js Metadata API ดึง Title, Excerpt, Cover Image ไปทำ SEO และ Open Graph (OG)

## 10. Breeder & Brand Management (ระบบจัดการแบรนด์)
* มีตาราง `breeders` เก็บโลโก้แบรนด์ 
* หน้ารวมสินค้า จะนำรูปโลโก้มาวางซ้อนทับ (Overlay) รูปสินค้าหลักมุมใดมุมหนึ่งอัตโนมัติ

## 11. AI-Powered Product Extraction (สกัดข้อมูลสินค้าด้วย AI)
* Admin วาง Text ดิบจากเว็บนอกลงในระบบ
* AI (Prompt API) สกัดข้อมูลเป็น JSON ถมลงฟอร์มอัตโนมัติ ได้แก่ THC, CBD, Lineage, Indica/Sativa, Yield, Terpenes, Effects 
* AI ช่วยแต่งคำบรรยายสินค้า (Rewrite) ใหม่เป็น TH/EN เพื่อผลลัพธ์ที่ดีทาง SEO

## 12. B2B Wholesale & Custom Order (ระบบขายส่งและออเดอร์แมนนวล)
* **Wholesale Account:** Admin สามารถตั้งค่าบัญชีลูกค้าให้เป็น `is_wholesale = true` พร้อมกำหนดเปอร์เซ็นต์ส่วนลด (เช่น 30%) เมื่อลูกค้ารายนี้ Login เข้าเว็บ ระบบจะปรับราคาสินค้าทุกชิ้นเป็นราคาขายส่งอัตโนมัติ
* **Manual Order (POS):** Admin สามารถสร้างออเดอร์เองจากระบบหลังบ้าน (สำหรับลูกค้าที่สั่งนอกเว็บ) พร้อมสร้าง Invoice ส่งให้ลูกค้าได้

## 12a. Loyalty Points (คะแนนสะสมและแลกส่วนลด)
* **Earn:** 100 THB = 1 Point — คำนวณจากยอดสุทธิที่ชำระจริง (หลังหักส่วนลดคะแนน) ใช้ `Math.floor(amount / 100)`
* **Redeem:** 1 Point = 1 THB — ใช้แลกส่วนลดได้ไม่เกินยอดคงเหลือและไม่เกินยอดรวมออเดอร์
* Points เก็บใน Customer profile; Order บันทึก `points_redeemed` และ `points_discount_amount` สำหรับบัญชี

## 12b. Tiered Pricing (ราคาตาม Tier)
* **Wholesale default:** ส่วนลด 20% (ปรับได้ต่อลูกค้า via `wholesale_discount_percent`)
* **Switch Tier:** เมื่อเปลี่ยนลูกค้า (Retail ↔ Wholesale) ต้อง clear cart หรือ re-validate ราคาในตะกร้า

## 12c. Genetics Mapping (ประเภทพันธุกรรม)
* ค่าในระบบ: `Mostly Indica`, `Mostly Sativa`, `Hybrid 50/50`
* ใช้ใน Product, Manual Grid, POS filter, และ AI Extract

## 12d. Soft Delete (ลูกค้าไม่ลบถาวร)
* ลูกค้าไม่มีการ hard-delete — ใช้ `is_active: false` เพื่อเก็บประวัติออเดอร์

## 13. Financial Analytics Dashboard (ระบบวิเคราะห์การเงินและกราฟ)
* ระบบ Dashboard ของ Admin จะใช้ Recharts แสดงผลกราฟภาพรวม
* ตัวชี้วัดหลัก: ยอดขายรวม (Revenue), ต้นทุนสินค้า (COGS), กำไรสุทธิ (Net Profit), และ มูลค่าสินค้าคงคลัง (Inventory Value)

## 14. Fulfillment & Printing (ระบบพิมพ์ใบแพ็กของและใบปะหน้า)
* **Packing Slip:** พิมพ์รายการสินค้าเพื่อจัดของ
* **Shipping Label:** พิมพ์ใบปะหน้ากล่อง จัด Layout ให้พอดีกับกระดาษสติ๊กเกอร์เครื่องพิมพ์ความร้อน (Thermal Printer)

## 15. Centralized Branding (ระบบจัดการโลโก้และข้อมูลร้าน)
* มีเมนู Store Settings ให้ Admin อัปโหลด Logo หลัก (Smile Seed Bank) 
* โลโก้นี้จะถูกนำไปฝัง (Dynamic Render) ในหัวกระดาษ Invoice, อีเมลแจ้งเตือน, และ Line Flex Message

## 16. Multi-Channel Notifications (ระบบแจ้งเตือน Email & Line)
* เมื่อสั่งซื้อสำเร็จ ลูกค้าจะได้รับ Email สรุปออเดอร์ และ Line Message
* เมื่อ Admin กด Shipped ระบบจะส่ง Email และ Line แจ้งเลขพัสดุ (Tracking) พร้อมลิงก์เช็คสถานะ