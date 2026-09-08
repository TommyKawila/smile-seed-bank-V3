import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_0907_REPLY_RAW,
  GREEN_FUTURE_0907_REPLY_SUBJECT,
} from "@/lib/green-future-0907-reply-letter";

export const metadata = {
  title: "Reply 0907 (EN) · Green Future · Admin",
  description: GREEN_FUTURE_0907_REPLY_SUBJECT,
};

export default function GreenFuture0907ReplyEnPage() {
  return (
    <GreenFutureLetterView
      title="Reply to GF/SSB/2026-0907 (English)"
      description="Label V.2.1, Traceability wording, Option 1 quotation confirm, GACP consult — not a PO"
      raw={GREEN_FUTURE_0907_REPLY_RAW}
      lang="en"
    />
  );
}
