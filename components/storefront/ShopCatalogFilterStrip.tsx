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

/** Unified catalog filter strip — `/shop`, `/seeds`, `/seeds/[slug]`, `/brand/[slug]`. */
export function ShopCatalogFilterStrip({
  replaceCatalog,
  t,
  showClearanceFilter,
  showFilter,
  onToggleFilter,
  catalogFloweringPillOptions,
  showFloweringTypePills,
  catalogGeneticsPillOptions,
  catalogSexCounts,
  hideDesktopFilterToggle = false,
}: ShopCatalogFilterStripProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/40 p-2 shadow-sm sm:p-2.5">
      <div className="relative min-h-[2.25rem] min-w-0 flex-1">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-6 bg-gradient-to-r from-white via-white/80 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-zinc-50/90 via-white/80 to-transparent"
          aria-hidden
        />
        <div
          role="toolbar"
          aria-label={t("กรองสินค้า", "Shop filters")}
          className="flex min-h-[2.25rem] flex-wrap items-center gap-1.5 overflow-x-auto py-0.5 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2"
        >
          <ShopQuickFilterBar
            replaceCatalog={replaceCatalog}
            t={t}
            showClearance={showClearanceFilter}
          />
          <ShopFilterStripDivider label={t("เพศ", "Sex")} />
          <ShopSexFilterBar
            replaceCatalog={replaceCatalog}
            t={t}
            sexCounts={catalogSexCounts}
          />
          {showFloweringTypePills ? (
            <>
              <ShopFilterStripDivider label={t("ประเภท", "Type")} />
              <BreederTypeFilter
                appearance="quick-chips"
                options={catalogFloweringPillOptions}
                allLabel={t("ทั้งหมด", "All")}
                paramKey="ft"
                ariaLabel={t("ประเภทการออกดอก", "Flowering type")}
              />
            </>
          ) : null}
          <>
            <ShopFilterStripDivider label={t("พันธุกรรม", "Genetics")} />
            <BreederTypeFilter
              appearance="quick-chips"
              options={catalogGeneticsPillOptions}
              allLabel={t("ทั้งหมด", "All")}
              paramKey="genetics"
              ariaLabel={t("พันธุกรรม", "Genetics")}
              showAllButton={false}
              clearableByReselect
              resolveActiveSlug={geneticsDomPillActiveSlug}
            />
          </>
        </div>
      </div>
      {hideDesktopFilterToggle ? null : (
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

/** Sticky host for catalog pages — single import for shop/seeds/brand catalog UIs. */
export function CatalogStickyFilterStrip({
  catalogHeading,
  ...stripProps
}: ShopCatalogFilterStripProps) {
  return (
    <div
      className={`sticky top-20 z-40 -mx-4 mb-2 border-b border-zinc-100 bg-white/95 px-4 py-1 backdrop-blur-md sm:-mx-6 sm:top-28 sm:px-6 ${JOURNAL_PRODUCT_FONT_VARS}`}
    >
      {catalogHeading ? <div className="mb-1.5 max-w-7xl">{catalogHeading}</div> : null}
      <ShopCatalogFilterStrip {...stripProps} />
    </div>
  );
}
