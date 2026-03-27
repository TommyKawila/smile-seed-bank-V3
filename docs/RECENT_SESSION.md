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

*อัปเดต: มีนาคม 2026*
