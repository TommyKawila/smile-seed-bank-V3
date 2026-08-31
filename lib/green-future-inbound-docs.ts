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

export const GF_INBOUND_DOCS: GfInboundDoc[] = [
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
