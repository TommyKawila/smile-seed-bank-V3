"use client";

import { useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { Compass, Leaf, Orbit, Sun, Zap } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { floweringTypeToSlug } from "@/lib/seed-type-filter";
import { cn } from "@/lib/utils";

export type BreederTypeOption = { slug: string; label: string; count: number };

const serif = "font-[family-name:var(--font-journal-product-serif)]";
const mono = "font-[family-name:var(--font-journal-product-mono)]";

function filterIcon(slug: string): LucideIcon {
  switch (slug) {
    case "auto":
      return Leaf;
    case "photo":
      return Sun;
    case "photo-3n":
      return Orbit;
    default:
      return Sun;
  }
}

const iconClass = "h-3.5 w-3.5 shrink-0";

export function BreederTypeFilter({
  options,
  allLabel,
  paramKey = "ft",
  ariaLabel,
  variant = "default",
}: {
  options: BreederTypeOption[];
  allLabel: string;
  paramKey?: string;
  ariaLabel?: string;
  /** Kept for API compatibility; styling is unified lab index tabs. */
  variant?: "default" | "journal";
}) {
  void variant;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = floweringTypeToSlug(searchParams.get(paramKey));

  const setType = useCallback(
    (slug: string | null) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (slug == null || slug === "") sp.delete(paramKey);
      else sp.set(paramKey, slug);
      const q = sp.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, paramKey]
  );

  if (options.length === 0) return null;

  const tabBase =
    "inline-flex shrink-0 items-center gap-2 rounded-sm border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800/25 focus-visible:ring-offset-2";

  const inactive =
    "border-zinc-200/90 bg-zinc-50/90 text-zinc-800 hover:border-zinc-300 hover:bg-white";
  const activeStyle = "border-emerald-800/90 bg-emerald-800 text-white shadow-sm";

  return (
    <div className="mb-4 -mx-1 px-1">
      <div
        role="tablist"
        aria-label={ariaLabel ?? "Flowering type"}
        className="flex flex-wrap gap-2 border-b border-zinc-100 pb-3"
      >
        <button
          type="button"
          role="tab"
          aria-selected={!active}
          onClick={() => setType(null)}
          className={cn(tabBase, serif, "font-normal tracking-tight", !active ? activeStyle : inactive)}
        >
          <Compass
            className={cn(iconClass, !active ? "text-white/95" : "text-zinc-500")}
            strokeWidth={1}
            aria-hidden
          />
          <span>{allLabel}</span>
        </button>
        {options.map(({ slug, label, count }) => {
          const isOn = active === slug;
          const iconTone = isOn ? "text-white/95" : "text-zinc-500";
          const Icon = filterIcon(slug);
          return (
            <button
              key={slug}
              type="button"
              role="tab"
              aria-selected={isOn}
              onClick={() => setType(slug)}
              className={cn(tabBase, serif, "font-normal tracking-tight", isOn ? activeStyle : inactive)}
            >
              {slug === "photo-ff" ? (
                <span className="inline-flex shrink-0 items-center gap-0.5" aria-hidden>
                  <Sun className={cn(iconClass, iconTone)} strokeWidth={1} />
                  <Zap className={cn(iconClass, iconTone)} strokeWidth={1} />
                </span>
              ) : (
                <Icon className={cn(iconClass, iconTone)} strokeWidth={1} aria-hidden />
              )}
              <span>{label}</span>
              <span
                className={cn(
                  mono,
                  "text-[11px] font-medium tabular-nums",
                  isOn ? "text-white/90" : "text-zinc-500"
                )}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
