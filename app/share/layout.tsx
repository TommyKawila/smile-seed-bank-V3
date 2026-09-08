import type { ReactNode } from "react";

/** Bulk / mockup share links — light quote UI, not storefront V4 dark. */
export default function ShareLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
}
