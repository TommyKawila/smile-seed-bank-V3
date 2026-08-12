import { GreenFutureCatalogClient } from "@/components/admin/partners/GreenFutureCatalogClient";

export const metadata = {
  title: "Green Future Catalog · Admin",
};

export default function GreenFuturePartnerPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900">
          Partner Catalog
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
          B2B / GACP reference strains and partner documents. Search by variety
          code (<span className="font-mono">AF99</span>,{" "}
          <span className="font-mono">PF001</span>) or commercial name. Use
          code-first refs in quotes per partner guidelines.
        </p>
      </div>
      <GreenFutureCatalogClient />
    </div>
  );
}
