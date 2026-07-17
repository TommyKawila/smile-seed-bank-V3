"use client";

import { useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { Compass, Leaf, Orbit, Sun, Zap } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { parseListParam } from "@/lib/shop-attribute-filters";
import {
  shopFilterChipLeadingGlyph,
  shopQuickChipClasses,
} from "@/components/storefront/shop-filter-chip-styles";
import { floweringTypeToSlug } from "@/lib/seed-type-filter";
import { cn } from "@/lib/utils";

/** Top-bar genetics pills: single-slug active state for catalog strip. */
export function geneticsDomPillActiveSlug(raw: string | null): string {
  const list = parseListParam(raw);
  if (list.includes("sativa-dom")) return "sativa-dom";
  if (list.includes("indica-dom")) return "indica-dom";
  if (list.includes("hybrid")) return "hybrid";
  return "";
}

export type BreederTypeOption = { slug: string; label: string; count: number };

const serif = "font-sans";
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

const chipBase =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border px-2.5 py-1.5 font-sans text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800/25 focus-visible:ring-offset-2";
const chipOff =
  "border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/40/50";
const chipOn =
  "border-primary/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80";

export function BreederTypeFilter({
  options,
  allLabel,
  paramKey = "ft",
  ariaLabel,
  variant = "default",
  appearance = "tabs",
  showAllButton = true,
  resolveActiveSlug,
  clearableByReselect = false,
  compact = false,
}: {
  options: BreederTypeOption[];
  allLabel: string;
  paramKey?: string;
  ariaLabel?: string;
  /** Kept for API compatibility; styling is unified lab index tabs. */
  variant?: "default" | "journal";
  /** `quick-chips`: same pills as `ShopQuickFilterBar`. `chips`: legacy emerald pills. */
  appearance?: "tabs" | "chips" | "quick-chips";
  /** Hide “All” chip (e.g. Sativa / Indica-only strip). */
  showAllButton?: boolean;
  resolveActiveSlug?: (raw: string | null) => string;
  /** Second click on active chip clears the param. */
  clearableByReselect?: boolean;
  /** Mobile strip: glyph + count, smaller pills. */
  compact?: boolean;
}) {
  void variant;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = resolveActiveSlug
    ? resolveActiveSlug(searchParams.get(paramKey))
    : floweringTypeToSlug(searchParams.get(paramKey));

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

  const selectSlug = useCallback(
    (slug: string) => {
      if (clearableByReselect && active === slug) setType(null);
      else setType(slug);
    },
    [active, clearableByReselect, setType]
  );

  if (options.length === 0) return null;

  const tabBase =
    "inline-flex shrink-0 items-center gap-2 rounded-sm border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800/25 focus-visible:ring-offset-2";

  const inactive =
    "border-border bg-muted/30 text-foreground hover:border-border hover:bg-card";
  const activeStyle = "border-emerald-800/90 bg-primary text-white shadow-sm";

  if (appearance === "quick-chips") {
    return (
      <div className="contents">
        {showAllButton ? (
          <button
            type="button"
            aria-pressed={!active}
            aria-label={`${allLabel} — ${ariaLabel ?? "Flowering type"}`}
            onClick={() => setType(null)}
            className={shopQuickChipClasses(!active, compact)}
          >
            {allLabel}
          </button>
        ) : null}
        {options.map(({ slug, label, count }) => {
          const isOn = active === slug;
          const glyph = shopFilterChipLeadingGlyph(slug);
          return (
            <button
              key={slug}
              type="button"
              aria-pressed={isOn}
              aria-label={`${label} (${count})`}
              onClick={() => selectSlug(slug)}
              className={shopQuickChipClasses(isOn, compact)}
            >
              {glyph ? <span aria-hidden>{glyph}</span> : null}
              <span>{label}</span>
              <span
                className={cn(
                  mono,
                  "text-[10px] font-medium tabular-nums",
                  isOn ? "text-white/85" : "text-muted-foreground"
                )}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (appearance === "chips") {
    return (
      <div className="contents">
        {showAllButton ? (
          <button
            type="button"
            aria-pressed={!active}
            aria-label={`${allLabel} — ${ariaLabel ?? "Flowering type"}`}
            onClick={() => setType(null)}
            className={cn(chipBase, !active ? chipOn : chipOff)}
          >
            {allLabel}
          </button>
        ) : null}
        {options.map(({ slug, label, count }) => {
          const isOn = active === slug;
          return (
            <button
              key={slug}
              type="button"
              aria-pressed={isOn}
              aria-label={`${label} (${count})`}
              onClick={() => selectSlug(slug)}
              className={cn(chipBase, isOn ? chipOn : chipOff)}
            >
              <span>{label}</span>
              <span
                className={cn(
                  mono,
                  "ml-1 text-[10px] font-medium tabular-nums text-muted-foreground",
                  isOn && "text-emerald-600/90"
                )}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-4 -mx-1 px-1">
      <div
        role="tablist"
        aria-label={ariaLabel ?? "Flowering type"}
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        {showAllButton ? (
          <button
            type="button"
            role="tab"
            aria-selected={!active}
            onClick={() => setType(null)}
            className={cn(tabBase, serif, "font-normal tracking-tight", !active ? activeStyle : inactive)}
          >
            <Compass
              className={cn(iconClass, !active ? "text-white/95" : "text-muted-foreground")}
              strokeWidth={1}
              aria-hidden
            />
            <span>{allLabel}</span>
          </button>
        ) : null}
        {options.map(({ slug, label, count }) => {
          const isOn = active === slug;
          const iconTone = isOn ? "text-white/95" : "text-muted-foreground";
          const Icon = filterIcon(slug);
          return (
            <button
              key={slug}
              type="button"
              role="tab"
              aria-selected={isOn}
              onClick={() => selectSlug(slug)}
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
                  isOn ? "text-white/90" : "text-muted-foreground"
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
