import { BusinessDocumentDispatcher } from "@/components/admin/business-document/BusinessDocumentDispatcher";

export const metadata = {
  title: "Business Document Dispatcher · Admin",
};

export default function BusinessDocumentDispatcherPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Business Document &amp; Email Dispatcher
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
          Preview, edit, email, or export partnership inquiry letters — UI only; delivery runs via
          isolated service layers.
        </p>
      </header>
      <BusinessDocumentDispatcher />
    </div>
  );
}
