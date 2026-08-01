import { B2BQuoteWorkspace } from "@/components/admin/b2b-quote/B2BQuoteWorkspace";

export const metadata = {
  title: "B2B Pro-Forma · Admin",
};

export default function B2BQuotePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          B2B Quotation &amp; Pro-Forma Invoice
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
          Build EUR/THB wholesale quotes, preview A4 pro-forma, save drafts, email via Resend, or
          Save as PDF.
        </p>
      </header>
      <B2BQuoteWorkspace />
    </div>
  );
}
