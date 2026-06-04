"use client";

import { useCallback, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Zap, Leaf, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  geneticsDomPillActiveSlug,
  type BreederTypeOption,
} from "@/components/storefront/BreederTypeFilter";
import { ShopQuickFilterBar } from "@/components/storefront/ShopQuickFilterBar";
import {
  CATALOG_GENETICS_STRIP_LABELS,
  CATALOG_GENETICS_STRIP_SLUGS,
  CATALOG_SEX_STRIP_LABELS,
  CATALOG_SEX_STRIP_SLUGS,
  type CatalogSexStripSlug,
} from "@/lib/catalog-filter-strip-labels";
import { parseListParam } from "@/lib/shop-attribute-filters";
import { floweringTypeToSlug } from "@/lib/seed-type-filter";
import { shopFilterChipLeadingGlyph } from "@/components/storefront/shop-filter-chip-styles";
import { cn } from "@/lib/utils";

const FLOWERING_QUICK_SLUGS = ["auto", "photo", "photo-ff"] as const;

const FLOWERING_ICONS: Record<(typeof FLOWERING_QUICK_SLUGS)[number], LucideIcon> = {
  auto: Leaf,
  photo: Sun,
  "photo-ff": Zap,
};

type TFn = (th: string, en: string) => string;

function SidebarFilterRow({
  label,
  children,
  presentation,
}: {
  label: string;
  children: ReactNode;
  presentation: "sidebar" | "mobile";
}) {
  return (
    <div className={presentation === "mobile" ? "space-y-2" : "space-y-2.5"}>
      <p
        className={cn(
          "font-bold uppercase tracking-wide text-primary",
          presentation === "mobile" ? "text-[11px]" : "text-xs"
        )}
      >
        {label}
      </p>
      <div className="grid grid-cols-3 gap-2">{children}</div>
    </div>
  );
}

function QuickPill({
  active,
  onClick,
  label,
  count,
  glyph,
  icon: Icon,
  presentation,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  glyph?: string | null;
  icon?: LucideIcon;
  presentation: "sidebar" | "mobile";
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1.5 py-2 text-center font-sans transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
        presentation === "mobile" ? "min-h-12" : "min-h-11",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
          : "border-primary/15 bg-white text-primary hover:border-primary/35 hover:bg-primary/[0.06]"
      )}
    >
      {Icon ? (
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary-foreground" : "text-primary")} />
      ) : glyph ? (
        <span className="text-base leading-none" aria-hidden>
          {glyph}
        </span>
      ) : null}
      <span className={cn("text-[11px] font-semibold leading-tight", active && "text-primary-foreground")}>
        {label}
      </span>
      {count != null ? (
        <span
          className={cn(
            "text-[10px] font-bold tabular-nums",
            active ? "text-primary-foreground/85" : "text-primary/45"
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export type CatalogSidebarQuickFiltersProps = {
  replaceCatalog: (mutate: (sp: URLSearchParams) => void) => void;
  t: TFn;
  showClearanceFilter: boolean;
  floweringOptions: BreederTypeOption[];
  geneticsOptions: BreederTypeOption[];
  sexCounts?: Partial<Record<CatalogSexStripSlug, number>>;
  presentation?: "sidebar" | "mobile";
};

/** Quick filters merged into sidebar / mobile sheet — Type → Genetics → Sex. */
export function CatalogSidebarQuickFilters({
  replaceCatalog,
  t,
  showClearanceFilter,
  floweringOptions,
  geneticsOptions,
  sexCounts,
  presentation = "sidebar",
}: CatalogSidebarQuickFiltersProps) {
  const searchParams = useSearchParams();
  const ftActive = floweringTypeToSlug(searchParams.get("ft"));
  const geneticsActive = geneticsDomPillActiveSlug(searchParams.get("genetics"));
  const sexList = parseListParam(searchParams.get("sex"));

  const setFt = useCallback(
    (slug: string) => {
      replaceCatalog((sp) => {
        const cur = floweringTypeToSlug(sp.get("ft"));
        if (cur === slug) sp.delete("ft");
        else sp.set("ft", slug);
      });
    },
    [replaceCatalog]
  );

  const setGenetics = useCallback(
    (slug: string) => {
      replaceCatalog((sp) => {
        const cur = geneticsDomPillActiveSlug(sp.get("genetics"));
        if (cur === slug) sp.delete("genetics");
        else sp.set("genetics", slug);
      });
    },
    [replaceCatalog]
  );

  const setSex = useCallback(
    (slug: CatalogSexStripSlug) => {
      replaceCatalog((sp) => {
        const cur = parseListParam(sp.get("sex"));
        if (cur.length === 1 && cur[0] === slug) sp.delete("sex");
        else sp.set("sex", slug);
      });
    },
    [replaceCatalog]
  );

  const floweringRows = floweringOptions.filter((o) =>
    (FLOWERING_QUICK_SLUGS as readonly string[]).includes(o.slug)
  );

  const geneticsRows =
    geneticsOptions.length > 0
      ? geneticsOptions
      : CATALOG_GENETICS_STRIP_SLUGS.map((slug) => {
          const labels = CATALOG_GENETICS_STRIP_LABELS[slug];
          return {
            slug,
            label: t(labels.th, labels.en),
            count: 0,
          };
        });

  return (
    <div
      className={cn(
        "space-y-4",
        "rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.06] via-white to-secondary/30 p-4 shadow-sm"
      )}
    >
      <div className="flex flex-wrap gap-2 border-b border-primary/10 pb-3">
        <ShopQuickFilterBar
          replaceCatalog={replaceCatalog}
          t={t}
          showClearance={showClearanceFilter}
          compact
        />
      </div>

      {floweringRows.length > 0 ? (
        <SidebarFilterRow label={t("ประเภท", "Type")} presentation={presentation}>
          {floweringRows.map(({ slug, label, count }) => {
            const key = slug as (typeof FLOWERING_QUICK_SLUGS)[number];
            const Icon = FLOWERING_ICONS[key];
            return (
              <QuickPill
                key={slug}
                active={ftActive === slug}
                onClick={() => setFt(slug)}
                label={label}
                count={count}
                icon={Icon}
                presentation={presentation}
              />
            );
          })}
        </SidebarFilterRow>
      ) : null}

      <SidebarFilterRow label={t("พันธุกรรม", "Genetics")} presentation={presentation}>
        {geneticsRows.map(({ slug, label, count }) => (
          <QuickPill
            key={slug}
            active={geneticsActive === slug}
            onClick={() => setGenetics(slug)}
            label={label}
            count={count}
            glyph={shopFilterChipLeadingGlyph(slug)}
            presentation={presentation}
          />
        ))}
      </SidebarFilterRow>

      <SidebarFilterRow label={t("เพศ", "Sex")} presentation={presentation}>
        {CATALOG_SEX_STRIP_SLUGS.map((slug) => {
          const labels = CATALOG_SEX_STRIP_LABELS[slug];
          const on = sexList.includes(slug) && sexList.length === 1;
          return (
            <QuickPill
              key={slug}
              active={on}
              onClick={() => setSex(slug)}
              label={t(labels.th, labels.en)}
              count={sexCounts?.[slug] ?? 0}
              glyph={slug === "feminized" ? "♀" : "♂"}
              presentation={presentation}
            />
          );
        })}
      </SidebarFilterRow>
    </div>
  );
}
