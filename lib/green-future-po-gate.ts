/** Locked SSB operating sequence — no funds and no PO until every gate below is complete. */

export const GF_PILOT_STRAINS = [
  "AF99",
  "AF143",
  "AF02",
  "AF22",
  "AF102",
] as const;

export const GF_PO_GATE = {
  sequence: [
    "pack_and_label",
    "authority_gacp_consult",
    "market_ready_four",
    "customer_deposit_50_received",
    "first_po_then_gf_advance_50",
  ],
  noTransferBeforeGates: true,
  noPoBeforeGates: true,
  gfAdvanceOnlyAfterCustomerDeposit: true,
  poQtyCoveredByCustomerDeposits: true,
  customerDepositPct: 50,
  gfAdvancePct: 50,
} as const;

export const GF_PO_GATE_LETTER_EN = `Smile Seed Bank will not transfer funds, pay any advance, or issue a purchase order until all of the following are complete.

A. Packaging and labelling
• Physical pouch / heat-seal test complete, with written Green Future feedback
• Label V.2 version approved in writing by both parties and physically tested on the pouch (5.5 × 5.5 cm placement and legibility)

B. Authority consultation (grower GACP)
• Smile Seed Bank has consulted the relevant authority that a licensed grower can use SGF Seeds, together with the related lot, traceability and supporting documents, to apply for GACP cultivation without a documented problem on seed origin or documentation

C. Full marketing ready — all four items
1. Traceability web system finished and ready for real use (the public page stays Preview until the first actual lot is imported and Green Future gives separate written Preview → Live approval, as in GF/SSB/2026-0904)
2. B2B / GACP-ready seeds page live, with the agreed conditions and disclaimers explained
3. Seed viability claim process live and verified as workable by both Smile Seed Bank and Green Future
4. At least one customer order received for one of the five pilot strains (AF99, AF143, AF02, AF22, AF102)

Only then: first purchase order to Green Future.

PO quantity lock: the first PO covers only the strain(s) and quantity whose customer 50% deposits already in hand cover Green Future’s 50% advance for those same lines. One customer order unlocks demand — it does not by itself authorise a PO for the full 1,000-seed / 20-unit pilot. Further lines are added to a PO only when additional deposits cover them. Smile Seed Bank will reconfirm availability and price in writing before each PO.

Payment lock: Smile Seed Bank pays Green Future the 50% advance only after the customer’s 50% deposit has been received, and only for the PO lines so covered. No customer deposit in hand → no transfer to Green Future.

Any quotation, including Invoice 20102618 / Quotation V01, is for planning only. It is not an instruction to pay and does not reserve stock.`;

export const GF_PO_GATE_LETTER_TH = `Smile Seed Bank จะไม่โอนเงิน ไม่จ่ายมัดจำ และไม่ออกใบสั่งซื้อ จนกว่าทุกข้อต่อไปนี้จะครบ

ก. บรรจุภัณฑ์และฉลาก
• ทดสอบซอง / heat seal เสร็จ และมีผลเป็นลายลักษณ์อักษรจาก Green Future
• ฉลาก V.2 อนุมัติเวอร์ชันเป็นลายลักษณ์อักษรทั้งสองฝ่าย และทดสอบติดซองจริงแล้ว (ตำแหน่งและความอ่านง่าย 5.5 × 5.5 ซม.)

ข. สอบถามหน่วยงาน (GACP ฝั่งผู้ปลูก)
• Smile Seed Bank ได้สอบถามหน่วยงานที่เกี่ยวข้องแล้วว่า ผู้ปลูกที่มีใบอนุญาตสามารถนำเมล็ด SGF Seeds พร้อมเอกสารล็อต Traceability และเอกสารประกอบที่เกี่ยวข้อง ไปยื่นขออนุญาตปลูกในกรอบ GACP ได้ โดยไม่มีปัญหาเป็นลายลักษณ์อักษรเรื่องแหล่งเมล็ดหรือเอกสารประกอบ

ค. การตลาดเต็มรูปแบบ — ครบทั้ง 4 ข้อ
1. ระบบเว็บ Traceability เสร็จและพร้อมใช้จริง (หน้าสาธารณะยังเป็น Preview จนกว่าจะนำเข้าล็อตจริงรอบแรก และ Green Future อนุมัติ Preview → Live เป็นลายลักษณ์อักษร ตาม GF/SSB/2026-0904)
2. หน้า B2B / GACP-ready seeds พร้อมข้อความเงื่อนไขและข้อจำกัดที่ตกลงแล้ว
3. ระบบเคลมเมล็ดใช้งานได้จริง และตรวจสอบแล้วจากทั้ง Smile Seed Bank และ Green Future
4. มีลูกค้ากดสั่งเข้ามาอย่างน้อย 1 ราย สำหรับ 1 ใน 5 สายพันธุ์นำร่อง (AF99, AF143, AF02, AF22, AF102)

ครบแล้วจึงออกใบสั่งซื้อ (PO) รอบแรกให้ Green Future

ล็อกปริมาณ PO: PO รอบแรกครอบคลุมเฉพาะสายพันธุ์และจำนวนที่มัดจำลูกค้า 50% ที่เข้าบัญชีแล้ว ครอบคลุมมัดจำ 50% ของ Green Future ในบรรทัดนั้น ออเดอร์ลูกค้า 1 รายเป็นเครื่องพิสูจน์ดีมานด์ — ไม่ใช่ใบอนุญาตให้ออก PO ทั้งชุด 1,000 เมล็ด / 20 ซอง บรรทัดเพิ่มใส่ PO ได้เมื่อมีมัดจำเพิ่มครอบคลุม ก่อนออก PO แต่ละครั้ง Smile Seed Bank จะยืนยันสต็อกและราคาเป็นลายลักษณ์อักษร

ล็อกการชำระ: Smile Seed Bank โอนมัดจำ 50% ให้ Green Future ต่อเมื่อได้รับมัดจำ 50% จากลูกค้าแล้ว และเฉพาะบรรทัด PO ที่มัดจำครอบคลุมเท่านั้น ยังไม่มีเงินมัดจำลูกค้าเข้าบัญชี → ยังไม่โอนให้ Green Future

ใบเสนอราคาทุกฉบับ รวม Invoice 20102618 / Quotation V01 ใช้วางแผนเท่านั้น ไม่ใช่คำสั่งจ่าย และไม่จองสต็อก`;
