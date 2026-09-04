import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_0904_REPLY_TH_RAW,
  GREEN_FUTURE_0904_REPLY_TH_SUBJECT,
} from "@/lib/green-future-0904-reply-letter";

export const metadata = {
  title: "Reply 0904 (TH) · Green Future · Admin",
  description: GREEN_FUTURE_0904_REPLY_TH_SUBJECT,
};

export default function GreenFuture0904ReplyThPage() {
  return (
    <GreenFutureLetterView
      title="จดหมายตอบ GF/SSB/2026-0904 (ภาษาไทย)"
      description="Traceability Preview, รูป, Lead Registration, PDF ฉลาก V.2, ขอใบเสนอราคา Option 1, ล็อกลำดับก่อนโอน/PO — ไม่ใช่ PO"
      raw={GREEN_FUTURE_0904_REPLY_TH_RAW}
      lang="th"
    />
  );
}
