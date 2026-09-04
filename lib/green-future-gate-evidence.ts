import {
  GF_PROFORMA_20260826,
  GF_SEED_VIABILITY_CLAIM_FORM,
} from "@/lib/green-future-proforma-20260826";

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
    labelTh:
      "ฉลาก V.2 ตรงตัวอย่างกรมฯ + อนุมัติเวอร์ชันเป็นลายลักษณ์อักษร (กรมฯ ไม่ประทับฉลาก)",
    labelEn:
      "Label V.2 matches DOA reference + written version approval (DOA does not stamp labels)",
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
  {
    id: "viability_claim_process",
    labelTh: "ขั้นตอน Seed Viability Claim + ฟิลด์หลักฐาน + ผู้อนุมัติ/SLA",
    labelEn: "Seed Viability Claim process + evidence fields + approver/SLA",
    required: true,
  },
];

export const GREEN_FUTURE_GATE_EVIDENCE_SUBJECT =
  "Internal — GF Regulatory & Demand Gate Evidence Checklist";

export const GREEN_FUTURE_GATE_EVIDENCE_RAW = `Subject: Internal — GF Regulatory & Demand Gate Evidence Checklist

Smile Seed Bank — single evidence pack for GF/SSB/2026-0824 pilot
Locked sequence (0904 reply): pack+label → authority GACP consult → marketing 4 items (Traceability ready, B2B/GACP page, claim verified by both parties, one customer order on a pilot strain) → customer 50% in hand → first PO → GF 50%. No transfer and no PO before that. See lib/green-future-po-gate.ts.

---

Gate status (update after each step)

| Phase | Status |
| --- | --- |
| Regulatory Gate | pending |
| Quotation received | received — PI ${GF_PROFORMA_20260826.invoiceNo}, valid to ${GF_PROFORMA_20260826.validUntil} |
| Marketing open (approved wording) | pending |
| Customer deposits open | pending |
| Demand Gate (one paid pilot order) | pending |
| Customer 50% received | pending |
| PO to Green Future | pending |
| GF 50% paid | pending — only after customer 50% |

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

7. GF quotation PDF — PI ${GF_PROFORMA_20260826.invoiceNo} · valid until ${GF_PROFORMA_20260826.validUntil} · total ${GF_PROFORMA_20260826.totalThb.toLocaleString("en-US", { minimumFractionDigits: 2 })} THB · advance ${GF_PROFORMA_20260826.advanceThb.toLocaleString("en-US", { minimumFractionDigits: 2 })} THB
   - Pending correction/confirmation: 4×50 pack format, Option 1 mapping, and AF102 COA charge
8. Seed Viability Claim reference — ${GF_SEED_VIABILITY_CLAIM_FORM.url}
   - Access currently requires Google Sign-in; obtain access or PDF/question list before adoption
9. Meeting recap / English confirmation email — date: ___

---

Decision after meeting

- Pass: regulatory OK + docs OK → marketing + conditional deposits
- Conditional: fix label/process → new version → re-check before marketing
- No written confirmation: quotation for planning only — no deposits, no PO
- GF requires PO before regulatory help: do not proceed on low-risk plan — request non-binding pilot validation

---

Demand Gate (locked 4 Sep 2026)

- Not a THB threshold from PI 20102618
- Trigger: at least one customer order on a pilot strain (AF99 / AF143 / AF02 / AF22 / AF102) + 50% deposit received
- PO qty = only lines whose customer deposits cover GF 50% for those lines (not the full 1,000-seed pilot from one pouch order)
- Then PO · GF 50% only after that customer 50% is in hand, for covered lines only
- Customer order: ___ · strain: ___ · deposit received: ___ THB
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
    th: "มีออเดอร์ลูกค้าสายนำร่อง + มัดจำ 50% เข้าแล้ว",
    en: "Pilot-strain customer order + 50% deposit received",
  },
  po_issued: {
    th: "ออก PO ให้ Green Future แล้ว",
    en: "PO issued to Green Future",
  },
};
