/** Approved marketing wording — use only after Regulatory Gate passes */

import type { Metadata } from "next";
import { GF_PILOT_POUCH_QTY } from "@/lib/green-future-pilot-config";

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
  "คำขอใบเสนอราคานี้ไม่ใช่คำสั่งซื้อหรือมัดจำ — ราคาและระยะเวลาเป็นประมาณการจนกว่าจะยืนยันในใบเสนอราคา";

export const GF_RFQ_NON_BINDING_EN =
  "This quotation request is not a purchase order or deposit — price and timing are indicative until confirmed in a quotation";

export const GF_OPTION1_LABEL_TH =
  "ส่งเมล็ดก่อน — ใช้ผลทดสอบล็อตของผู้ผลิตตอนส่ง · ใบ COA แล็บภายนอกมาทีหลังหากสั่งแยก";

export const GF_OPTION1_LABEL_EN =
  "Seeds first — dispatch on the producer’s lot test · official lab COA later if ordered separately";

export const GF_PILOT_PACK_DESC_TH = `ซองซีล ${GF_PILOT_POUCH_QTY} เมล็ด/ซอง · บรรจุแพ็กจากโรงงานผู้ผลิต (มาตรฐาน GACP) · ราคาลดตามยอดรวม 125/100/80 บาท/เมล็ด · ประมาณการสำหรับขอใบเสนอราคา`;

export const GF_PILOT_PACK_DESC_EN = `Sealed ${GF_PILOT_POUCH_QTY}-seed pouches · factory-packed at the GACP production site · tiered cart pricing (125/100/80 THB/seed) · indicative quotation estimates`;

export const GF_PILOT_INCLUDED_DOCS_TITLE_TH =
  "เอกสารที่แถมต่อล็อต — 5 สายนำร่อง (AF99 · AF143 · AF02 · AF22 · AF102)";

export const GF_PILOT_INCLUDED_DOCS_TITLE_EN =
  "Documents included per lot — 5 pilot strains (AF99 · AF143 · AF02 · AF22 · AF102)";

export const GF_PILOT_INCLUDED_DOCS_TH = [
  "รหัสพันธุ์ · ชื่อการค้า · เลขล็อต",
  "ผลทดสอบภายในของผู้ผลิตต่อล็อต (อัตรางอก / บริสุทธิ์ / วันที่ ตามที่ยืนยัน)",
  "ฉลากบนซองซีล (เลขล็อต + ชื่อผู้จำหน่ายตาม พ.พ.4)",
  "อ้างอิงใบแจ้งหนี้/ล็อตและสรุปตรวจสอบย้อนกลับสำหรับ GACP",
] as const;

export const GF_PILOT_INCLUDED_DOCS_EN = [
  "Variety code · commercial name · lot number",
  "Producer internal lot test data (germination / purity / dates as confirmed per lot)",
  "Label on sealed pouch (lot number + licensed seller per Por.Por. 4)",
  "Invoice/lot reference and traceability summary for GACP support",
] as const;

export const GF_PILOT_INCLUDED_DOCS_NOTE_TH =
  "ตามโปรแกรมเอกสาร Green Future — ไม่ใช่ใบ GACP หรือ DTAM · COA แล็บภายนอก (Package A/B) และ ISTA คิดแยกเมื่อสั่ง";

export const GF_PILOT_INCLUDED_DOCS_NOTE_EN =
  "Under the Green Future documented programme — not a GACP certificate or DTAM document · external lab COA (Package A/B) and ISTA are optional add-ons, billed separately when ordered";

export const GF_WHOLESALE_HERO_TITLE_TH =
  "เมล็ดพันธุ์คุณภาพสำหรับผู้ปลูกมาตรฐาน GACP";

export const GF_WHOLESALE_HERO_TITLE_EN =
  "Quality seeds for GACP-standard growers";

export const GF_WHOLESALE_HERO_LEAD_TH =
  "เมล็ดพันธุ์กัญชาแบรนด์ SGF-SEEDS ผลิตในประเทศไทย มาตรฐาน GACP จัดจำหน่ายโดย Smile Seed Bank";

export const GF_WHOLESALE_HERO_LEAD_EN =
  "SGF-SEEDS cannabis genetics produced in Thailand to GACP standards, distributed by Smile Seed Bank";

export const GF_DISPATCH_AFTER_PO_TH =
  "ระยะเวลาจัดส่งเป็นประมาณการตามใบเสนอราคา — ไม่ใช่การรับประกันวันส่ง";

export const GF_DISPATCH_AFTER_PO_EN =
  "Dispatch timing is indicative per quotation — not a guaranteed ship date";

export const GF_OPTION1_DISPATCH_TH =
  "ประมาณการ 3–7 วันทำการหลังยืนยันคำสั่งตามใบเสนอราคา — ขึ้นกับล็อตที่มี";

export const GF_OPTION1_DISPATCH_EN =
  "Indicative 3–7 business days after order confirmation per quotation — subject to lot availability";

export const GF_WITH_COA_DISPATCH_TH =
  "มี COA แล็บภายนอก: แล็บประมาณ 30 วันทำการ แล้วจัดส่งอีกประมาณ 3–7 วัน — ตามใบเสนอราคา";

export const GF_WITH_COA_DISPATCH_EN =
  "With external lab COA: lab about 30 business days, then indicative dispatch 3–7 days — per quotation";

export const GF_STRAIN_STATUS_PRE_GATE_TH = "เสนอขอราคา — ยังไม่พร้อมขาย";

export const GF_STRAIN_STATUS_PRE_GATE_EN = "Proposed for quotation — not yet for sale";

export const GF_CONDITIONAL_DEPOSIT_SHORT_TH =
  "มัดจำจองสิทธิ์แบบมีเงื่อนไข — คืนเงินเต็มหากไม่ถึงขั้นต่ำหรือไม่ผ่านเงื่อนไขที่ระบุในใบเสนอราคา";

export const GF_CONDITIONAL_DEPOSIT_SHORT_EN =
  "Conditional reservation deposit — full refund if minimums are not met or quotation conditions are not fulfilled";

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
  "ขณะนี้รับคำขอใบเสนอราคาเท่านั้น ยังไม่เปิดรับมัดจำ";

export const GF_PRE_GATE_WEB_NOTICE_EN =
  "Quotation requests only for now — deposits are not yet open";

export const GF_POST_GATE_WEB_NOTICE_TH =
  "เปิดรับมัดจำจองสิทธิ์แบบมีเงื่อนไข — คืนเงินเต็มหากไม่ถึงขั้นต่ำหรือไม่ผ่านเงื่อนไขที่กำหนด ราคาและระยะเวลาเป็นประมาณการตามใบเสนอราคา";

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

- Prices are indicative until confirmed in a quotation.
- 50% conditional deposit per line; full refund if the round minimum is not met or quotation conditions are not fulfilled.
- Seeds are producer-packed and sealed — Smile Seed Bank does not open, repack, or relabel.
- External lab COA is optional per strain, charged separately.

Reply to request a quotation or join the reservation list.
Distributed by T.M.Y Agro Trade Limited Partnership, Por.Por. 4 No. 1011043900042568.`;

export const GF_EMAIL_BODY_POST_GATE_TH = `โปรแกรมเมล็ด Green Future — เปิดจองแบบมีเงื่อนไข

เปิดรับมัดจำจองสิทธิ์แบบมีเงื่อนไขสำหรับซองซีล 50 เมล็ด (5 สาย)

ถ้อยคำที่อนุมัติ:
${GF_TRACEABILITY_CLAIM_TH} — ${GF_TRACEABILITY_DISCLAIMER_TH}

- ราคาเป็นประมาณการจนกว่าจะยืนยันในใบเสนอราคา
- มัดจำ 50% ต่อรายการ คืนเงินเต็มหากไม่ถึงขั้นต่ำหรือไม่ผ่านเงื่อนไขที่ระบุในใบเสนอราคา
- เมล็ดบรรจุและซีลโดยผู้ผลิต — Smile Seed Bank ไม่เปิด แบ่ง หรือเปลี่ยนฉลาก
- COA แล็บภายนอกเป็นตัวเลือกเสริม คิดแยกตามสาย

ติดต่อเพื่อขอใบเสนอราคาหรือเข้ารายการจอง
จัดจำหน่ายโดย หจก. ทีเอ็มวาย อะโกร เทรด พ.พ.4 1011043900042568`;

export const GF_FACEBOOK_POST_POST_GATE_EN = `${GF_TRACEABILITY_CLAIM_EN}.

Pilot: producer-sealed 50-seed pouches · 5 strains · conditional deposit · full refund if conditions not met.

Not GACP-certified seeds. Quotation-based pricing. DM for B2B details.

#SmileSeedBank #GreenFuture #B2B`;

export const GF_FACEBOOK_POST_POST_GATE_TH = `${GF_TRACEABILITY_CLAIM_TH}

รอบเปิดจอง: ซองซีล 50 เมล็ด · 5 สาย · มัดจำมีเงื่อนไข · คืนเงินเต็มหากไม่ผ่านเงื่อนไข

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
