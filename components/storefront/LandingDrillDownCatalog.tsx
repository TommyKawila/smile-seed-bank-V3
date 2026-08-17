"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import Tag from "lucide-react/dist/esm/icons/tag";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import {
  CATALOG_GENETICS_STRIP_LABELS,
  CATALOG_GENETICS_STRIP_SLUGS,
} from "@/lib/catalog-filter-strip-labels";
import { saveCatalogReturnPath, touchCatalogReturnFromWindow } from "@/lib/catalog-return-path";
import { productMatchesCatalogFtParam } from "@/lib/seed-type-filter";
import {
  calculateFilterCounts,
  parseListParam,
  productMatchesShopAttributeFilters,
} from "@/lib/shop-attribute-filters";
import {
  PRICE_PARAM_MAX,
  PRICE_PARAM_MIN,
  computePriceSliderCap,
  parsePriceRangeParams,
  priceFilterActive,
  productMatchesPriceRange,
} from "@/lib/shop-price-filter";
import type { CatalogSidebarQuickFiltersProps } from "@/components/storefront/CatalogSidebarQuickFilters";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import type { ProductListItem } from "@/services/storefront-product-service";
import { cn } from "@/lib/utils";

const LazyFilterSidebar = dynamic(
  () =>
    import("@/components/storefront/FilterSidebar").then((m) => ({
      default: m.FilterSidebar,
    })),
  { ssr: false }
);
const LazyShopFilterMobileSheet = dynamic(
  () =>
    import("@/components/storefront/FilterSidebar").then((m) => ({
      default: m.ShopFilterMobileSheet,
    })),
  { ssr: false }
);
const LazyShopPriceFilterBottomSheet = dynamic(
  () =>
    import("@/components/storefront/ShopPriceFilter").then((m) => ({
      default: m.ShopPriceFilterBottomSheet,
    })),
  { ssr: false }
);

export function clearancePackVariants(p: ProductWithBreederAndVariants) {
  const all = p.product_variants ?? [];
  const clearance = all.filter(
    (v) =>
      v.is_active !== false &&
      v.clearance_price != null &&
      Number(v.clearance_price) > 0
  );
  return clearance.length > 0 ? clearance : all;
}

export function LandingDrillDownCatalog({
  products,
  keepParams = ["breeder"],
  showClearanceFilter = false,
  packVariants,
  renderCard,
}: {
  products: ProductWithBreederAndVariants[];
  keepParams?: readonly string[];
  showClearanceFilter?: boolean;
  packVariants?: (
    p: ProductWithBreederAndVariants
  ) => NonNullable<ProductWithBreederAndVariants["product_variants"]>;
  renderCard: (product: ProductWithBreederAndVariants) => ReactNode;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
  const [showPriceSheet, setShowPriceSheet] = useState(false);
  const keep = useMemo(() => new Set(keepParams), [keepParams]);

  const replaceCatalog = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(searchParams.toString());
      mutate(sp);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const qs = searchParams.toString();
    saveCatalogReturnPath(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  const ftParam = searchParams.get("ft");
  const geneticsParam = searchParams.get("genetics");
  const difficultyParam = searchParams.get("difficulty");
  const thcParam = searchParams.get("thc");
  const cbdParam = searchParams.get("cbd");
  const sexParam = searchParams.get("sex");
  const seedsParam = searchParams.get("seeds");
  const yieldQuickParam = searchParams.get("yield");
  const { min: priceMin, max: priceMax } = useMemo(
    () => parsePriceRangeParams(searchParams),
    [searchParams]
  );

  const variantsFor = useCallback(
    (p: ProductWithBreederAndVariants) => packVariants?.(p) ?? p.product_variants ?? [],
    [packVariants]
  );

  const filterOptionCounts = useMemo(
    () =>
      calculateFilterCounts(
        products.map((p) => ({
          ...p,
          product_variants: variantsFor(p),
        }))
      ),
    [products, variantsFor]
  );

  const priceCap = useMemo(
    () => computePriceSliderCap(products as unknown as ProductListItem[]),
    [products]
  );

  const setPriceRange = useCallback(
    (min: number | null, max: number | null) => {
      replaceCatalog((sp) => {
        sp.delete(PRICE_PARAM_MIN);
        sp.delete(PRICE_PARAM_MAX);
        if (min == null && max == null) return;
        const lo = min ?? 0;
        const hi = max ?? priceCap;
        if (lo > 0) sp.set(PRICE_PARAM_MIN, String(Math.round(lo)));
        sp.set(PRICE_PARAM_MAX, String(Math.round(hi)));
      });
    },
    [replaceCatalog, priceCap]
  );

  const catalogFloweringQuickOptions = useMemo(
    () =>
      (
        [
          { slug: "auto", label: t("ออโต้", "Auto") },
          { slug: "photo", label: t("โฟโต้", "Photo") },
          { slug: "photo-ff", label: t("โฟโต้ FF", "Photo FF") },
        ] as const
      ).map(({ slug, label }) => ({
        slug,
        label,
        count: filterOptionCounts.flowering[slug] ?? 0,
      })),
    [filterOptionCounts.flowering, t]
  );

  const catalogGeneticsPillOptions = useMemo(
    () =>
      CATALOG_GENETICS_STRIP_SLUGS.map((slug) => {
        const labels = CATALOG_GENETICS_STRIP_LABELS[slug];
        return {
          slug,
          label: t(labels.th, labels.en),
          count: filterOptionCounts.genetics[slug] ?? 0,
        };
      }),
    [filterOptionCounts, t]
  );

  const sidebarQuickFilters = useMemo<CatalogSidebarQuickFiltersProps>(
    () => ({
      replaceCatalog,
      t,
      showClearanceFilter,
      floweringOptions: catalogFloweringQuickOptions,
      geneticsOptions: catalogGeneticsPillOptions,
      sexCounts: {
        feminized: filterOptionCounts.sex.feminized ?? 0,
        regular: filterOptionCounts.sex.regular ?? 0,
      },
    }),
    [
      replaceCatalog,
      t,
      showClearanceFilter,
      catalogFloweringQuickOptions,
      catalogGeneticsPillOptions,
      filterOptionCounts.sex.feminized,
      filterOptionCounts.sex.regular,
    ]
  );

  const filteredProducts = useMemo(() => {
    const genetics = parseListParam(geneticsParam);
    const difficulty = parseListParam(difficultyParam);
    const thc = parseListParam(thcParam);
    const cbd = parseListParam(cbdParam);
    const sex = parseListParam(sexParam);
    const seeds = parseListParam(seedsParam);
    const yieldQuick = yieldQuickParam?.trim() || null;
    return products.filter((p) => {
      if (!productMatchesCatalogFtParam(p, ftParam)) return false;
      if (
        !productMatchesShopAttributeFilters(
          { ...p, product_variants: variantsFor(p) },
          genetics,
          difficulty,
          thc,
          cbd,
          sex,
          yieldQuick,
          seeds
        )
      ) {
        return false;
      }
      return productMatchesPriceRange(
        p as unknown as ProductListItem,
        priceMin,
        priceMax
      );
    });
  }, [
    products,
    ftParam,
    geneticsParam,
    difficultyParam,
    thcParam,
    cbdParam,
    sexParam,
    seedsParam,
    yieldQuickParam,
    priceMin,
    priceMax,
    variantsFor,
  ]);

  const hasFilters =
    Boolean(ftParam?.trim()) ||
    parseListParam(geneticsParam).length > 0 ||
    parseListParam(difficultyParam).length > 0 ||
    parseListParam(thcParam).length > 0 ||
    parseListParam(cbdParam).length > 0 ||
    parseListParam(sexParam).length > 0 ||
    parseListParam(seedsParam).length > 0 ||
    Boolean(yieldQuickParam?.trim()) ||
    priceFilterActive(priceMin, priceMax);

  const clearFilters = useCallback(() => {
    replaceCatalog((sp) => {
      for (const key of [...sp.keys()]) {
        if (!keep.has(key)) sp.delete(key);
      }
    });
  }, [replaceCatalog, keep]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col pb-24 lg:items-stretch lg:gap-8 lg:pb-0",
        showDesktopFilters ? "lg:grid lg:grid-cols-[280px_minmax(0,1fr)]" : "lg:block"
      )}
    >
      {showDesktopFilters ? (
        <aside className="hidden min-h-0 min-w-0 flex-col items-stretch self-stretch lg:flex">
          <LazyFilterSidebar
            t={t}
            counts={filterOptionCounts}
            quickFilters={sidebarQuickFilters}
            priceFilter={{
              cap: priceCap,
              min: priceMin,
              max: priceMax,
              onRangeChange: setPriceRange,
            }}
          />
        </aside>
      ) : null}

      <div className="min-w-0">
        <div className="mb-4 hidden items-center lg:flex">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 rounded-full border-border bg-card px-3 text-foreground shadow-sm",
              showDesktopFilters && "border-primary bg-primary/10 text-primary"
            )}
            onClick={() => setShowDesktopFilters((v) => !v)}
            aria-expanded={showDesktopFilters}
            aria-controls="shop-filters-desktop"
          >
            <SlidersHorizontal className="mr-1.5 h-4 w-4" />
            {showDesktopFilters
              ? t("ซ่อนตัวกรอง", "Hide filters")
              : t("แสดงตัวกรอง", "Show filters")}
          </Button>
        </div>

        <div className="lg:hidden">
          <LazyShopPriceFilterBottomSheet
            t={t}
            open={showPriceSheet}
            onOpenChange={setShowPriceSheet}
            cap={priceCap}
            min={priceMin}
            max={priceMax}
            onRangeChange={setPriceRange}
            resultCount={filteredProducts.length}
          />
          <LazyShopFilterMobileSheet
            t={t}
            counts={filterOptionCounts}
            open={showFilter}
            onOpenChange={setShowFilter}
            resultCount={filteredProducts.length}
            onClearAll={clearFilters}
            quickFilters={sidebarQuickFilters}
          />
        </div>

        {hasFilters ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              {t("ล้างทั้งหมด", "Clear all")}
            </button>
            <span className="text-xs tabular-nums text-muted-foreground">
              {t(
                `${filteredProducts.length} จาก ${products.length} รายการ`,
                `${filteredProducts.length} of ${products.length} items`
              )}
            </span>
          </div>
        ) : null}

        {filteredProducts.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {t("ไม่พบสินค้าที่ตรงกับตัวกรอง", "No products match these filters")}
          </p>
        ) : (
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            onClickCapture={(e) => {
              const el = (e.target as HTMLElement).closest("a");
              if (el) touchCatalogReturnFromWindow();
            }}
          >
            {filteredProducts.map((p) => renderCard(p))}
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div
          className="pointer-events-none h-10 bg-gradient-to-t from-background from-40% via-background/85 to-transparent"
          aria-hidden
        />
        <div className="pointer-events-auto border-t border-border bg-card/90 px-4 py-3 shadow-[0_-10px_36px_rgba(0,0,0,0.55)] backdrop-blur-xl pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-md gap-3">
            <Button
              type="button"
              className="h-14 min-h-12 flex-1 gap-2 rounded-2xl border border-primary/40 bg-card/80 text-base font-bold text-primary shadow-sm surface-glass transition-transform active:scale-[0.98] hover:border-primary/60 hover:bg-primary/10"
              onClick={() => setShowPriceSheet(true)}
            >
              <Tag className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
              {t("กรองราคา", "Price")}
            </Button>
            <Button
              type="button"
              className="h-14 min-h-12 flex-1 gap-2 rounded-2xl border border-primary/50 bg-primary px-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-[0.98] hover:bg-primary/90"
              onClick={() => setShowFilter(true)}
            >
              <SlidersHorizontal className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
              {t("ตัวกรอง", "Filters")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
