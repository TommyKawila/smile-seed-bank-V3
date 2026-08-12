import { GreenFutureSubNav } from "@/components/admin/partners/GreenFutureSubNav";

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
            Partner catalog, collaboration plan, and seed label mockup tools.
          </p>
        </div>
        <GreenFutureSubNav />
      </header>
      {children}
    </div>
  );
}
