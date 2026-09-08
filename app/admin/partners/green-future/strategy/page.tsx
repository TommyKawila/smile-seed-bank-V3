import { GreenFutureGacpStrategyClient } from "@/components/admin/partners/GreenFutureGacpStrategyClient";
import { GfFacilityPhotosPanel } from "@/components/admin/partners/GfFacilityPhotosPanel";
import { GfInboundDocsPanel } from "@/components/admin/partners/GfInboundDocsPanel";

export const metadata = {
  title: "GACP strategy · Green Future · Admin",
};

export default function GreenFutureGacpStrategyPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900">GACP strategy</h2>
        <p className="max-w-2xl text-sm text-slate-500">
          Retail GACP packs (Domestic vs Export), GF document matrix, investment
          break-even, and RFQ checklists — internal planning only.
        </p>
      </div>
      <GfFacilityPhotosPanel />
      <GfInboundDocsPanel />
      <GreenFutureGacpStrategyClient />
    </div>
  );
}
