import { CopyShareLinkButton } from "@/components/admin/partners/CopyShareLinkButton";
import {
  COLLABORATION_PLAN_SHARE_PATH,
  CollaborationPlanDocument,
} from "@/components/partners/CollaborationPlanDocument";

export const metadata = {
  title: "Collaboration Plan · Green Future · Admin",
};

export default function GreenFuturePlanPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-900">
            Collaboration Plan
          </h2>
          <p className="max-w-2xl text-sm text-slate-500">
            แผนงานความร่วมมือ Green Future × Smile Seed Bank — แชร์ลิงก์ให้คู่ค้าอ่านได้
          </p>
        </div>
        <CopyShareLinkButton path={COLLABORATION_PLAN_SHARE_PATH} />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
        <CollaborationPlanDocument />
      </div>
    </div>
  );
}
