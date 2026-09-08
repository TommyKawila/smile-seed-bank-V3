/** Internal brief — Chiang Mai authority GACP consultation (GF/SSB/2026-0907 §5) */

import {
  GF_INBOUND_GACP_TRACEABILITY_FILE,
  GF_INBOUND_QUOTATION_OPTION1_FILE,
  GF_INBOUND_SEED_PROCESS_FILE,
} from "@/lib/green-future-inbound-docs";
import { GF_PHOTO_PICKS } from "@/lib/green-future-photo-request";
import { adminPartnerDocUrl } from "@/lib/partner-docs-path";

export const GREEN_FUTURE_GACP_CONSULT_SUBJECT =
  "Internal — Chiang Mai authority GACP consultation brief (SGF Seeds + traceability)";

export const GACP_CONSULT_CHECKLIST = [
  {
    id: "labelled-mock-pouch",
    labelTh: "ซอง mock-up ติดฉลาก V.2.1 จริง (เปล่า ไม่ใส่เมล็ด)",
    labelEn: "Labelled V.2.1 mock-up pouch (empty — no real seeds)",
    note: "รอ GF ส่งคืนหลัง heat seal — ซอง+ฉลากทดสอบอยู่ที่ GF",
  },
  {
    id: "label-v21",
    labelTh: "ฉลาก V.2.1 PDF (วันที่รวบรวมอย่างเดียว)",
    labelEn: "Label V.2.1 PDF (collection date only)",
    note: "จาก Label Mockup admin — export PDF",
  },
  {
    id: "gacp-cert-photo",
    labelTh: "รูปใบ TH-GACP 15/2569 ติดที่สถานที่ (รูป E)",
    labelEn: "TH-GACP certificate on site (photo E)",
    href: adminPartnerDocUrl(`photos/${GF_PHOTO_PICKS.find((p) => p.id === "e-gacp-cert")!.fileName}`),
  },
  {
    id: "facility-photos",
    labelTh: "รูปโรงงาน A–F ลายน้ำ GF (admin เท่านั้น)",
    labelEn: "Facility photos A–F with GF watermark (admin only)",
    note: "/admin/partners/green-future",
  },
  {
    id: "gacp-deck",
    labelTh: "แผนภาพ TH GACP — ตรวจสอบย้อนกลับ",
    labelEn: "TH GACP visual process map",
    href: adminPartnerDocUrl(GF_INBOUND_GACP_TRACEABILITY_FILE),
  },
  {
    id: "process-deck",
    labelTh: "ชุดภาพกระบวนการผลิตเมล็ด (TH)",
    labelEn: "Seed production process photo set (TH)",
    href: adminPartnerDocUrl(GF_INBOUND_SEED_PROCESS_FILE),
  },
  {
    id: "traceability",
    labelTh: "ลิงก์ /traceability (โหมด Preview)",
    labelEn: "Link /traceability (Preview mode)",
    href: "https://www.smileseedbank.com/traceability",
  },
  {
    id: "pp3-gf",
    labelTh: "พ.พ.3 Green Future (Global) Co., Ltd.",
    labelEn: "Por.Por.3 Green Future (Global) Co., Ltd.",
    note: "จากเอกสารคู่ค้า / About legal docs",
  },
  {
    id: "pp4-tmy",
    labelTh: "พ.พ.4 หจก. ทีเอ็มวาย อะโกร เทรด",
    labelEn: "Por.Por.4 T.M.Y Agro Trade Limited Partnership",
    note: "Admin Settings / About",
  },
  {
    id: "quotation",
    labelTh: "ใบเสนอราคา Option 1 (วางแผน — ไม่ใช่ PO)",
    labelEn: "Option 1 quotation (planning — not a PO)",
    href: adminPartnerDocUrl(GF_INBOUND_QUOTATION_OPTION1_FILE),
  },
] as const;

export const GREEN_FUTURE_GACP_CONSULT_RAW = `Subject: ${GREEN_FUTURE_GACP_CONSULT_SUBJECT}

เอกสารภายใน Smile Seed Bank — สำหรับนัดปรึกษาหน่วยงานเชียงใหม่
อ้างอิง GF/SSB/2026-0907 (7 ก.ย. 2026) — Green Future ยืนยันให้ดำเนินการได้หลังทดสอบฉลาก/ซองผ่าน

**หมายเหตุ:** ซองตัวอย่างและฉลากทดสอบ heat seal อยู่ที่ GF — ต้องให้ GF ส่งคืนซอง mock-up ติดฉลาก V.2.1 จริง (ด้านในไม่ใส่เมล็ด) ก่อนนัดหน่วยงาน

---

คำถามหลัก (ขอคำตอบเป็นลายลักษณ์อักษร)

ผู้ปลูกกัญชาที่มีใบอนุญาตในประเทศไทย สามารถใช้เมล็ดพันธุ์ **SGF SEEDS** (ผลิตและบรรจุโดย Green Future (Global) Co., Ltd. ภายใต้มาตรฐาน TH GACP ของสถานที่ผลิต) พร้อมเอกสารล็อต / ระบบตรวจสอบย้อนกลับ (Traceability) และเอกสารประกอบที่ Smile Seed Bank จัดให้ ในการยื่นขออนุญาตปลูกในกรอบ GACP ได้หรือไม่

โดยเฉพาะ:
1. แหล่งเมล็ดและเอกสารประกอบที่หน่วยงานต้องการ มีครบหรือขาดอะไร
2. ใบรับรอง TH GACP ของสถานที่ผลิต กับเอกสารล็อต/Traceability ใช้ประกอบคำขอของผู้ปลูกได้ในระดับใด (ไม่ใช่ใบ GACP ของล็อตเมล็ด)
3. ฉลากเมล็ดพันธุ์ควบคุมตามตัวอย่างกรมวิชาการเกษตร (V.2.1) มีประเด็นใดที่ต้องปรับก่อนยื่น

---

ขอบเขตที่ชี้แจงกับหน่วยงาน

- Smile Seed Bank (หจก. ทีเอ็มวาย อะโกร เทรด) = ผู้จำหน่าย พ.พ.4 · ไม่เปิด แบ่ง หรือเปลี่ยนฉลากเมล็ด
- SGF SEEDS = โปรแกรมเมล็ดเอกสาร GF × Smile · ไม่ใช่ genetics อื่น
- หน้า Traceability ยังเป็น Preview จนกว่าล็อตแรกเข้าและ GF อนุมัติ Live
- ใบเสนอราคา Option 1 ใช้วางแผนเท่านั้น ยังไม่ใช่ PO

---

รายการเอกสารที่พกไป (checklist)

${GACP_CONSULT_CHECKLIST.map((item, i) => `${i + 1}. ${item.labelTh}${item.href ? ` — ${item.href}` : ""}${item.note ? ` (${item.note})` : ""}`).join("\n")}

---

หลังได้คำตอบ

1. เก็บสำเนา/อีเมล/หนังสือจากหน่วยงานใน evidence pack (lib/green-future-gate-evidence.ts)
2. ส่งสำเนาให้ Green Future ตาม GF/SSB/2026-0907
3. อัปเดต Regulatory Gate checklist ใน admin

---

หมายเหตุ: ยังไม่ออก PO / ไม่โอนมัดจำ GF จนกว่า Gate ครบตาม lib/green-future-po-gate.ts
`;
