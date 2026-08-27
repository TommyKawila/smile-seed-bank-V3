import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GREEN_FUTURE_JULIA_MEETING_BRIEF_RAW,
  GREEN_FUTURE_JULIA_MEETING_BRIEF_SUBJECT,
} from "@/lib/green-future-julia-meeting-brief";

export const metadata = {
  title: "Julia Meeting Brief · Green Future · Admin",
  description: GREEN_FUTURE_JULIA_MEETING_BRIEF_SUBJECT,
};

export default function GreenFutureMeetingBriefPage() {
  return (
    <GreenFutureLetterView
      title="Brief ประชุมคุณจูเลีย — 28 ส.ค. 2026"
      description="เอกสารภายใน Smile Seed Bank — ไม่ส่งให้ Green Future · พิมพ์หรือ Save as PDF เอาเข้าห้องประชุม"
      raw={GREEN_FUTURE_JULIA_MEETING_BRIEF_RAW}
      internal
      lang="th"
    />
  );
}
