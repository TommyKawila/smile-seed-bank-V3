import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_0904_REPLY_RAW,
  GREEN_FUTURE_0904_REPLY_SUBJECT,
} from "@/lib/green-future-0904-reply-letter";

export const metadata = {
  title: "Reply 0904 (EN) · Green Future · Admin",
  description: GREEN_FUTURE_0904_REPLY_SUBJECT,
};

export default function GreenFuture0904ReplyEnPage() {
  return (
    <GreenFutureLetterView
      title="Reply to GF/SSB/2026-0904 (English)"
      description="Traceability Preview, photos, Lead Registration, Label V.2 PDF, Option 1 quotation, locked pay/PO sequence — not a PO"
      raw={GREEN_FUTURE_0904_REPLY_RAW}
      lang="en"
    />
  );
}
