import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_JULIA_MEETING_RECAP_EN_RAW,
  GREEN_FUTURE_JULIA_MEETING_RECAP_EN_SUBJECT,
} from "@/lib/green-future-julia-meeting-recap";

export const metadata = {
  title: "Meeting Recap (EN) · Green Future · Admin",
  description: GREEN_FUTURE_JULIA_MEETING_RECAP_EN_SUBJECT,
};

export default function GreenFutureMeetingRecapEnPage() {
  return (
    <GreenFutureLetterView
      title="GF × SSB Meeting Recap — 28 Aug 2026"
      description="English confirmation copy for email / evidence · Print or Save as PDF"
      raw={GREEN_FUTURE_JULIA_MEETING_RECAP_EN_RAW}
      internal
      lang="en"
    />
  );
}
