# UI/UX & Design System (Smile Seed Bank V3)

## 1. Core Design Philosophy (ปรัชญาการออกแบบ)
* **Premium Eco-Clinical (Teal + Lavender):** ภาพลักษณ์แบรนด์ผสมความเป็นธรรมชาติระดับคลินิก/วิจัย (Teal) กับความทันสมัยแบบไลฟ์สไตล์พรีเมียม (Lavender) — ไม่ใช้คำว่า Sage & Emerald หรือ Green-based เป็นชื่อธีมหลักอีกต่อไป
* **Boutique & Professional:** เน้นความพรีเมียม สะอาดตา น่าเชื่อถือ เหมือนแบรนด์สกินแคร์หรือคาเฟ่สไตล์มินิมอล
* **Mobile-First Approach:** เริ่มต้นการออกแบบหน้าจอจาก Mobile เสมอ (สำหรับฝั่ง Storefront) แล้วค่อยขยายสเกลสำหรับ Tablet และ Desktop
* **Frictionless UX:** ปุ่มกดต้องใหญ่พอสำหรับนิ้วสัมผัส, การนำทางต้องลื่นไหล และมี Cart Sheet (ตะกร้าสินค้าแบบสไลด์ด้านข้าง)

## 2. Color Palette — Premium Eco-Clinical (Teal + Lavender)

ธีมหลักของ Smile Seed Bank V3 คือ **Premium Eco-Clinical** — ผสม **Deep Forest Teal** (ความน่าเชื่อถือ สถาบันวิจัย ความมั่นคง) กับ **Rich Lavender** (ความทันสมัย พรีเมียม ไลฟ์สไตล์ระดับไฮเอนด์), **Vibrant Electric Mint** สำหรับแถบพันธุกรรม Sativa, และ **Fresh Mint** สำหรับจุดเน้นเบาๆ ที่ต้องการความสดชื่นและสะอาดตา

### Design principles (หลักการออกแบบ)
* **Teal แทน Emerald ในการสื่อสารแบรนด์:** เอกสารและ UI ให้อ้างอิง **Deep Forest Teal** เป็นสีเขียวหลัก — ไม่ใช้คำว่า Sage/Emerald เป็นชื่อธีมหลัก และในโค้ดให้ใช้คลาส **semantic** (`primary`, `accent`) แทนการ hard-code `emerald-*`
* **Semantic tokens:** ความยืดหยุ่นของระบบมาจาก **ตัวแปร HSL ใน `:root`** + `tailwind.config.ts` — หลีกเลี่ยง HEX ตรงๆ สำหรับสีแบรนด์หลัก
* **Border radius:** ใช้ **`0.75rem`** เป็นหลัก ให้ UI ดูนุ่มนวลและทันสมัย (Modern Rounded)

### Primary — Deep Forest Teal
* **HSL:** `162 70% 22%` — ใช้เป็นสีแบรนด์หลัก (ปุ่มหลัก, ลิงก์เน้น, โฟกัส, แหวนโฟกัส)
* **Foreground:** `0 0% 98%` — ข้อความบนพื้น primary
* **หมายเหตุการออกแบบ:** อ้างอิงเฉด **Teal** เป็นหลัก ไม่ใช้ชุด **Emerald** เป็นชื่อธีมหลักอีกต่อไป (ในโค้ดใช้คลาส semantic เช่น `bg-primary`, `text-primary`)

### Secondary — Rich Lavender + Deep Lavender (Brand palette)
* **พื้น (`--secondary`, Rich Lavender):** `HSL 255 55% 90%` — พื้นรอง, แพนเนลรอง, แถบพันธุกรรม **Indica** (`bg-secondary`), chip CBD / โซนรองที่ต้องการความนุ่มแต่มองเห็นชัดขึ้นกว่าโทน lavender จางๆ
* **ข้อความบนพื้นรอง (`--secondary-foreground`, Deep Lavender):** `HSL 255 45% 35%` — หัวข้อรอง, ป้ายบน secondary, ข้อความที่ต้องอ่านชัดบน secondary
* **การใช้งาน:** ใช้คู่กับ Teal เพื่อสร้างความ contrast ที่ดูพรีเมียม; แถบ Indica ใช้ glow แบบ `hsl(var(--secondary) / 0.5)` เพื่อให้ lavender โผล่บนพื้นสว่าง

### Sativa bar — Vibrant Electric Mint (Brand palette)
* **Token (`--sativa`):** `HSL 158 95% 45%` — ใช้เฉพาะแถบพันธุกรรม **Sativa** ใน `components/storefront/ProductSpecs.tsx` (`bg-sativa` ใน `tailwind.config.ts` → `hsl(var(--sativa))`)
* **Glow (UI):** เงาแบบ `hsl(var(--sativa) / 0.4)` รอบแถบ Sativa เพื่อให้รู้สึก “มีพลัง” และแยกจากพื้น muted; จับคู่กับแถบ Indica (z-index: Sativa ทับเล็กน้อยที่ขอบต่อ)

### Accent — Fresh Mint
* **HSL:** `158 60% 94%` — พื้นที่เน้นเบาๆ, chip/tag รอง, hover บางจุด
* **Accent foreground:** จับคู่กับสี primary (Teal) เพื่อให้อ่านง่าย

### Neutrals (คงเดิม)
* **Background:** ขาวเกือบเต็มที่ (`#FFFFFF` / HSL ใน `:root`)
* **Muted / Card / Border / Text:** ยังใช้สเกล **Zinc** (`zinc-50`–`zinc-900`) สำหรับขอบ การ์ด และข้อความ body

### Semantic colors & tokens (โค้ดจริง)
* ค่าสีหลักถูกกำหนดเป็น **ตัวแปร HSL ใน `app/globals.css` (`:root`)** แล้ว map ใน **`tailwind.config.ts`** เป็น `hsl(var(--primary))`, `hsl(var(--secondary))`, `hsl(var(--accent))`, **`hsl(var(--sativa))`** (แถบ Sativa เท่านั้น) ฯลฯ
* **ห้ามพึ่ง HEX ตรงๆ ในธีมหลัก** — ใช้คลาส semantic (`primary`, `secondary`, `accent`, `muted`, `destructive`, …) เพื่อให้เปลี่ยนธีมหรือปรับโทนได้จากจุดเดียว

### Border radius (Modern Rounded)
* **`--radius: 0.75rem`** — มุมมนระดับทันสมัย นุ่มนวล; Tailwind ใช้ `rounded-lg` ผูกกับ `var(--radius)` ตาม config

## 3. Typography (ฟอนต์ตัวอักษร)
* รองรับ 2 ภาษา (Bilingual)
* **English:** ใช้ฟอนต์ `Inter` (ดูทันสมัย มินิมอล)
* **Thai:** ใช้ฟอนต์ `Prompt` หรือ `Noto Sans Thai` (อ่านง่าย เป็นทางการ)

## 4. Components Style (สไตล์ของ UI Components)
* **Shadcn UI Base:** ขอบโค้งตาม **`--radius` (0.75rem)** — ใช้ `rounded-lg` / `rounded-xl` ตาม layer ของ component
* **Shadows:** เงาแบบ Soft (`shadow-sm`) เน้นตอน Hover การ์ดสินค้า
* **Buttons**
  * **Primary:** `bg-primary` + `text-primary-foreground` — โทน **Deep Forest Teal** (ไม่ใช้ `bg-emerald-*` ตรงๆ)
  * **Secondary (Shadcn variant):** `bg-secondary` + `text-secondary-foreground` — โทน **Lavender** สำหรับปุ่มรองที่ต้องดูพรีเมียม
  * **Outline / Ghost:** ขอบ `border-border` หรือ hover บน `accent` ตามบริบท
* **Badges & Tags:** แบรนด์หลักใช้ **`primary` / `primary/10`** กับข้อความ `text-primary`; โซน AI / แพนเนลรองที่ต้องการความนุ่มใช้ **`secondary` / `secondary-foreground`**; พื้นที่เน้นเบา (เช่น แถบสเปก) ใช้ **`accent` + `text-accent-foreground` / `text-primary`** ให้สอดคล้องกับการ refactor ใน `app/` และ `components/`
* **Product Card Layout:** มีรูป Logo ของ Breeder แปะซ้อนทับ (Overlay) ที่มุมขวาล่างหรือซ้ายบนของรูปสินค้าหลัก
* **Free Gift Badge:** สินค้าที่เป็นของแถม ต้องมีป้ายโดดเด่น เช่น "🎁 FREE" (ยังใช้โทน amber ตามความจำเป็นเพื่อความโดดเด่น)
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
* **Scorecards (สรุปตัวเลข):** แสดงการ์ดสถิติด้านบน (Revenue, Net Profit, Inventory Value, Total Orders) พร้อมลูกศรบอก % Growth — ใช้โทน positive/negative ที่สอดคล้องธีม (เช่น primary/teal สำหรับขึ้น, แดงสำหรับลง)
* **Charts:** กราฟแท่ง (Bar Chart) แสดงยอดขายเทียบต้นทุน, กราฟวงกลม (Pie Chart) แสดงสัดส่วนยอดขาย B2C และ B2B Wholesale

## 7. Print & Fulfillment UI (การพิมพ์เอกสาร)
* สร้าง Layout สำหรับการพิมพ์โดยเฉพาะโดยใช้ CSS `@media print`
* ซ่อนเมนู Navbar, Sidebar และปุ่มต่างๆ ทั้งหมดเมื่อกดสั่งพิมพ์
* **Shipping Label Layout:** ฟอร์แมตต้องพอดีกับกระดาษเทอร์มอลมาตรฐาน ดึง Logo ร้านจาก `store_settings` มาประทับบนหัวกระดาษเสมอ