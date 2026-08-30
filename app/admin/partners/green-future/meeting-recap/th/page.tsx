import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_JULIA_MEETING_RECAP_TH_RAW,
  GREEN_FUTURE_JULIA_MEETING_RECAP_TH_SUBJECT,
} from "@/lib/green-future-julia-meeting-recap";

export const metadata = {
  title: "Meeting Recap (TH) · Green Future · Admin",
  description: GREEN_FUTURE_JULIA_MEETING_RECAP_TH_SUBJECT,
};

export default function GreenFutureMeetingRecapThPage() {
  return (
    <GreenFutureLetterView
      title="สรุปการประชุม GF × SSB — 28 ส.ค. 2026"
      description="ให้คุณจูเลียแปลส่งเจ้านาย · พิมพ์หรือ Save as PDF"
      raw={GREEN_FUTURE_JULIA_MEETING_RECAP_TH_RAW}
      internal
      lang="th"
    />
  );
}
