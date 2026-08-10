"use client";

import { useCallback, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  geneticsDomPillActiveSlug,
  type BreederTypeOption,
} from "@/components/storefront/BreederTypeFilter";
import { ShopQuickFilterBar } from "@/components/storefront/ShopQuickFilterBar";
import { SeedsFilterIconBadge } from "@/components/storefront/seeds-filter-icon-badge";
import {
  CATALOG_GENETICS_STRIP_LABELS,
  CATALOG_GENETICS_STRIP_SLUGS,
  CATALOG_SEX_STRIP_LABELS,
  CATALOG_SEX_STRIP_SLUGS,
  type CatalogSexStripSlug,
} from "@/lib/catalog-filter-strip-labels";
import { parseListParam } from "@/lib/shop-attribute-filters";
import { floweringTypeToSlug } from "@/lib/seed-type-filter";
import { cn } from "@/lib/utils";

const FLOWERING_QUICK_SLUGS = ["auto", "photo", "photo-ff"] as const;

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
          "text-[10px] font-medium uppercase tracking-wide text-zinc-500",
          presentation === "mobile" && "text-[11px]"
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
  iconSlug,
  glyph,
  presentation,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  iconSlug?: string;
  glyph?: string | null;
  presentation: "sidebar" | "mobile";
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center font-sans transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40",
        presentation === "mobile" ? "min-h-12" : "min-h-11",
        active
          ? "border-zinc-600 bg-zinc-800/80 text-zinc-100"
          : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-300"
      )}
    >
      {iconSlug ? (
        <SeedsFilterIconBadge slug={iconSlug} active={active} size="sm" />
      ) : glyph ? (
        <span className="text-base leading-none" aria-hidden>
          {glyph}
        </span>
      ) : null}
      <span className={cn("text-[11px] font-semibold leading-tight", active ? "text-zinc-100" : "text-zinc-400")}>
        {label}
      </span>
      {count != null ? (
        <span
          className={cn(
            "text-[10px] font-medium tabular-nums",
            active ? "text-zinc-400" : "text-zinc-500"
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
    <div className="space-y-4 rounded-2xl border border-border/60 bg-zinc-950/40 p-4">
      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
        <ShopQuickFilterBar
          replaceCatalog={replaceCatalog}
          t={t}
          showClearance={showClearanceFilter}
          compact
        />
      </div>

      {floweringRows.length > 0 ? (
        <SidebarFilterRow label={t("ประเภท", "Type")} presentation={presentation}>
          {floweringRows.map(({ slug, label, count }) => (
              <QuickPill
                key={slug}
                active={ftActive === slug}
                onClick={() => setFt(slug)}
                label={label}
                count={count}
                iconSlug={slug}
                presentation={presentation}
              />
            ))}
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
            iconSlug={slug}
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
