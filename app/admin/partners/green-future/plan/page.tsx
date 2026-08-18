import { Suspense } from "react";
import { CollaborationPlanView } from "@/components/partners/CollaborationPlanDocument";

export const metadata = {
  title: "Collaboration Plan · Green Future · Admin",
};

export default function GreenFuturePlanPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <CollaborationPlanView adminChrome />
    </Suspense>
  );
}
