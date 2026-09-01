import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_0901_REPLY_RAW,
  GREEN_FUTURE_0901_REPLY_SUBJECT,
} from "@/lib/green-future-0901-reply-letter";

export const metadata = {
  title: "Reply 0901 (EN) · Green Future · Admin",
  description: GREEN_FUTURE_0901_REPLY_SUBJECT,
};

export default function GreenFuture0901ReplyEnPage() {
  return (
    <GreenFutureLetterView
      title="Reply to GF/SSB/2026-0901 (English)"
      description="Label V.2, Lead Registration, photo list, revised PI — not a PO"
      raw={GREEN_FUTURE_0901_REPLY_RAW}
      lang="en"
    />
  );
}
