/** Approved marketing wording — use only after Regulatory Gate passes */

export type GfMarketingGateStatus = "pre_gate" | "post_gate";

/** Current gate — flip to post_gate after written regulatory evidence */
export const GF_MARKETING_GATE_STATUS: GfMarketingGateStatus = "pre_gate";

export const GF_TRACEABILITY_CLAIM_TH =
  "เมล็ดจากโปรแกรม Green Future พร้อมเอกสารตรวจสอบย้อนกลับเพื่อใช้สนับสนุนเอกสาร GACP (supporting traceability documentation for GACP purposes)";

export const GF_TRACEABILITY_CLAIM_EN =
  "Green Future documented seeds with supporting traceability documentation for GACP purposes";

export const GF_TRACEABILITY_DISCLAIMER_TH =
  "ไม่ใช่ใบ GACP, เอกสาร DTAM หรือการรับประกันผลตรวจ — ผล GACP ขึ้นกับฟาร์มผู้ยื่นคำขอทั้งหมด";

export const GF_TRACEABILITY_DISCLAIMER_EN =
  "not a GACP certificate, DTAM document, or audit guarantee — GACP outcomes depend entirely on the applying farm";

export const GF_PRE_GATE_WEB_NOTICE_TH =
  "โปรแกรมนี้อยู่ระหว่างตรวจฉลากและกระบวนการกับหน่วยงานที่เกี่ยวข้อง — รับคำขอใบเสนอราคาเท่านั้น ยังไม่เปิดรับมัดจำสาธารณะ";

export const GF_PRE_GATE_WEB_NOTICE_EN =
  "This programme is undergoing label and process review with the competent authority — quotation requests only; public deposits are not yet open";

export const GF_POST_GATE_WEB_NOTICE_TH =
  "เปิดรับมัดจำจองสิทธิ์แบบมีเงื่อนไข — คืนเงินเต็มหากไม่ถึงขั้นต่ำหรือไม่ผ่านเงื่อนไขที่กำหนด ราคาและระยะเวลาเป็นประมาณการตาม quotation";

export const GF_POST_GATE_WEB_NOTICE_EN =
  "Conditional reservation deposits now open — full refund if minimums or approval conditions are not met; price and timing are indicative per quotation";

export const GF_EMAIL_SUBJECT_PRE_GATE =
  "Green Future documented seed programme — quotation request";

export const GF_EMAIL_SUBJECT_POST_GATE =
  "Green Future pilot pouches — conditional reservation (50 seeds)";

export const GF_EMAIL_BODY_POST_GATE_EN = `Green Future documented seed programme — pilot round

We are opening a conditional reservation round for producer-sealed 50-seed pouches (5 pilot strains).

Approved wording:
${GF_TRACEABILITY_CLAIM_EN} — ${GF_TRACEABILITY_DISCLAIMER_EN}.

- Prices are indicative until Green Future confirms quotation and lot in writing.
- 50% conditional deposit per line; full refund if the round minimum is not met, GF does not confirm, or label/process approval is not obtained.
- Seeds are producer-packed and sealed — Smile Seed Bank does not open, repack, or relabel.
- External lab COA is optional per strain, charged separately.

Reply to request a quotation or join the reservation list.
Distributed by T.M.Y Agro Trade Limited Partnership, Por.Por. 4 No. 1011043900042568.`;

export const GF_EMAIL_BODY_POST_GATE_TH = `โปรแกรมเมล็ด Green Future — รอบทดลอง

เปิดรับมัดจำจองสิทธิ์แบบมีเงื่อนไขสำหรับซองซีล 50 เมล็ด (5 สายทดลอง)

ถ้อยคำที่อนุมัติ:
${GF_TRACEABILITY_CLAIM_TH} — ${GF_TRACEABILITY_DISCLAIMER_TH}

- ราคาเป็นประมาณการจนกว่า Green Future ยืนยัน quotation และล็อตเป็นลายลักษณ์อักษร
- มัดจำ 50% ต่อรายการ คืนเงินเต็มหากไม่ถึงขั้นต่ำ GF ไม่ยืนยัน หรือฉลาก/กระบวนการไม่ผ่าน
- เมล็ดบรรจุและซีลโดยผู้ผลิต — Smile Seed Bank ไม่เปิด แบ่ง หรือเปลี่ยนฉลาก
- COA แล็บภายนอกเป็นตัวเลือกเสริม คิดแยกตามสาย

ติดต่อเพื่อขอใบเสนอราคาหรือเข้ารายการจอง
จัดจำหน่ายโดย หจก. ทีเอ็มวาย อะโกร เทรด พ.พ.4 1011043900042568`;

export const GF_FACEBOOK_POST_POST_GATE_EN = `${GF_TRACEABILITY_CLAIM_EN}.

Pilot: producer-sealed 50-seed pouches · 5 strains · conditional deposit · full refund if conditions not met.

Not GACP-certified seeds. Quotation-based pricing. DM for B2B details.

#SmileSeedBank #GreenFuture #B2B`;

export const GF_FACEBOOK_POST_POST_GATE_TH = `${GF_TRACEABILITY_CLAIM_TH}

รอบทดลอง: ซองซีล 50 เมล็ด · 5 สาย · มัดจำมีเงื่อนไข · คืนเงินเต็มหากไม่ผ่านเงื่อนไข

ไม่ใช่เมล็ดรับรอง GACP ราคาตาม quotation ทักขอรายละเอียด B2B

#SmileSeedBank #GreenFuture #B2B`;

export const GREEN_FUTURE_MARKETING_PACK_SUBJECT =
  "Internal — GF Approved Marketing Pack (post Regulatory Gate)";

export const GREEN_FUTURE_MARKETING_PACK_RAW = `Subject: Internal — GF Approved Marketing Pack (post Regulatory Gate)

Use only after Regulatory Gate passes and the same wording is on web, email, and social.

---

Web (TrustCompliance / compliance notice)

TH traceability: ${GF_TRACEABILITY_CLAIM_TH}
EN traceability: ${GF_TRACEABILITY_CLAIM_EN}
TH disclaimer: ${GF_TRACEABILITY_DISCLAIMER_TH}
EN disclaimer: ${GF_TRACEABILITY_DISCLAIMER_EN}

Gate notice (pre): ${GF_PRE_GATE_WEB_NOTICE_TH}
Gate notice (post): ${GF_POST_GATE_WEB_NOTICE_TH}

---

Email

Subject (post gate): ${GF_EMAIL_SUBJECT_POST_GATE}

${GF_EMAIL_BODY_POST_GATE_EN}

---

Facebook (post gate)

${GF_FACEBOOK_POST_POST_GATE_EN}

---

Thai variants

Email TH:
${GF_EMAIL_BODY_POST_GATE_TH}

Facebook TH:
${GF_FACEBOOK_POST_POST_GATE_TH}

Internal use only — flip GF_MARKETING_GATE_STATUS to post_gate in lib/green-future-approved-marketing.ts after evidence file is complete.
`;

export function gfGateNotice(t: (th: string, en: string) => string): string {
  return GF_MARKETING_GATE_STATUS === "post_gate"
    ? t(GF_POST_GATE_WEB_NOTICE_TH, GF_POST_GATE_WEB_NOTICE_EN)
    : t(GF_PRE_GATE_WEB_NOTICE_TH, GF_PRE_GATE_WEB_NOTICE_EN);
}
