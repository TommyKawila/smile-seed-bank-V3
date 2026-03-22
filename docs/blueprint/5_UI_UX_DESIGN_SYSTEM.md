# UI/UX & Design System (Smile Seed Bank V3)

## 1. Core Design Philosophy (ปรัชญาการออกแบบ)
* **Boutique & Professional:** เน้นความพรีเมียม สะอาดตา น่าเชื่อถือ เหมือนแบรนด์สกินแคร์หรือคาเฟ่สไตล์มินิมอล
* **Mobile-First Approach:** เริ่มต้นการออกแบบหน้าจอจาก Mobile เสมอ (สำหรับฝั่ง Storefront) แล้วค่อยขยายสเกลสำหรับ Tablet และ Desktop
* **Frictionless UX:** ปุ่มกดต้องใหญ่พอสำหรับนิ้วสัมผัส, การนำทางต้องลื่นไหล และมี Cart Sheet (ตะกร้าสินค้าแบบสไลด์ด้านข้าง)

## 2. Color Palette (ชุดสีหลัก)
* **Primary Color:** สี "เขียวตุ่น" หรือ "Sage Green" (`emerald-700` ถึง `emerald-800`) สื่อถึงธรรมชาติและความสงบ
* **Background Color:** สี "ขาว" (`#FFFFFF`) เป็นสีพื้นหลังหลัก เพื่อให้รูปสินค้าโดดเด่น
* **Neutral & Muted Colors:** สี "เทาอ่อน" (`zinc-50` ถึง `zinc-100`) สำหรับพื้นหลังการ์ดสินค้า
* **Text Color:** สี "เทาเข้ม" (`zinc-800` หรือ `zinc-900`) แทนสีดำสนิท เพื่อความสบายตา

## 3. Typography (ฟอนต์ตัวอักษร)
* รองรับ 2 ภาษา (Bilingual)
* **English:** ใช้ฟอนต์ `Inter` (ดูทันสมัย มินิมอล)
* **Thai:** ใช้ฟอนต์ `Prompt` หรือ `Noto Sans Thai` (อ่านง่าย เป็นทางการ)

## 4. Components Style (สไตล์ของ UI Components)
* **Shadcn UI Base:** ปรับแต่งให้ขอบโค้งมนปานกลาง (`rounded-lg` หรือ `rounded-xl`)
* **Shadows:** ใช้เงาแบบ Soft Drop Shadow (`shadow-sm`) เฉพาะเวลา Hover การ์ดสินค้า
* **Buttons:** Primary (พื้นเขียวอักษรขาว), Secondary (พื้นขาวขอบเทา อักษรเทา)
* **Product Card Layout:** มีรูป Logo ของ Breeder แปะซ้อนทับ (Overlay) ที่มุมขวาล่างหรือซ้ายบนของรูปสินค้าหลัก
* **Free Gift Badge:** สินค้าที่เป็นของแถม ต้องมีป้ายโดดเด่น เช่น "🎁 FREE"
* **Pricing UI:** เมื่อมีส่วนลด (Wholesale, Promo, Points) ให้แสดงราคาเดิมขีดฆ่า (strikethrough) แล้วแสดงราคาหลังหักส่วนลดชัดเจน

## 4a. Media & Images
* **WebP compression:** มาตรฐานอัปโหลดรูป — บีบอัด < 200KB
* **Thumbnails:** ขนาด 40x40px สำหรับ grid/list views

## 4b. Grid System (หน้าจัดการ)
* **Filter headers:** ใช้ Card-based layout แบบเดียวกันทุกหน้า (Products, Inventory, POS)

## 5. Hero Section & Micro-Interactions (การเคลื่อนไหวและแอนิเมชัน)
* แนะนำให้ใช้ `framer-motion` ร่วมกับ `tailwindcss-animate`
* **Hero Section:** ตัวหนังสือพาดหัวค่อยๆ Fade-in & Slide-up ภาพพื้นหลังมีการใช้ Ken Burns Effect (Zoom-in ช้าๆ)
* **Hover Effects:** Product Card เมื่อ Hover ให้ภาพดอกกัญชา Scale-up (105%) และแสดง Soft Shadow
* **Cart Sheet:** สไลด์เข้าออกจากขอบจอขวาอย่างนุ่มนวล

## 6. Admin Dashboard UI (ระบบกราฟแสดงผล)
* **Desktop-Optimized:** ออกแบบพื้นที่กว้างเพื่อให้ดูกราฟและตารางข้อมูลได้ถนัด
* ใช้ **Recharts** ในการสร้าง Data Visualization
* **Scorecards (สรุปตัวเลข):** แสดงการ์ดสถิติด้านบน (Revenue, Net Profit, Inventory Value, Total Orders) พร้อมลูกศรบอก % Growth สีเขียว/แดง
* **Charts:** กราฟแท่ง (Bar Chart) แสดงยอดขายเทียบต้นทุน, กราฟวงกลม (Pie Chart) แสดงสัดส่วนยอดขาย B2C และ B2B Wholesale

## 7. Print & Fulfillment UI (การพิมพ์เอกสาร)
* สร้าง Layout สำหรับการพิมพ์โดยเฉพาะโดยใช้ CSS `@media print`
* ซ่อนเมนู Navbar, Sidebar และปุ่มต่างๆ ทั้งหมดเมื่อกดสั่งพิมพ์
* **Shipping Label Layout:** ฟอร์แมตต้องพอดีกับกระดาษเทอร์มอลมาตรฐาน ดึง Logo ร้านจาก `store_settings` มาประทับบนหัวกระดาษเสมอ