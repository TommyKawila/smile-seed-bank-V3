import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_VARIETY_DOCS_TH_RAW,
  GREEN_FUTURE_VARIETY_DOCS_TH_SUBJECT,
} from "@/lib/green-future-variety-docs-letter";

export const metadata = {
  title: "Variety identity docs (TH) · Green Future · Admin",
  description: GREEN_FUTURE_VARIETY_DOCS_TH_SUBJECT,
};

export default function GreenFutureVarietyDocsThPage() {
  return (
    <GreenFutureLetterView
      title="ขอเอกสารระบุสายพันธุ์ (ไทย)"
      description="แฟ้มหน่วยงาน GACP ผู้ปลูก — โรงงานออกเองตาม GACP ข้อ 8 · ไม่ใช่ PO · คนละใบกับ ม.พ. ๒ ๑-๐"
      raw={GREEN_FUTURE_VARIETY_DOCS_TH_RAW}
      lang="th"
    />
  );
}
