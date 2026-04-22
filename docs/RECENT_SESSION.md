# Recent work log (Smile Seed Bank V3)

สรุปงานที่ทำใน session ล่าสุด (อ้างอิงโค้ดใน repo)

## Manual Inventory — PDF (`app/admin/inventory/manual/components/InventoryPdfDocument.tsx`)

- กริดไม่มีคอลัมน์ Photo; ความกว้างรวม 535pt (NO 20, NAME 145, CAT 45, GEN 65, แพ็กละ 65 = Stk 25 + Price 40)
- แถวข้อมูลแพ็กเป็นบรรทัดเดียว (ลบ `packTitleSpacer` / ไม่ซ้อนแนวตั้ง)
- หัวตาราง vs แถว: เส้นแนวตั้งสอดคล้องกัน; zebra; category bar เต็มความกว้าง
- แก้ทับซ้อน Category กับหัวเขียว: เพิ่ม `FIXED_TOP_PT`, ปรับ `fixedTop` padding, `tableHeader` / `catRow`
- Polish: ช่องว่างใต้หัวเขียว, จัดกลางตัวเลขแพ็ก (และปรับกลับตามรอบ polish)

## Manual Inventory — Grid (`app/admin/inventory/manual/page.tsx`)

- คลิก **ชื่อสายพันธุ์** (แถวที่ไม่ใช่ draft): เปิด **Sheet แก้ไข** แทนลิงก์ไป `/product/...`
- ฟอร์ม: Master SKU อ่านอย่างเดียว, ชื่อ / หมวด / ประเภทพันธุกรรม; บันทึก = `syncRowToServer` + อัปเดตแถวใน state
- ลบการโหลดรูปสำหรับ PDF เมื่อตัดคอลัมน์ Photo

## Products admin — crash fix (`lib/product-utils.ts`)

- `isLowStock is not a function`: ไฟล์เคยเหลือแค่ `cleanStrainName` แต่ยังถูก import ว่ามี `computeStartingPrice`, `computeTotalStock`, `isLowStock`
- เพิ่มและ export ฟังก์ชันจริง: `computeTotalStock`, `computeStartingPrice`, `isLowStock` (รองรับ `null`/`undefined` สำหรับ stock)

## Hooks

- `hooks/useProducts.ts` — re-export จาก `product-utils` ใช้งานได้หลังแก้ไฟล์ด้านบน

---

## Storefront — Shop / catalog UI (22 เม.ย. 2026)

### Control center (search + งบประมาณ)

- `app/(storefront)/shop/page.tsx`: ห่อช่องค้นหา + ปุ่ม Filters + แถวชิปราคาในกล่องเดียว (`rounded-2xl`, `border-zinc-200/60`, `bg-white`, `shadow-sm`); ปรับ `Input` / ปุ่มเป็น `rounded-xl`
- `components/storefront/ShopPriceFilter.tsx`: ชิป `rounded-lg`, สี idle/selected แบบ emerald อ่อน, label “งบประมาณ” + divider (desktop), เลื่อนแนวนอน + fade ขอบ; แท็ก “กำหนดเอง” ให้เข้าชุด

### Compact controls — 2 แถว

- แถว 1: ค้นหา + Filters (กระชับ `h-9`, padding กล่องลดลง)
- แถว 2: `overflow-x-auto` รวม **ประเภทเมล็ด** (`BreederTypeFilter` `appearance="chips"`) + เส้นแบ่ง `w-px h-6` + **ชิปราคา** (`ShopPriceChipsRow` `compact` + `showBahtGlyph` แทนป้ายงบ)
- `components/storefront/BreederTypeFilter.tsx`: โหมด `chips` — ปุ่มเล็กสไตล์เดียวกับชิปราคา, ไม่มีไอคอน, `display: contents` ให้อยู่แถวเลื่อนเดียวกัน
- `ShopPriceChipsRow`: props `compact` / `showBahtGlyph`; ขนาด `chipBaseCompact` สำหรับแถวรวม

### Header แคตตาล็อก (fallback ไม่มี vault hero)

- `shop/page.tsx`: ตัด eyebrow “คลังพันธุกรรม” และคำอธิบายยาว; หัวข้อเดียว **“คลังเมล็ดพันธุ์รวมทุกค่าย”** (EN: *Seed vault — all breeders*) + จำนวน inline `(n รายการ)` สี `text-zinc-400` `text-sm`; ลด `py` หัวข้อ `text-xl` / `sm:text-2xl` `font-sans` `font-bold`
- หน้า `/seeds` ยัง re-export `shop/page.tsx` — ได้การเปลี่ยนแปลงเดียวกัน

งานอื่นใน repo วันเดียวกัน (เช่น clearance, homepage, prisma, locales) ให้ดูสรุปจาก `git status` / diff ประกอบ

---

*อัปเดต: 22 เม.ย. 2026*
