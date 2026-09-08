/** Reply to Green Future GF/SSB/2026-0907 — not a PO */

import { GF_0907, GF_LABELLED_MOCK_POUCH_REQUEST_EN, GF_LABELLED_MOCK_POUCH_REQUEST_TH } from "@/lib/green-future-0907";
import {
  GF_PO_GATE_LETTER_EN,
  GF_PO_GATE_LETTER_TH,
} from "@/lib/green-future-po-gate";

export const GREEN_FUTURE_0907_REPLY_SUBJECT =
  "Re: Follow-up — Label V.2.1, Traceability, Packaging Test, Updated Quotation (Ref. GF/SSB/2026-0907)";

export const GREEN_FUTURE_0907_REPLY_TH_SUBJECT =
  "ตอบ: ฉลาก V.2.1, Traceability, ทดสอบบรรจุภัณฑ์ และใบเสนอราคา (อ้างอิง GF/SSB/2026-0907)";

const q = GF_0907.quotationOption1;

export const GREEN_FUTURE_0907_REPLY_RAW = `Subject: ${GREEN_FUTURE_0907_REPLY_SUBJECT}

T.M.Y Agro Trade Limited Partnership, trading as Smile Seed Bank
161 Moo 16, Mae Sao, Mae Ai, Chiang Mai 50280, Thailand
To: Green Future (Global) Co., Ltd. · info@greenfuture.global · via Julia
Ref. GF/SSB/2026-0907 · Version 1.2 · 7 September 2026

Dear Yevhen, Julia, and the Green Future Team,

Thank you for GF/SSB/2026-0907 dated 7 September 2026 and the updated Option 1 quotation (Invoice ${q.invoiceNo}).

This letter is not a purchase order or binding commitment to buy.

---

1) Label V.2.1 — accepted

We confirm receipt of your approval of Label V.2.1, including the physical print test at 55 × 55 mm. We understand the variable fields (Variety, Lot No., Test Date, Expiry Date) and that the fixed layout is approved.

Our sample pouches and the approved label artwork for heat-seal testing are currently with Green Future. For the next regulatory step on our side, please arrange the following after your seal test:

${GF_LABELLED_MOCK_POUCH_REQUEST_EN}

Please confirm the dispatch timing and the number of mock-up units you can return.

---

2) Traceability — one wording change applied

We have updated our wholesale compliance wording to match your requested text:

“${GF_0907.traceability.newWording}”

All other Traceability elements remain as previously agreed. The public page stays Preview until the first actual lot is imported and Green Future gives separate written approval to move Preview → Live.

---

3) Updated Quotation — Option 1 confirmed

We confirm the updated quotation matches Smile Seed Bank’s Option 1 requirements:

• 5 varieties × 200 seeds = 1,000 seeds
• 4 packs × 50 seeds per variety / 20 sealed units in total
• THB ${q.pricePerSeedThb} per seed · seed subtotal THB ${q.seedSubtotalThb.toLocaleString("en-US")}
• Official laboratory COA not included · seeds supplied first
• Retail packaging for 20 pilot-order units free of charge (one-time exception)
• 50% advance THB ${q.advanceThb.toLocaleString("en-US")} after PO confirmation · remaining 50% before shipment

The quotation is valid until ${q.validUntil}. We understand Green Future will issue revised seed pricing after that date rather than extending the current figures. We confirm the Option 1 configuration above is correct on the current quotation; we will reconfirm availability and the updated price in writing before any purchase order, per our locked sequence below.

---

4) Facility photographs — received

We confirm receipt of the six watermarked facility photographs previously provided and have stored them in our admin partner file. We will use them only for approved purposes and with Green Future’s prior written permission per image.

---

5) GACP authority consultation — in progress

Thank you for confirming that Smile Seed Bank may proceed with consultation with the relevant government authority. We are preparing the supporting document pack and will send Green Future a copy of the written response or confirmation received from the authority when available.

This consultation depends on receiving the labelled mock-up pouches described in section 1 above.

---

6) Sequence before any payment or PO (locked)

${GF_PO_GATE_LETTER_EN}

---

Next steps — Smile Seed Bank

1. Receive labelled mock-up pouches from Green Future (no real seeds inside) after heat-seal test
2. Consult the Chiang Mai authority on SGF Seeds + lot/traceability documents for grower GACP applications
3. Await Green Future’s revised seed pricing after ${q.validUntil} and reconfirm before any PO
4. Keep Traceability in Preview until first-lot import + written Live approval

Thank you for the clear follow-up.

Prepared by Smile Seed Bank / T.M.Y Agro Trade Limited Partnership
www.smileseedbank.com
`;

export const GREEN_FUTURE_0907_REPLY_TH_RAW = `Subject: ${GREEN_FUTURE_0907_REPLY_TH_SUBJECT}

หจก. ทีเอ็มวาย อะโกร เทรด ภายใต้แบรนด์ Smile Seed Bank
161 หมู่ 16 แม่สาว แม่อาย เชียงใหม่ 50280
ถึง: Green Future (Global) Co., Ltd. · info@greenfuture.global · ผ่านคุณจูเลีย
อ้างอิง GF/SSB/2026-0907 · เวอร์ชัน 1.2 · 7 กันยายน 2569

เรียน คุณเยฟเฮน คุณจูเลีย และทีม Green Future

ขอบคุณสำหรับจดหมาย GF/SSB/2026-0907 ลงวันที่ 7 กันยายน 2569 และใบเสนอราคา Option 1 ฉบับแก้ (Invoice ${q.invoiceNo})

จดหมายฉบับนี้ไม่ใช่ใบสั่งซื้อหรือคำมั่นผูกพันในการซื้อ

---

1) ฉลาก V.2.1 — รับการอนุมัติแล้ว

เรารับทราบการอนุมัติฉลาก V.2.1 รวมผลทดสอบพิมพ์จริงขนาด 55 × 55 มม. เข้าใจฟิลด์ที่เปลี่ยนตามล็อต (Variety, Lot No., Test Date, Expiry Date) และโครงสร้างคงที่ที่อนุมัติแล้ว

ซองตัวอย่างและไฟล์ฉลากที่อนุมัติสำหรับทดสอบ heat seal อยู่ที่ Green Future ในขั้นตอนกฎระเบียบถัดไปฝั่งเรา กรุณาดำเนินการดังนี้หลังทดสอบซีล:

${GF_LABELLED_MOCK_POUCH_REQUEST_TH}

กรุณายืนยันกำหนดส่งคืนและจำนวนซอง mock-up ที่ส่งได้

---

2) Traceability — แก้ถ้อยคำ 1 จุดแล้ว

เราได้ปรับข้อความบนหน้า wholesale ให้ตรงตามที่ขอ:

“เมล็ดบรรจุและซีลโดย SGF SEEDS ผู้รวบรวมเมล็ดพันธุ์ควบคุมเพื่อการค้าที่ได้รับอนุญาต — Smile Seed Bank ไม่เปิด แบ่ง หรือเปลี่ยนฉลากโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร”

ส่วนอื่นของ Traceability ยังตามที่ตกลง หน้าสาธารณะยังเป็น Preview จนกว่าจะนำเข้าล็อตจริงรอบแรก และ Green Future อนุมัติ Preview → Live เป็นลายลักษณ์อักษร

---

3) ใบเสนอราคา Option 1 — ยืนยันถูกต้อง

เรายืนยันใบเสนอราคาฉบับแก้ตรง Option 1 ที่เราขอ:

• 5 สาย × 200 เมล็ด = 1,000 เมล็ด
• 4 ซอง × 50 เมล็ด / สาย = 20 ซองซีล
• ${q.pricePerSeedThb} บาท/เมล็ด · รวมเมล็ด ${q.seedSubtotalThb.toLocaleString("en-US")} บาท
• ไม่รวม COA แล็บทางการ · ส่งเมล็ดก่อน
• ซองขายปลีก 20 ใบ ฟรีครั้งนี้
• มัดจำ 50% ${q.advanceThb.toLocaleString("en-US")} บาท หลังคอนเฟิร์ม PO · อีก 50% ก่อนส่งของ

ใบเสนอราคาใช้ได้ถึง ${q.validUntil} เรารับทราบว่า Green Future จะออกราคาเมล็ดฉบับใหม่หลังวันดังกล่าว แทนการต่ออายุตัวเลขเดิม เรายืนยันรูปแบบ Option 1 ข้างต้นถูกต้องตามใบปัจจุบัน และจะยืนยันสต็อกกับราคาที่อัปเดตเป็นลายลักษณ์อักษรก่อนออก PO ตามลำดับ Gate ด้านล่าง

---

4) รูปสถานที่ — รับแล้ว

เรายืนยันได้รับรูป 6 ภาพที่มีลายน้ำ Green Future แล้ว และเก็บในไฟล์คู่ค้า admin จะใช้เฉพาะตามวัตถุประสงค์ที่อนุมัติและอนุญาตรายภาพเป็นลายลักษณ์อักษร

---

5) ปรึกษาหน่วยงาน GACP — กำลังดำเนินการ

ขอบคุณที่ยืนยันให้ Smile Seed Bank ปรึกษาหน่วยงานที่เกี่ยวข้องได้ เรากำลังจัดแฟ้มเอกสารประกอบ และจะส่งสำเนาคำตอบหรือการยืนยันจากหน่วยงานให้ Green Future เมื่อได้รับ

การสอบถามนี้ต้องใช้ซอง mock-up ติดฉลากจริงตามข้อ 1 ด้านบน

---

6) ลำดับก่อนโอนเงินหรือออก PO (ล็อกแล้ว)

${GF_PO_GATE_LETTER_TH}

---

งานถัดไปของ Smile Seed Bank

1. รอรับซอง mock-up ติดฉลาก V.2.1 จาก Green Future (ไม่ใส่เมล็ดจริง) หลังทดสอบ heat seal
2. สอบถามหน่วยงานเชียงใหม่เรื่อง SGF Seeds + เอกสารล็อต/Traceability สำหรับคำขอ GACP ของผู้ปลูก
3. รอใบราคาเมล็ดฉบับใหม่จาก Green Future หลัง ${q.validUntil} และยืนยันก่อน PO
4. คง Traceability เป็น Preview จนกว่าล็อตแรก + อนุมัติ Live

ขอบคุณสำหรับการติดตามที่ชัดเจน

จัดทำโดย Smile Seed Bank / หจก. ทีเอ็มวาย อะโกร เทรด
www.smileseedbank.com
`;
