import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_0907_REPLY_TH_RAW,
  GREEN_FUTURE_0907_REPLY_TH_SUBJECT,
} from "@/lib/green-future-0907-reply-letter";

export const metadata = {
  title: "Reply 0907 (TH) · Green Future · Admin",
  description: GREEN_FUTURE_0907_REPLY_TH_SUBJECT,
};

export default function GreenFuture0907ReplyThPage() {
  return (
    <GreenFutureLetterView
      title="จดหมายตอบ GF/SSB/2026-0907 (ภาษาไทย)"
      description="ฉลาก V.2.1, ถ้อยคำ Traceability, ยืนยันใบ Option 1, ปรึกษาหน่วยงาน GACP — ไม่ใช่ PO"
      raw={GREEN_FUTURE_0907_REPLY_TH_RAW}
      lang="th"
    />
  );
}
