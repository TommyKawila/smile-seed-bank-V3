import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_TRACEABILITY_REVIEW_EN_RAW,
  GREEN_FUTURE_TRACEABILITY_REVIEW_EN_SUBJECT,
} from "@/lib/green-future-traceability-review-letter";

export const metadata = {
  title: "Traceability review (EN) · Green Future · Admin",
  description: GREEN_FUTURE_TRACEABILITY_REVIEW_EN_SUBJECT,
};

export default function GreenFutureTraceabilityReviewEnPage() {
  return (
    <GreenFutureLetterView
      title="Traceability Pack preview — request for GF review"
      description="English email for Julia / GF · Print or Save as PDF"
      raw={GREEN_FUTURE_TRACEABILITY_REVIEW_EN_RAW}
      lang="en"
    />
  );
}
