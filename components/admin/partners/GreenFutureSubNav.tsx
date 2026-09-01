"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin/partners/green-future", label: "Catalog", exact: true },
  {
    href: "/admin/partners/green-future/plan",
    label: "Collaboration Plan",
    exact: false,
  },
  {
    href: "/admin/partners/green-future/resale",
    label: "Resale pricing",
    exact: false,
  },
  {
    href: "/admin/partners/green-future/strategy",
    label: "GACP strategy",
    exact: false,
  },
  {
    href: "/admin/partners/green-future/mockup",
    label: "Label Mockup",
    exact: false,
  },
  {
    href: "/admin/partners/green-future/0901-reply-en",
    label: "Reply 0901 (EN)",
    exact: false,
  },
  {
    href: "/admin/partners/green-future/0901-reply-th",
    label: "Reply 0901 (TH)",
    exact: false,
  },
  {
    href: "/admin/partners/green-future/0824-reply-th",
    label: "Reply 0824 (TH)",
    exact: false,
  },
  {
    href: "/admin/partners/green-future/meeting-brief",
    label: "Meeting brief",
    exact: false,
  },
  {
    href: "/admin/partners/green-future/meeting-recap/th",
    label: "Recap (TH)",
    exact: false,
  },
  {
    href: "/admin/partners/green-future/meeting-recap/en",
    label: "Recap (EN)",
    exact: false,
  },
  {
    href: "/admin/partners/green-future/traceability-review/th",
    label: "Traceability (TH)",
    exact: false,
  },
  {
    href: "/admin/partners/green-future/traceability-review/en",
    label: "Traceability (EN)",
    exact: false,
  },
] as const;

export function GreenFutureSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-slate-200 pb-3">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
