import { GreenFutureSubNav } from "@/components/admin/partners/GreenFutureSubNav";
import {
  GF_GACP_CONSULT_HOLD,
  GF_SGF_PAUSE_ADMIN_TH,
} from "@/lib/green-future-approved-marketing";

export default function GreenFutureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Green Future
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
            Partner catalog, collaboration plan, resale pricing, GACP strategy, label mockup, and seed claim inbox.
          </p>
        </div>
        <GreenFutureSubNav />
        {GF_GACP_CONSULT_HOLD ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {GF_SGF_PAUSE_ADMIN_TH}
          </p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
