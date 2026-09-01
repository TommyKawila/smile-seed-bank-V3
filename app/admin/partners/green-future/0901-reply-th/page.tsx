import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_0901_REPLY_TH_RAW,
  GREEN_FUTURE_0901_REPLY_TH_SUBJECT,
} from "@/lib/green-future-0901-reply-letter";

export const metadata = {
  title: "Reply 0901 (TH) · Green Future · Admin",
  description: GREEN_FUTURE_0901_REPLY_TH_SUBJECT,
};

export default function GreenFuture0901ReplyThPage() {
  return (
    <GreenFutureLetterView
      title="จดหมายตอบ GF/SSB/2026-0901 (ภาษาไทย)"
      description="ฉลาก V.2, Lead Registration, รายการรูป, ขอ PI แก้ — ไม่ใช่ PO"
      raw={GREEN_FUTURE_0901_REPLY_TH_RAW}
      lang="th"
    />
  );
}
