"use client";

import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BreederTypeFilter,
  geneticsDomPillActiveSlug,
  type BreederTypeOption,
} from "@/components/storefront/BreederTypeFilter";
import { ShopFilterStripDivider } from "@/components/storefront/ShopFilterStripDivider";
import { ShopQuickFilterBar } from "@/components/storefront/ShopQuickFilterBar";
import { ShopSexFilterBar } from "@/components/storefront/ShopSexFilterBar";
import type { CatalogSexStripSlug } from "@/lib/catalog-filter-strip-labels";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export type ShopCatalogFilterStripProps = {
  replaceCatalog: (mutate: (sp: URLSearchParams) => void) => void;
  t: (th: string, en: string) => string;
  showClearanceFilter: boolean;
  showFilter: boolean;
  onToggleFilter: () => void;
  catalogFloweringPillOptions: BreederTypeOption[];
  showFloweringTypePills: boolean;
  catalogGeneticsPillOptions: BreederTypeOption[];
  catalogSexCounts?: Partial<Record<CatalogSexStripSlug, number>>;
  /** Hide desktop «ตัวกรอง» when strip is embedded in mobile sheet. */
  hideDesktopFilterToggle?: boolean;
  /** Optional page title rendered flush above filter chips (catalog index). */
  catalogHeading?: ReactNode;
};

function CatalogFilterToolbar({
  compact,
  ...props
}: ShopCatalogFilterStripProps & { compact: boolean }) {
  const {
    replaceCatalog,
    t,
    showClearanceFilter,
    catalogFloweringPillOptions,
    showFloweringTypePills,
    catalogGeneticsPillOptions,
    catalogSexCounts,
  } = props;

  return (
    <div
      role="toolbar"
      aria-label={t("กรองสินค้า", "Shop filters")}
      className={cn(
        "flex items-center gap-1 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        compact
          ? "min-h-9 flex-nowrap items-center gap-1.5 pr-2"
          : "min-h-[2.25rem] flex-wrap gap-1.5 pr-6 sm:gap-2"
      )}
    >
      <ShopQuickFilterBar
        replaceCatalog={replaceCatalog}
        t={t}
        showClearance={showClearanceFilter}
        compact={compact}
      />
      <ShopFilterStripDivider label={t("เพศ", "Sex")} compact={compact} />
      <ShopSexFilterBar
        replaceCatalog={replaceCatalog}
        t={t}
        sexCounts={catalogSexCounts}
        compact={compact}
      />
      {showFloweringTypePills ? (
        <>
          <ShopFilterStripDivider label={t("ประเภท", "Type")} compact={compact} />
          <BreederTypeFilter
            appearance="quick-chips"
            options={catalogFloweringPillOptions}
            allLabel={t("ทั้งหมด", "All")}
            paramKey="ft"
            ariaLabel={t("ประเภทการออกดอก", "Flowering type")}
            compact={compact}
          />
        </>
      ) : null}
      <ShopFilterStripDivider label={t("พันธุกรรม", "Genetics")} compact={compact} />
      <BreederTypeFilter
        appearance="quick-chips"
        options={catalogGeneticsPillOptions}
        allLabel={t("ทั้งหมด", "All")}
        paramKey="genetics"
        ariaLabel={t("พันธุกรรม", "Genetics")}
        showAllButton={false}
        clearableByReselect
        resolveActiveSlug={geneticsDomPillActiveSlug}
        compact={compact}
      />
    </div>
  );
}

/** Unified catalog filter strip — `/shop`, `/seeds`, `/seeds/[slug]`, `/brand/[slug]`. */
export function ShopCatalogFilterStrip({
  hideDesktopFilterToggle = false,
  onToggleFilter,
  showFilter,
  t,
  ...toolbarProps
}: ShopCatalogFilterStripProps) {
  const isLg = useMediaQuery("(min-width: 1024px)", false);
  const compact = !isLg;

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        compact
          ? "min-w-0"
          : "rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/40 p-2 shadow-sm sm:p-2.5"
      )}
    >
      <div className={cn("relative min-w-0 flex-1", compact ? "min-h-9" : "min-h-[2.25rem]")}>
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-5 bg-gradient-to-r from-white via-white/85 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-6 bg-gradient-to-l from-white via-white/85 to-transparent"
          aria-hidden
        />
        <CatalogFilterToolbar compact={compact} t={t} onToggleFilter={onToggleFilter} showFilter={showFilter} hideDesktopFilterToggle={hideDesktopFilterToggle} {...toolbarProps} />
      </div>
      {hideDesktopFilterToggle || compact ? null : (
        <Button
          variant="outline"
          size="sm"
          className={`hidden h-9 shrink-0 rounded-full border-zinc-200/80 bg-white px-3 text-zinc-700 shadow-sm lg:inline-flex ${showFilter ? "border-primary bg-primary/10 text-primary" : ""}`}
          onClick={onToggleFilter}
          aria-expanded={showFilter}
          aria-controls="shop-filters"
        >
          <SlidersHorizontal className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">{t("ตัวกรอง", "Filters")}</span>
        </Button>
      )}
    </div>
  );
}

/** Sticky catalog title only — quick filters live in the left sidebar / mobile sheet. */
export function CatalogStickyFilterStrip({
  catalogHeading,
}: {
  catalogHeading?: ReactNode;
}) {
  if (!catalogHeading) return null;
  return (
    <div
      className={cn(
        "sticky z-40 -mx-4 border-b border-zinc-100 bg-white/95 px-4 backdrop-blur-md sm:-mx-6 sm:px-6",
        JOURNAL_PRODUCT_FONT_VARS,
        "top-[4.5rem] py-2 max-lg:mb-1 lg:top-28 lg:mb-3 lg:py-2.5"
      )}
    >
      <div className="max-w-7xl max-lg:[&_h1]:text-base max-lg:[&_span]:text-xs">{catalogHeading}</div>
    </div>
  );
}
