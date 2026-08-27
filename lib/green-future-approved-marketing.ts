/** Approved marketing wording — use only after Regulatory Gate passes */

import type { Metadata } from "next";
import { GF_PILOT_DEFAULT_QTY, GF_PILOT_POUCH_QTY } from "@/lib/green-future-pilot-config";

export type GfMarketingGateStatus = "pre_gate" | "post_gate";

/** Current gate — flip to post_gate after written regulatory evidence */
export const GF_MARKETING_GATE_STATUS: GfMarketingGateStatus = "pre_gate";

export function isGfPreGate(): boolean {
  return GF_MARKETING_GATE_STATUS === "pre_gate";
}

export function isGfPostGate(): boolean {
  return GF_MARKETING_GATE_STATUS === "post_gate";
}

export function gfAcceptsPublicDeposits(): boolean {
  return isGfPostGate();
}

export function gfShowPaymentTerms(): boolean {
  return isGfPostGate();
}

export const GF_RFQ_NON_BINDING_TH =
  "คำขอใบเสนอราคานี้ไม่ใช่คำสั่งซื้อหรือมัดจำ — ราคาและระยะเวลาเป็นประมาณการจนกว่า Green Future ยืนยัน quotation และ accepted PO";

export const GF_RFQ_NON_BINDING_EN =
  "This quotation request is not a purchase order or deposit — price and timing are indicative until Green Future confirms quotation and an accepted PO";

export const GF_OPTION1_LABEL_TH =
  "Option 1 — ปล่อยของตามผลทดสอบล็อตภายใน GF ตอนส่ง · ใบ COA ทางการภายหลัง (รูปแบบขอราคา/ตรวจกฎหมาย)";

export const GF_OPTION1_LABEL_EN =
  "Option 1 — dispatch on GF documented internal lot test · official COA later (quotation/regulatory review configuration)";

export const GF_PILOT_PACK_DESC_TH = `รอบทดลอง: ซองซีล ${GF_PILOT_POUCH_QTY} เมล็ด · 4 ซองต่อสาย (${GF_PILOT_DEFAULT_QTY} เมล็ด) · 5 สาย — สำหรับขอราคาเท่านั้น`;

export const GF_PILOT_PACK_DESC_EN = `Pilot: ${GF_PILOT_POUCH_QTY}-seed sealed pouches · 4 pouches per strain (${GF_PILOT_DEFAULT_QTY} seeds) · 5 strains — quotation planning only`;

export const GF_DISPATCH_AFTER_PO_TH =
  "ระยะเวลาจัดส่งเป็นประมาณการหลัง accepted PO และมัดจำตาม quotation — ไม่ใช่การรับประกันวันส่ง";

export const GF_DISPATCH_AFTER_PO_EN =
  "Dispatch timing is indicative after an accepted PO and deposit per quotation — not a guaranteed ship date";

export const GF_OPTION1_DISPATCH_TH =
  "Option 1 (ไม่มี COA ภายนอก): ประมาณการ 3–7 วันทำการหลัง accepted PO และมัดจำ 50% — ขึ้นกับล็อตและ quotation";

export const GF_OPTION1_DISPATCH_EN =
  "Option 1 (no external COA): indicative 3–7 business days after accepted PO and 50% advance — subject to lot and quotation";

export const GF_WITH_COA_DISPATCH_TH =
  "มี COA แล็บภายนอก: แล็บ ~30 วันทำการ แล้วจัดส่งอีก 3–7 วัน — หลัง accepted PO ตาม quotation";

export const GF_WITH_COA_DISPATCH_EN =
  "With external lab COA: lab ~30 business days, then indicative dispatch 3–7 days — after accepted PO per quotation";

export const GF_STRAIN_STATUS_PRE_GATE_TH = "เสนอขอราคา — ยังไม่พร้อมขาย";

export const GF_STRAIN_STATUS_PRE_GATE_EN = "Proposed for quotation — not yet for sale";

export const GF_CONDITIONAL_DEPOSIT_SHORT_TH =
  "มัดจำจองสิทธิ์แบบมีเงื่อนไข — คืนเงินเต็มหากไม่ถึงขั้นต่ำ GF ไม่ยืนยัน หรือฉลาก/กระบวนการไม่ผ่าน";

export const GF_CONDITIONAL_DEPOSIT_SHORT_EN =
  "Conditional reservation deposit — full refund if minimums are not met, GF does not confirm, or label/process approval fails";

export function gfWholesaleRobots(): NonNullable<Metadata["robots"]> {
  return isGfPreGate()
    ? { index: false, follow: false }
    : { index: true, follow: true };
}

export function gfWholesaleInSitemap(): boolean {
  return isGfPostGate();
}

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
