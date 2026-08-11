import { GreenFutureCatalogClient } from "@/components/admin/partners/GreenFutureCatalogClient";

export const metadata = {
  title: "Green Future Catalog · Admin",
};

export default function GreenFuturePartnerPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Green Future Partner Catalog
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
          B2B / GACP reference strains and partner documents. Search by variety code (
          <span className="font-mono">AF99</span>, <span className="font-mono">PF001</span>) or
          commercial name. Use code-first refs in quotes per partner guidelines.
        </p>
      </header>
      <GreenFutureCatalogClient />
    </div>
  );
}
