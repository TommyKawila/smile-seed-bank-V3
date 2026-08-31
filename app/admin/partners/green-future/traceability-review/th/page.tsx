import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_TRACEABILITY_REVIEW_TH_RAW,
  GREEN_FUTURE_TRACEABILITY_REVIEW_TH_SUBJECT,
} from "@/lib/green-future-traceability-review-letter";

export const metadata = {
  title: "Traceability review (TH) · Green Future · Admin",
  description: GREEN_FUTURE_TRACEABILITY_REVIEW_TH_SUBJECT,
};

export default function GreenFutureTraceabilityReviewThPage() {
  return (
    <GreenFutureLetterView
      title="ขอตรวจตัวอย่างระบบ Traceability"
      description="ให้คุณจูเลียแปลส่งเจ้านาย · พิมพ์หรือ Save as PDF"
      raw={GREEN_FUTURE_TRACEABILITY_REVIEW_TH_RAW}
      lang="th"
    />
  );
}
