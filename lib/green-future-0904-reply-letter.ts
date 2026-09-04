/** Reply to Green Future GF/SSB/2026-0904 — not a PO */

import {
  GF_PO_GATE_LETTER_EN,
  GF_PO_GATE_LETTER_TH,
} from "@/lib/green-future-po-gate";
import {
  gfPhotoPicksLetterEn,
  gfPhotoPicksLetterTh,
} from "@/lib/green-future-photo-request";

export const GREEN_FUTURE_0904_REPLY_SUBJECT =
  "Re: Confirmation and Response — Traceability, Label V.2, Lead Registration & Quotation (Ref. GF/SSB/2026-0904)";

export const GREEN_FUTURE_0904_REPLY_TH_SUBJECT =
  "ตอบ: ยืนยัน Traceability, ฉลาก V.2, Lead Registration และใบเสนอราคา (อ้างอิง GF/SSB/2026-0904)";

export const GREEN_FUTURE_0904_REPLY_RAW = `Subject: ${GREEN_FUTURE_0904_REPLY_SUBJECT}

T.M.Y Agro Trade Limited Partnership, trading as Smile Seed Bank
161 Moo 16, Mae Sao, Mae Ai, Chiang Mai 50280, Thailand
To: Green Future (Global) Co., Ltd. · info@greenfuture.global · via Julia
Ref. GF/SSB/2026-0904 · Version 1.2 · 4 September 2026

Dear Yevhen, Julia, and the Green Future Team,

Thank you for GF/SSB/2026-0904 dated 4 September 2026, and for the accompanying TH GACP traceability deck, seed production process photo set, and Quotation V01.

This letter is not a purchase order or binding commitment to buy.

---

1) Traceability Pack — accepted, stay in Preview

We confirm:
• The Traceability page remains Preview only until the first actual lot is imported and tested and Green Future gives separate written approval to move Preview → Live.
• The English disclaimer is accepted, subject to Julia’s final check that the English and Thai on the page match the wording previously agreed.
• Public Tier and Restricted Tier structure is accepted.
• For the first shipment, Green Future will provide the primary signed Lot/Traceability PDF plus a CSV (or mutually agreed import file). Smile Seed Bank will import and display approved data only. We will not modify or sign the primary PDF on behalf of Green Future.
• Lot/Batch No. will be identical across pouch label, PDF, import file, and Traceability lookup.
• Restricted access: QR/token per lot and an authorised customer account, where technically practical.
• Audit log retention: at least three (3) years from last modification of the record or closure of the lot, or longer if law or contract requires.

We will not treat the preview URL as a customer launch.

---

2) Packaging samples

We note Green Future has received 12 packaging samples and is testing seal, seal strength/quality, and suitability for the intended seed quantity.

We understand the 5.5 × 5.5 cm label placement and legibility test remains pending until an approved Label V.2 mock-up is printed. We await written feedback when the physical test is complete.

---

3) Farm and facility photographs

We accept the photograph-use terms: each photograph requires separate written approval from Green Future before use. We will apply a Green Future watermark as recommended.

We revise item C as requested to:
“Seed production/processing area within the GACP-certified production facility.”

Thank you for offering files from the Seed Production & Handling Process presentation. Please send high-resolution separate files, with written approval per image and a Green Future watermark, for:

${gfPhotoPicksLetterEn()}

We do not need hygiene/UV, seed-soaking, close flowering, or nutrient-room images for first-round marketing.

We have received the TH GACP visual process map and the seed production & handling photo set. We understand these document facility-level controls and TH GACP of the certified production facility — they are not a GACP certificate of any seed lot. Smile Seed Bank will not present them as a seed-lot GACP certificate. Use is limited to the Green Future documented seed programme, and only after per-image written approval.

---

4) Lead Registration

We agree with the principle and with your clarifications:
• Protection applies to customers genuinely introduced by Smile Seed Bank.
• It does not apply to customers with whom Green Future had documented relations before registration, or who independently contacted Green Future before registration.
• Necessary technical, compliance or quality communication with registered customers may take place with Smile Seed Bank informed/copied and is not circumvention.
• The detailed protection period and mechanism will be written into the Distribution Agreement.
• Green Future will not use registered leads to bypass Smile Seed Bank during the agreed protection period.

Until the Distribution Agreement is signed, we will operate the email registration process proposed in our 1 September letter (entity, licence if available, province, date, status), with Green Future acknowledgement in writing.

---

5) Label V.2.1 — PDF attached (no login)

We agree the Regulatory Gate: a specific label version, written approval by both parties, and a physical packaging test before final printing.

Following Julia’s note of 4 September 2026, we have changed the date field from “วันที่รวบรวม/นำเข้า” / “Collection/Import” to “วันที่รวบรวม” / “Date of Collection” only. The attached PDF is this revised Label V.2.1.

The previous admin preview required login. We also send a public share URL (no login) in the same email. Please do not use the password-protected admin preview link.

Please confirm in writing: field completeness (including Collection Source), Date of Collection as MM/YYYY, test date as DD/MM/YYYY, expiry as MM/YYYY, and whether a seller Por.Por. 4 line should appear on the rear label or on invoice/traceability only.

---

6) Quotation — configuration confirmed; please issue the Option 1 revision

We confirm the configuration stated in GF/SSB/2026-0904:
5 strains × 4 × 50 seeds = 1,000 seeds / 20 sealed units, Option 1, official COA to follow later; THB; 14-day validity; EUR/THB rule stated; Packaging & Processing shown separately or clearly included; quotation does not reserve stock; availability and price reconfirmed before PO.

The file “Quotation V01 TMY Agro” attached to your packet is still Pro Forma Invoice 20102618 dated 26 August 2026 (valid until 9 September 2026). It still includes a laboratory COA line on AF102 and a 50% advance due before laboratory testing. That is not yet the Option 1 quotation described in your letter.

Please issue the updated Quotation that matches Option 1 (seeds first; official COA later; no AF102 COA charge on this pilot unless separately ordered). Smile Seed Bank will not treat Invoice 20102618 as an Option 1 PO.

---

7) Sequence before any payment or PO (locked)

${GF_PO_GATE_LETTER_EN}

---

Next steps — Smile Seed Bank

1. Attach Label V.2.1 PDF with this letter (Date of Collection only — and public share link if useful)
2. Await written packaging / heat-seal / label-legibility feedback
3. Await the updated Option 1 Quotation (THB, 14 days) — for planning only; not payment
4. Keep Traceability in Preview; finish the system so it is ready for live use after first-lot import + written Live approval
5. Receive the six presentation stills listed above, with per-image approval + watermark
6. After labelled pouch: consult the authority on SGF Seeds + supporting documents for grower GACP applications

Thank you for the clear, constructive confirmation.

Prepared by Smile Seed Bank / T.M.Y Agro Trade Limited Partnership
www.smileseedbank.com
`;

export const GREEN_FUTURE_0904_REPLY_TH_RAW = `Subject: ${GREEN_FUTURE_0904_REPLY_TH_SUBJECT}

หจก. ทีเอ็มวาย อะโกร เทรด ภายใต้แบรนด์ Smile Seed Bank
161 หมู่ 16 แม่สาว แม่อาย เชียงใหม่ 50280
ถึง: Green Future (Global) Co., Ltd. · info@greenfuture.global · ผ่านคุณจูเลีย
อ้างอิง GF/SSB/2026-0904 · เวอร์ชัน 1.2 · 4 กันยายน 2569

เรียน คุณเยฟเฮน คุณจูเลีย และทีม Green Future

ขอบคุณสำหรับจดหมาย GF/SSB/2026-0904 ลงวันที่ 4 กันยายน 2569 และเอกสารประกอบ (แผนภาพ TH GACP, ชุดภาพกระบวนการผลิตเมล็ด และ Quotation V01)

จดหมายฉบับนี้ไม่ใช่ใบสั่งซื้อหรือคำมั่นผูกพันในการซื้อ

---

1) Traceability Pack — รับตามที่ยืนยัน ยังคงโหมด Preview

เรายืนยัน:
• หน้า Traceability ยังเป็น Preview จนกว่าจะนำเข้าล็อตจริงรอบแรก ทดสอบแล้ว และ Green Future ให้อนุมัติเป็นลายลักษณ์อักษรในการเปลี่ยน Preview → Live
• ข้อความ disclaimer ภาษาอังกฤษรับไว้ โดยรอคุณจูเลียตรวจว่าข้อความ EN/TH บนหน้าเว็บตรงกับที่ตกลง
• โครงสร้าง Public Tier และ Restricted Tier รับไว้
• รอบส่งของแรก Green Future จะส่ง PDF ล็อต/ตรวจสอบย้อนกลับที่มีลายเซ็น พร้อมไฟล์ CSV (หรือรูปแบบที่ตกลง) Smile Seed Bank จะนำเข้าและแสดงเฉพาะข้อมูลที่อนุมัติแล้ว จะไม่แก้ไขหรือลงนาม PDF ต้นฉบับแทน Green Future
• เลขล็อตต้องตรงกันทั้งฉลากซอง PDF ไฟล์นำเข้า และหน้า lookup
• Restricted: QR/token ต่อล็อต และบัญชีลูกค้าที่ได้รับอนุญาต หากทำได้ทางเทคนิค
• เก็บบันทึก audit อย่างน้อย 3 ปี นับจากแก้ไขล่าสุดหรือปิดล็อต หรือนานกว่านั้นหากกฎหมาย/สัญญากำหนด

เราจะไม่ถือว่าลิงก์ preview เป็นการเปิดใช้กับลูกค้า

---

2) ตัวอย่างบรรจุภัณฑ์

เรารับทราบว่า Green Future ได้รับซองตัวอย่าง 12 ซอง และกำลังทดสอบการซีล ความแข็งแรงของซีล และความเหมาะสมกับจำนวนเมล็ด

การทดสอบตำแหน่ง/ความอ่านง่ายของฉลาก 5.5 × 5.5 ซม. ยังรอปริ้นท์ mock-up ที่อนุมัติ เราจะรอผลเป็นลายลักษณ์อักษรเมื่อทดสอบจริงเสร็จ

---

3) รูปฟาร์มและสถานที่

เรารับเงื่อนไข: ต้องมีอนุมัติเป็นลายลักษณ์อักษรรายภาพก่อนใช้ และจะติดลายน้ำ Green Future ตามที่แนะนำ

ปรับข้อ C ตามที่ขอเป็น:
“Seed production/processing area within the GACP-certified production facility.”
(พื้นที่ผลิต/แปรรูปเมล็ดภายในสถานที่ผลิตที่ได้รับการรับรอง GACP)

ขอบคุณที่ให้เลือกภาพจาก Presentation กระบวนการผลิตเมล็ด กรุณาส่งไฟล์แยกความละเอียดสูง พร้อมอนุมัติเป็นลายลักษณ์อักษรรายภาพ และลายน้ำ Green Future สำหรับ:

${gfPhotoPicksLetterTh()}

รอบแรกยังไม่ขอภาพ hygiene/UV การแช่เมล็ด ดอกใกล้ และห้องน้ำปุ๋ย

เราได้รับแผนภาพ TH GACP และชุดภาพกระบวนการผลิตแล้ว เข้าใจว่าเป็นหลักฐานระดับสถานที่ผลิต ไม่ใช่ใบรับรอง GACP ของล็อตเมล็ด Smile Seed Bank จะไม่นำเสนอว่าเป็นใบ GACP ของเมล็ด ใช้ได้เฉพาะโปรแกรมเอกสาร Green Future และหลังอนุมัติรายภาพเท่านั้น

---

4) Lead Registration

เรายินยอมตามหลักการและข้อชี้แจง:
• คุ้มครองลูกค้าที่ Smile Seed Bank เป็นผู้แนะนำจริง
• ไม่ครอบคลุมลูกค้าที่มีความสัมพันธ์เป็นลายลักษณ์อักษรกับ Green Future ก่อนลงทะเบียน หรือติดต่อ Green Future ด้วยตนเองก่อนลงทะเบียน
• การติดต่อด้านเทคนิค/การปฏิบัติตามกฎ/คุณภาพที่จำเป็น ทำได้โดยแจ้ง/สำเนาถึง Smile Seed Bank และไม่ถือว่าเลี่ยง
• รายละเอียดระยะเวลาและกลไกจะใส่ใน Distribution Agreement
• Green Future จะไม่ใช้ลีดที่ลงทะเบียนเพื่อข้าม Smile Seed Bank ในช่วงคุ้มครองที่ตกลง

จนกว่าจะลงนามสัญญา เราจะใช้วิธีลงทะเบียนทางอีเมลตามจดหมาย 1 กันยายน (นิติบุคคล เลขใบอนุญาตถ้ามี จังหวัด วันที่ สถานะ) และรอใบตอบรับเป็นลายลักษณ์อักษร

---

5) ฉลาก V.2.1 — แนบ PDF (ไม่ต้องล็อกอิน)

เรายินยอม Regulatory Gate: ฉลากเวอร์ชันเฉพาะ อนุมัติเป็นลายลักษณ์อักษรทั้งสองฝ่าย และทดสอบบรรจุภัณฑ์จริงก่อนพิมพ์จริง

ตามข้อความคุณจูเลีย 4 กันยายน 2569 เราปรับฟิลด์วันที่จาก “วันที่รวบรวม/นำเข้า” เป็น “วันที่รวบรวม” / “Date of Collection” อย่างเดียว PDF ที่แนบคือฉลาก V.2.1 ฉบับนี้

ลิงก์ admin เดิมต้องล็อกอิน เราจะส่งลิงก์แชร์สาธารณะ (ไม่ต้องล็อกอิน) ในอีเมลชุดเดียวกัน กรุณาอย่าใช้ลิงก์ admin ที่ต้องรหัสผ่าน

กรุณายืนยันเป็นลายลักษณ์อักษร: ความครบของฟิลด์ (รวมแหล่งรวบรวมเมล็ด) วันที่รวบรวมเป็น MM/YYYY วันที่ทดสอบเป็น DD/MM/YYYY วันหมดอายุเป็น MM/YYYY และบรรทัด พ.พ.4 ผู้ขายควรอยู่บนฉลากหลังซองหรือบนใบแจ้งหนี้/Traceability เท่านั้น

---

6) ใบเสนอราคา — ยืนยันรูปแบบแล้ว กรุณาออกฉบับ Option 1 ที่แก้

เรายืนยันรูปแบบใน GF/SSB/2026-0904:
5 สาย × 4 × 50 เมล็ด = 1,000 เมล็ด / 20 ซองซีล Option 1 COA ทางการตามมาทีหลัง เป็นเงินบาท อายุ 14 วัน มีกฎอัตราแลกเปลี่ยน EUR/THB ค่าแพ็กแยกหรือระบุว่ารวม ใบเสนอราคาไม่จองสต็อก ยืนยันสต็อกและราคาก่อน PO

ไฟล์ “Quotation V01 TMY Agro” ที่แนบมากับชุดนี้ยังเป็น Pro Forma Invoice 20102618 ลงวันที่ 26 สิงหาคม 2569 (ใช้ได้ถึง 9 กันยายน 2569) และยังมีรายการ COA แล็บของ AF102 รวมทั้งมัดจำ 50% ก่อนเริ่มตรวจแล็บ ซึ่งยังไม่ใช่ใบเสนอราคา Option 1 ตามจดหมาย

กรุณาออกใบเสนอราคาฉบับแก้ที่ตรง Option 1 (ส่งเมล็ดก่อน COA ทางการทีหลัง ไม่คิดค่า COA AF102 ในรอบทดลองนี้เว้นแต่สั่งแยก) Smile Seed Bank จะไม่ถือ Invoice 20102618 เป็น PO ของ Option 1

---

7) ลำดับก่อนโอนเงินหรือออก PO (ล็อกแล้ว)

${GF_PO_GATE_LETTER_TH}

---

งานถัดไปของ Smile Seed Bank

1. แนบ PDF ฉลาก V.2.1 กับจดหมายนี้ (วันที่รวบรวมอย่างเดียว — และลิงก์แชร์สาธารณะถ้าเป็นประโยชน์)
2. รอผลตรวจซอง / heat seal / ความอ่านง่ายของฉลากเป็นลายลักษณ์อักษร
3. รอใบเสนอราคา Option 1 ฉบับแก้ (THB อายุ 14 วัน) — ใช้วางแผนเท่านั้น ไม่ใช่การจ่ายเงิน
4. คง Traceability เป็น Preview ให้ระบบพร้อมใช้จริงหลังนำเข้าล็อตรอบแรก + อนุมัติ Live
5. รับไฟล์ภาพ 6 รายการจาก Presentation ตามรายการด้านบน พร้อมอนุมัติรายภาพ + ลายน้ำ
6. หลังมีซองติดฉลาก: สอบถามหน่วยงานเรื่องเมล็ด SGF Seeds + เอกสารประกอบสำหรับคำขอ GACP ของผู้ปลูก

ขอบคุณสำหรับการยืนยันที่ชัดเจนและสร้างสรรค์

จัดทำโดย Smile Seed Bank / หจก. ทีเอ็มวาย อะโกร เทรด
www.smileseedbank.com
`;
