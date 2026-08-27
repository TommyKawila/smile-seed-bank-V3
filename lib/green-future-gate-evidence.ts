/** Regulatory / Demand Gate evidence checklist — single evidence pack */

export type GfGatePhase =
  | "regulatory_pending"
  | "regulatory_conditional"
  | "regulatory_passed"
  | "quotation_received"
  | "marketing_open"
  | "deposits_open"
  | "demand_met"
  | "po_issued";

export type GfEvidenceItem = {
  id: string;
  labelTh: string;
  labelEn: string;
  required: boolean;
};

export const GF_REGULATORY_EVIDENCE_ITEMS: GfEvidenceItem[] = [
  {
    id: "labelled_sample",
    labelTh: "ซองติดฉลากตัวอย่าง (ชุดเดียวกับที่ส่งตรวจ)",
    labelEn: "Labelled sample pouch (same set sent for review)",
    required: true,
  },
  {
    id: "label_version",
    labelTh: "ฉลากเวอร์ชัน (เช่น V1.0) อนุมัติเป็นลายลักษณ์อักษรทั้งสองฝ่าย",
    labelEn: "Label version (e.g. V1.0) approved in writing by both parties",
    required: true,
  },
  {
    id: "process_summary",
    labelTh: "เอกสารสรุปกระบวนการ 1 หน้า (TH/EN)",
    labelEn: "One-page process summary (TH/EN)",
    required: true,
  },
  {
    id: "seller_authority",
    labelTh: "คำตอบหน่วยงาน — ฝั่งผู้ขาย (บรรจุ ฉลาก ส่งมอบ เก็บ ขาย)",
    labelEn: "Authority feedback — seller process (pack, label, handover, storage, resale)",
    required: true,
  },
  {
    id: "buyer_gacp_docs",
    labelTh: "คำตอบหน่วยงาน — ฝั่งผู้ซื้อ (เอกสารล็อตประกอบคำขอ GACP)",
    labelEn: "Authority feedback — buyer GACP supporting documents",
    required: true,
  },
  {
    id: "packaging_test",
    labelTh: "ผลทดสอบบรรจุ/ซอง + written approval เวอร์ชันซอง",
    labelEn: "Packaging test result + written pouch version approval",
    required: true,
  },
  {
    id: "gf_quotation",
    labelTh: "ใบเสนอราคา Green Future (THB, อายุราคา, ค่าแพ็ก, lead time)",
    labelEn: "Green Future quotation (THB, validity, packing fee, lead time)",
    required: true,
  },
  {
    id: "meeting_recap",
    labelTh: "สรุปประชุม 28 ส.ค. / follow-up อีเมลภาษาอังกฤษ",
    labelEn: "28 Aug meeting recap / English follow-up email",
    required: true,
  },
];

export const GREEN_FUTURE_GATE_EVIDENCE_SUBJECT =
  "Internal — GF Regulatory & Demand Gate Evidence Checklist";

export const GREEN_FUTURE_GATE_EVIDENCE_RAW = `Subject: Internal — GF Regulatory & Demand Gate Evidence Checklist

Smile Seed Bank — single evidence pack for GF/SSB/2026-0824 pilot
Do not open marketing or customer deposits until Regulatory Gate items 1–6 are complete (or conditional path documented).

---

Gate status (update after each step)

| Phase | Status |
| --- | --- |
| Regulatory Gate | pending |
| Quotation received | pending |
| Marketing open (approved wording) | pending |
| Customer deposits open | pending |
| Demand Gate (threshold met) | pending |
| PO to Green Future | pending |

---

Regulatory evidence (same review set)

1. Labelled sample pouch — file: ___
2. Label version approved (V___) — file: ___
3. Process summary TH/EN — file: ___
4. Authority note — seller process — file: ___
5. Authority note — buyer GACP supporting docs — file: ___
6. Packaging test + pouch version approval — file: ___

---

Commercial evidence

7. GF quotation PDF — ref: ___ · valid until: ___
8. Meeting recap / English confirmation email — date: ___

---

Decision after meeting

- Pass: regulatory OK + docs OK → marketing + conditional deposits
- Conditional: fix label/process → new version → re-check before marketing
- No written confirmation: quotation for planning only — no deposits, no PO
- GF requires PO before regulatory help: do not proceed on low-risk plan — request non-binding pilot validation

---

Demand Gate (when deposits open)

- Threshold target (indicative): ~23,630 THB (GF 50% advance + packing + 5% reserve — recalc from final quotation)
- Deposits collected: ___ THB
- PO issued: date ___ · GF advance paid: ___

Internal use only
`;

export const GF_GATE_PHASE_LABELS: Record<
  GfGatePhase,
  { th: string; en: string }
> = {
  regulatory_pending: {
    th: "รอ Regulatory Gate",
    en: "Regulatory Gate pending",
  },
  regulatory_conditional: {
    th: "ผ่านแบบมีเงื่อนไข — แก้ฉลาก/กระบวนการ",
    en: "Conditional pass — fix label/process",
  },
  regulatory_passed: {
    th: "ผ่าน Regulatory Gate",
    en: "Regulatory Gate passed",
  },
  quotation_received: {
    th: "ได้ quotation แล้ว",
    en: "Quotation received",
  },
  marketing_open: {
    th: "เปิดการตลาด (ถ้อยคำอนุมัติ)",
    en: "Marketing open (approved wording)",
  },
  deposits_open: {
    th: "เปิดรับมัดจำลูกค้า",
    en: "Customer deposits open",
  },
  demand_met: {
    th: "ถึง Demand Gate threshold",
    en: "Demand Gate threshold met",
  },
  po_issued: {
    th: "ออก PO ให้ Green Future แล้ว",
    en: "PO issued to Green Future",
  },
};
