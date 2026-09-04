import { adminPartnerDocUrl } from "@/lib/partner-docs-path";
import { GF_PROFORMA_20260826 } from "@/lib/green-future-proforma-20260826";

/** GF originals in `data/partners/green-future/documents/` — admin only, not /public. */
export type GfInboundDoc = {
  id: string;
  refCode: string;
  titleTh: string;
  titleEn: string;
  issuedAt: string;
  fileName: string;
  fileUrl: string;
  useTh: string;
  useEn: string;
};

export const GF_INBOUND_0824_FILE = "gf-ssb-2026-0824-response-en.pdf";
export const GF_INBOUND_PROFORMA_FILE = "gf-proforma-20102618-20260826.pdf";
export const GF_INBOUND_0901_FILE = "gf-ssb-2026-0901-confirmation-en.pdf";
export const GF_INBOUND_0904_FILE = "gf-ssb-2026-0904-confirmation-en.pdf";
export const GF_INBOUND_GACP_TRACEABILITY_FILE = "gf-gacp-traceability-th-en.pdf";
export const GF_INBOUND_SEED_PROCESS_FILE = "gf-seed-production-process-th.pdf";
export const GF_INBOUND_QUOTATION_V01_FILE = "gf-quotation-v01-tmy-agro-20102618.pdf";
export const GF_INBOUND_DOA_LABEL_FIELDS_FILE =
  "gf-doa-label-fields-af99-sample.pdf";
export const GF_INBOUND_DOA_LABEL_GUIDE_FILE =
  "doa-controlled-seed-label-guide.pdf";

export const GF_INBOUND_DOCS: GfInboundDoc[] = [
  {
    id: "gf-0904",
    refCode: "GF/SSB/2026-0904",
    titleTh: "ยืนยัน Traceability, ฉลาก V.2, Lead Registration และใบเสนอราคา (4 ก.ย. 2026)",
    titleEn: "Confirmation — Traceability, Label V.2, Lead Registration & Quotation (4 Sep 2026)",
    issuedAt: "2026-09-04",
    fileName: GF_INBOUND_0904_FILE,
    fileUrl: adminPartnerDocUrl(GF_INBOUND_0904_FILE),
    useTh:
      "Preview เท่านั้นจนกว่าล็อตรอบแรก + อนุมัติ Live · ขอ PDF ฉลากไม่ใช้ลิงก์ล็อกอิน · ยืนยัน 4×50 Option 1 · Lead Registration มีข้อยกเว้นลูกค้าเดิม",
    useEn:
      "Stay Preview until first lot + written Live · send Label V.2 PDF not login link · 4×50 Option 1 confirmed · Lead Registration with prior-customer carve-out",
  },
  {
    id: "gf-gacp-traceability-deck",
    refCode: "GF/GACP/traceability-map",
    titleTh: "แผนภาพ TH GACP — ตรวจสอบย้อนกลับและการควบคุม (16 หน้า)",
    titleEn: "TH GACP visual process map — traceability & control (16 pp)",
    issuedAt: "2026-09-04",
    fileName: GF_INBOUND_GACP_TRACEABILITY_FILE,
    fileUrl: adminPartnerDocUrl(GF_INBOUND_GACP_TRACEABILITY_FILE),
    useTh:
      "หลักฐานสถานที่ผลิต ไม่ใช่ใบ GACP ของล็อตเมล็ด · ใช้หลังอนุมัติรายภาพ + ลายน้ำ GF · เก็บเมล็ดสำเร็จรูป +5°C",
    useEn:
      "Facility evidence, not a seed-lot GACP certificate · per-image approval + GF watermark · finished seed +5°C",
  },
  {
    id: "gf-seed-production-process",
    refCode: "GF/process/photo-set",
    titleTh: "กระบวนการผลิตและการจัดการเมล็ดพันธุ์ (ชุดภาพ TH)",
    titleEn: "Seed production & handling process (TH photo set)",
    issuedAt: "2026-09-04",
    fileName: GF_INBOUND_SEED_PROCESS_FILE,
    fileUrl: adminPartnerDocUrl(GF_INBOUND_SEED_PROCESS_FILE),
    useTh:
      "แยกรหัสรายต้น/ล็อตตลอดสาย · บรรจุแยกสาย · เก็บ +5°C กันแสง · ใช้ประกอบแฟ้มฟาร์มหลังอนุมัติภาพ",
    useEn:
      "Plant/lot ID retained end-to-end · packed by strain · +5°C light-protected storage · farm file use after photo approval",
  },
  {
    id: "gf-quotation-v01",
    refCode: "PI 20102618 / Quotation V01",
    titleTh: "Quotation V01 TMY Agro — ยังเป็น PI 26 ส.ค. (ไม่ใช่ Option 1 ที่แก้)",
    titleEn: "Quotation V01 TMY Agro — still the 26 Aug PI (not the Option 1 revision)",
    issuedAt: "2026-08-26",
    fileName: GF_INBOUND_QUOTATION_V01_FILE,
    fileUrl: adminPartnerDocUrl(GF_INBOUND_QUOTATION_V01_FILE),
    useTh:
      "Invoice 20102618 · ใช้ได้ถึง 9 ก.ย. · ยังคิด COA AF102 + มัดจำ 50% ก่อนแล็บ · อย่าใช้เป็น PO Option 1",
    useEn:
      "Invoice 20102618 · valid to 9 Sep · still AF102 COA line + 50% before lab · do not treat as Option 1 PO",
  },
  {
    id: "gf-0901",
    refCode: "GF/SSB/2026-0901",
    titleTh: "จดหมายยืนยันหลังประชุม (1 ก.ย. 2026)",
    titleEn: "Post-meeting confirmation (1 Sep 2026)",
    issuedAt: "2026-09-01",
    fileName: GF_INBOUND_0901_FILE,
    fileUrl: adminPartnerDocUrl(GF_INBOUND_0901_FILE),
    useTh:
      "ยืนยัน recap · ฉลากตามตัวอย่างกรมฯ (ไม่มีใบรับรอง) · Lead Registration · รูปฟาร์ม · PI=Quotation",
    useEn:
      "Recap confirmed · DOA label reference (no formal approval) · Lead Registration · farm photos · PI=Quotation",
  },
  {
    id: "gf-doa-label-fields",
    refCode: "GF/DOA/AF99-sample",
    titleTh: "ฟิลด์ฉลากบังคับ — ตัวอย่าง AF99 (GF)",
    titleEn: "Mandatory label fields — AF99 sample (GF)",
    issuedAt: "2026-09-01",
    fileName: GF_INBOUND_DOA_LABEL_FIELDS_FILE,
    fileUrl: adminPartnerDocUrl(GF_INBOUND_DOA_LABEL_FIELDS_FILE),
    useTh: "ออกแบบฉลาก V.2 · 5.5×5.5 cm · ค่างอก/บริสุทธิ์ = ค่าล็อตจริง ไม่ใช่ 100%",
    useEn:
      "Label V.2 design · 5.5×5.5 cm · germ/purity = actual lot values, not 100% template",
  },
  {
    id: "gf-doa-label-guide",
    refCode: "DOA/controlled-seed-label",
    titleTh: "คู่มือฉลากเมล็ดพันธุ์ควบคุม (กรมวิชาการเกษตร)",
    titleEn: "Controlled seed label guide (Department of Agriculture)",
    issuedAt: "2026-09-01",
    fileName: GF_INBOUND_DOA_LABEL_GUIDE_FILE,
    fileUrl: adminPartnerDocUrl(GF_INBOUND_DOA_LABEL_GUIDE_FILE),
    useTh: "14 ฟิลด์บังคับ · ตัวอย่างถูก/ผิด · บทลงโทษ ม.34–38",
    useEn:
      "14 mandatory fields · correct/incorrect examples · penalties under Acts 34–38",
  },
  {
    id: "gf-0824",
    refCode: "GF/SSB/2026-0824",
    titleTh: "จดหมายตอบ Green Future (24 ส.ค. 2026)",
    titleEn: "Green Future response letter (24 Aug 2026)",
    issuedAt: "2026-08-24",
    fileName: GF_INBOUND_0824_FILE,
    fileUrl: adminPartnerDocUrl(GF_INBOUND_0824_FILE),
    useTh: "กรอบที่ปิดแล้ว · อย่าเปิดเจรจาใหม่ · ใช้วาง Gate / recap / จดหมายตอบ",
    useEn: "Closed framework — do not reopen · use for Gate, recap, and reply letters",
  },
  {
    id: "gf-pi-20102618",
    refCode: GF_PROFORMA_20260826.invoiceNo,
    titleTh: "Pro Forma Invoice — หจก. ทีเอ็มวาย อะโกร เทรด",
    titleEn: "Pro Forma Invoice — T.M.Y Agro Trade Limited Partnership",
    issuedAt: GF_PROFORMA_20260826.issuedOn,
    fileName: GF_INBOUND_PROFORMA_FILE,
    fileUrl: adminPartnerDocUrl(GF_INBOUND_PROFORMA_FILE),
    useTh:
      "ใบเสนอราคาเพื่อวางแผน ไม่ใช่ PO · ชุด 4 ก.ย. ส่งไฟล์ซ้ำนี้มาในชื่อ Quotation V01 · ยังมี COA AF102 — รอฉบับ Option 1",
    useEn:
      "Quotation for planning, not a PO · 4 Sep packet re-sent this as Quotation V01 · still AF102 COA — wait for Option 1 revision",
  },
];
