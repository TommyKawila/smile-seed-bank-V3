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
export const GF_INBOUND_DOA_LABEL_FIELDS_FILE =
  "gf-doa-label-fields-af99-sample.pdf";
export const GF_INBOUND_DOA_LABEL_GUIDE_FILE =
  "doa-controlled-seed-label-guide.pdf";

export const GF_INBOUND_DOCS: GfInboundDoc[] = [
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
    useTh: "ใบเสนอราคาเพื่อวางแผน ไม่ใช่ PO · รอยืนยัน 4×50 + Option 1 + ค่า COA AF102",
    useEn: "Quotation for planning, not a PO · pending 4×50 + Option 1 + AF102 COA line",
  },
];
