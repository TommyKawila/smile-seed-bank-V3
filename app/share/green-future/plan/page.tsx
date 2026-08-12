import { Suspense } from "react";
import { CollaborationPlanView } from "@/components/partners/CollaborationPlanDocument";

export const metadata = {
  title: "Collaboration Plan · Green Future × Smile Seed Bank",
  description:
    "GACP seed collaboration plan between Green Future and Smile Seed Bank / แผนงานความร่วมมือผลิตและจัดจำหน่ายเมล็ดพันธุ์กัญชามาตรฐาน GACP",
};

export default function ShareGreenFuturePlanPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <p className="text-center text-xs uppercase tracking-wide text-slate-400">
          Shared document
        </p>
        <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading…</p>}>
          <CollaborationPlanView />
        </Suspense>
      </div>
    </main>
  );
}
