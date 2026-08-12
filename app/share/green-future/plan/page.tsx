import { CollaborationPlanDocument } from "@/components/partners/CollaborationPlanDocument";

export const metadata = {
  title: "Collaboration Plan · Green Future × Smile Seed Bank",
  description:
    "แผนงานความร่วมมือผลิตและจัดจำหน่ายเมล็ดพันธุ์กัญชามาตรฐาน GACP ระหว่าง Green Future และ Smile Seed Bank",
};

export default function ShareGreenFuturePlanPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <p className="text-center text-xs uppercase tracking-wide text-slate-400">
          Shared document
        </p>
        <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-10">
          <CollaborationPlanDocument />
        </div>
      </div>
    </main>
  );
}
