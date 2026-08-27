import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_0824_REPLY_TH_RAW,
  GREEN_FUTURE_0824_REPLY_TH_SUBJECT,
} from "@/lib/green-future-0824-reply-letter";

export const metadata = {
  title: "Reply 0824 (Thai) · Green Future · Admin",
  description: GREEN_FUTURE_0824_REPLY_TH_SUBJECT,
};

export default function GreenFuture0824ReplyThPage() {
  return (
    <GreenFutureLetterView
      title="จดหมายตอบ GF/SSB/2026-0824 (ภาษาไทย)"
      description="ฉบับหลักฐานภาษาไทยคู่กับจดหมายภาษาอังกฤษ — ขอราคาและตรวจกฎหมายเท่านั้น ไม่ใช่ PO"
      raw={GREEN_FUTURE_0824_REPLY_TH_RAW}
      lang="th"
    />
  );
}
