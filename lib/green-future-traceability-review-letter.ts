/** Ask GF to review the Traceability preview + list data/approvals still needed (Ref. 0824 §6) */

export const GREEN_FUTURE_TRACEABILITY_REVIEW_EN_SUBJECT =
  "Traceability Pack preview for review — not a customer launch (Ref. GF/SSB/2026-0824 §6)";

export const GREEN_FUTURE_TRACEABILITY_REVIEW_TH_SUBJECT =
  "ขอตรวจตัวอย่างระบบ Traceability — ยังไม่เปิดใช้กับลูกค้า (อ้างอิง GF/SSB/2026-0824 ข้อ 6)";

const REVIEW_URL = "https://www.smileseedbank.com/traceability";

export const GREEN_FUTURE_TRACEABILITY_REVIEW_EN_RAW = `Subject: ${GREEN_FUTURE_TRACEABILITY_REVIEW_EN_SUBJECT}

T.M.Y Agro Trade Limited Partnership, trading as Smile Seed Bank
161 Moo 16, Mae Sao, Mae Ai, Chiang Mai 50280, Thailand
To: Green Future (Global) Co., Ltd. · info@greenfuture.global · via Julia
Ref. GF/SSB/2026-0824 §1.2 and §6 · Meeting recap 28 August 2026

Dear Julia and Green Future management,

As agreed in the 28 August meeting, Smile Seed Bank has prepared a preview of the public Traceability lookup for Green Future to review before any customer-facing launch.

This is a design preview only. No seed lots have been imported. The page does not confirm whether a lot number exists. It is not indexed for search engines. It is not a GACP certificate.

Please open: ${REVIEW_URL}

Please also open any lot-shaped example such as ${REVIEW_URL}/GF-AF99-2608-B01 — you should see “no public summary yet”, not a live record.

---

What to review on the page

1. Disclaimer (English, as proposed in GF/SSB/2026-0824 §1.2), also shown in Thai.
2. Public-tier description: Commercial Name, Variety Code, Lot/Batch No., lot status, Germination, Purity, Test Date, Test Basis, Producer, lot-authenticity confirmation, plus a short GACP disclaimer.
3. Restricted tier is not public: signed Traceability PDF, COA/ISTA, Source Document/Version, additional Green Future documents, change history — described as issued to licensed farm customers with a confirmed order, not as a public search list.
4. No pedigree, no bulk lot list, no sequential catalogue of all lots.

Please confirm in writing: (a) the English disclaimer wording and its placement on this page; (b) the public vs restricted field split; (c) that this preview may stay online as a review link until the first delivered lot is imported.

---

What we still need from Green Future to complete the system (0824 §6)

A. Lot data for the first shipment (or a sample file now for mapping)
- Signed lot PDF (prevails) plus a CSV or equivalent for import
- Field names and one example row: Variety Code, Commercial Name, Lot/Batch No., Germination, Purity, Test Date, Test Basis, Producer, Pack Size/Quantity, Source Document/Version
- Lot-number format as it will appear on the sealed pouch (so lookup matches the label)

B. Restricted-tier access (please choose one)
- QR/token per lot; or
- authorised farm customer account; or
- both
Who generates and signs the Traceability PDF — Green Future, or Smile Seed Bank from Green Future lot data after your written template approval?

C. Template approval (0824 §6.3)
We will send a PDF mock-up after you confirm A and B. Please confirm you will review structure, data mapping, access rules, protected Green Future fields, branding, and the change-display process, and approve in writing before any customer launch.

D. Photographs and branding
- Public lookup will use Variety Code + agreed Commercial Name only, no pedigree.
- Facility photographs will not appear on the public lookup unless you send files and separate written approval per image (as in 0824). Verbal permission in the 28 August meeting is noted; we still need written confirmation and the files if they are to be used in marketing or farm GACP packs.

E. Audit log retention
Proposed minimum fields: user, timestamp, action, field, old value, new value, reason, source document/version. Please state the retention period to record in the future B2B agreement (not shorter than any mandatory period you apply).

F. After first delivery
Please send the actual lot file(s) for that shipment so we can import, test lookup against the pouch label, then request written approval to switch from preview to live.

Smile Seed Bank will not mark the Traceability Pack as live, print lot QR codes for customers, or treat this page as a launched service until A–C and the first-lot import are confirmed in writing.

Thank you. A short reply by email is enough.

Prepared by Smile Seed Bank / T.M.Y Agro Trade Limited Partnership
www.smileseedbank.com
`;

export const GREEN_FUTURE_TRACEABILITY_REVIEW_TH_RAW = `Subject: ${GREEN_FUTURE_TRACEABILITY_REVIEW_TH_SUBJECT}

หจก. ทีเอ็มวาย อะโกร เทรด ภายใต้แบรนด์ Smile Seed Bank
161 หมู่ 16 แม่สาว แม่อาย เชียงใหม่ 50280
ถึง: Green Future (Global) Co., Ltd. · info@greenfuture.global · ผ่านคุณจูเลีย
อ้างอิง GF/SSB/2026-0824 ข้อ 1.2 และข้อ 6 · สรุปประชุม 28 สิงหาคม 2026

เรียน คุณจูเลีย และผู้บริหาร Green Future

ตามที่ตกลงในประชุม 28 สิงหาคม Smile Seed Bank ได้ทำตัวอย่างหน้าตรวจเลขล็อตสาธารณะ เพื่อให้ Green Future ตรวจก่อนเปิดใช้กับลูกค้า

นี่เป็นตัวอย่างออกแบบเท่านั้น ยังไม่ได้นำเข้าล็อตเมล็ด หน้าเว็บไม่ยืนยันว่าเลขล็อตมีอยู่จริง ไม่ถูกจัดทำดัชนีบนเครื่องมือค้นหา และไม่ใช่ใบรับรอง GACP

กรุณาเปิด: ${REVIEW_URL}

ทดลองเลขตัวอย่าง เช่น ${REVIEW_URL}/GF-AF99-2608-B01 — ควรเห็นข้อความว่ายังไม่มีสรุปสาธารณะ ไม่ใช่ข้อมูลล็อตจริง

---

สิ่งที่ขอให้ตรวจบนหน้าเว็บ

1. ข้อความปฏิเสธความรับผิดภาษาอังกฤษตามร่างใน GF/SSB/2026-0824 ข้อ 1.2 และคำแปลภาษาไทย
2. ชั้นสาธารณะ: ชื่อการค้า รหัสพันธุ์ เลขล็อต สถานะล็อต อัตรางอก ความบริสุทธิ์ วันที่ทดสอบ Test Basis ผู้ผลิต การยืนยันเลขล็อต และ disclaimer สั้น
3. ชั้นจำกัดไม่เปิดสาธารณะ: PDF Traceability ที่ลงนาม, COA/ISTA, ต้นทาง/เวอร์ชัน, เอกสาร GF เพิ่ม, ประวัติแก้ไข — จัดให้ลูกค้าฟาร์มใบอนุญาตตามคำสั่งซื้อ ไม่เป็นรายการค้นหาสาธารณะ
4. ไม่เปิด pedigree ไม่มีรายการล็อตทั้งก้อน ไม่ไล่เลขล็อตได้ทั้งระบบ

กรุณายืนยันเป็นลายลักษณ์อักษร: (ก) ข้อความอังกฤษและตำแหน่งบนหน้านี้ (ข) การแบ่งฟิลด์สาธารณะ/จำกัด (ค) หน้าตัวอย่างนี้เปิดเป็นลิงก์ตรวจได้จนกว่าจะนำเข้าล็อตที่ส่งจริง

---

สิ่งที่ยังต้องการจาก Green Future เพื่อให้ระบบครบตามข้อ 6

ก. ข้อมูลล็อตรอบส่งแรก (หรือไฟล์ตัวอย่างตอนนี้เพื่อจับฟิลด์)
- PDF ล็อตที่ลงนาม (ใช้เป็นต้นฉบับ) และ CSV หรือไฟล์เทียบเท่าสำหรับนำเข้า
- ชื่อฟิลด์และแถวตัวอย่าง: รหัสพันธุ์ ชื่อการค้า เลขล็อต งอก บริสุทธิ์ วันที่ทดสอบ Test Basis ผู้ผลิต จำนวนต่อซอง ต้นทาง/เวอร์ชัน
- รูปแบบเลขล็อตตามที่จะพิมพ์บนซองซีล (เพื่อให้ค้นหาตรงฉลาก)

ข. วิธีเข้าถึงชั้นจำกัด (เลือกอย่างใดอย่างหนึ่ง)
- QR/token ต่อล็อต หรือ
- บัญชีลูกค้าฟาร์มที่อนุญาต หรือ
- ทั้งสองแบบ
ใครเป็นผู้จัดทำและลงนาม PDF Traceability — Green Future หรือ Smile Seed Bank จากข้อมูลล็อตของ GF หลังอนุมัติเทมเพลตเป็นลายลักษณ์อักษร?

ค. อนุมัติเทมเพลต (0824 ข้อ 6.3)
เราจะส่งตัวอย่าง PDF หลังได้รับคำตอบ ก. และ ข. กรุณายืนยันว่าจะตรวจโครงเอกสาร การจับข้อมูล กฎการเข้าถึง ฟิลด์ GF ที่ห้ามแก้ แบรนด์ และการแสดงประวัติแก้ แล้วอนุมัติเป็นลายลักษณ์อักษรก่อนเปิดใช้กับลูกค้า

ง. รูปและแบรนด์
- หน้าสาธารณะใช้รหัสพันธุ์ + ชื่อการค้าที่ตกลงเท่านั้น ไม่เปิด pedigree
- ไม่ใส่รูปโรงงานบนหน้า lookup สาธารณะจนกว่า GF จะส่งไฟล์และอนุมัติเป็นลายลักษณ์อักษรรูปต่อรูป ตาม 0824 — คำอนุญาตปากเปล่าในประชุม 28 ส.ค. บันทึกไว้แล้ว แต่ถ้าจะใช้การตลาดหรือชุดเอกสาร GACP ของฟาร์ม ยังต้องการไฟล์และหนังสือยืนยัน

จ. ระยะเก็บ audit log
ฟิลด์ขั้นต่ำที่เสนอ: ผู้ใช้ เวลา การกระทำ ฟิลด์ ค่าเก่า ค่าใหม่ เหตุผล ต้นทาง/เวอร์ชัน กรุณาระบุระยะเก็บเพื่อบันทึกในสัญญา B2B ภายหลัง (ไม่สั้นกว่าที่กฎหมายหรือนโยบาย GF บังคับ)

ฉ. หลังส่งของรอบแรก
กรุณาส่งไฟล์ล็อตจริงของรอบนั้น เพื่อนำเข้า ทดสอบกับฉลากบนซอง แล้วขออนุมัติเป็นลายลักษณ์อักษรก่อนเปลี่ยนจาก preview เป็น live

Smile Seed Bank จะไม่ติดสถานะ live ไม่พิมพ์ QR ล็อตให้ลูกค้า และไม่ถือว่าหน้านี้เป็นบริการที่เปิดแล้ว จนกว่า ก.–ค. และการนำเข้าล็อตรอบแรกจะมีหนังสือยืนยัน

ขอบคุณครับ ตอบสั้นทางอีเมลเพียงพอ

จัดทำโดย Smile Seed Bank / หจก. ทีเอ็มวาย อะโกร เทรด
www.smileseedbank.com
`;
