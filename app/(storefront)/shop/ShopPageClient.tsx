"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import PackageX from "lucide-react/dist/esm/icons/package-x";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Star from "lucide-react/dist/esm/icons/star";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import Zap from "lucide-react/dist/esm/icons/zap";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import Tag from "lucide-react/dist/esm/icons/tag";
import { Button } from "@/components/ui/button";
import { useBreeders } from "@/hooks/useBreeders";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslations } from "@/hooks/use-translations";
import {
  breederSlugFromName,
  resolveBreederFromShopParam,
  seedsBreederHref,
} from "@/lib/breeder-slug";
import {
  parseJournalBreederSlugFromPathname,
  journalBreederCatalogBasePath,
  isSeedsIndexPath,
  isStorefrontCatalogPath,
  resolveCatalogFtFromUrl,
  resolveCatalogQuickFromFilter,
  resolveCatalogSortFromFilter,
} from "@/lib/catalog-navigation";
import { saveCatalogReturnPath } from "@/lib/catalog-return-path";
import {
  productMatchesCatalogFtParam,
  normalizeCatalogFtUrlParam,
} from "@/lib/seed-type-filter";
import {
  CatalogStickyFilterStrip,
} from "@/components/storefront/ShopCatalogFilterStrip";
import type { CatalogSidebarQuickFiltersProps } from "@/components/storefront/CatalogSidebarQuickFilters";
import {
  CATALOG_GENETICS_STRIP_LABELS,
  CATALOG_GENETICS_STRIP_SLUGS,
} from "@/lib/catalog-filter-strip-labels";
import { scheduleIdleWork } from "@/lib/schedule-idle-work";
import {
  calculateFilterCounts,
  catalogAttributeFiltersHandledOnServer,
  parseListParam,
  productMatchesShopAttributeFilters,
  type ShopFilterOptionCounts,
} from "@/lib/shop-attribute-filters";
import {
  PRICE_PARAM_MAX,
  PRICE_PARAM_MIN,
  computePriceSliderCap,
  parsePriceRangeParams,
  priceFilterActive,
  productMatchesPriceRange,
} from "@/lib/shop-price-filter";
import { GeneticVaultProductGrid } from "@/components/storefront/GeneticVaultProductGrid";
import { fetchWithTimeout } from "@/lib/timeout";
import type { ProductListItem } from "@/services/storefront-product-service";
import { subscribeScrollYBeyond } from "@/lib/subscribe-scroll-y-beyond";
import type { Breeder } from "@/types/supabase";

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

const SHOP_PAGE_INITIAL = 30;
const SHOP_PAGE_STEP = 24;
/** Filtered catalog scans multiple DB chunks — allow longer than default 2s rule. */
const SHOP_CATALOG_FETCH_TIMEOUT_MS = 8000;
const SHOP_FILTER_COUNTS_IDLE_MS = 2_500;
const SHOP_CATALOG_LOAD_MORE_TIMEOUT_MS = 15000;

async function fetchCatalogProductsApi(
  query: string,
  timeoutMs: number
): Promise<Response> {
  const url = `/api/products?${query}`;
  let res = await fetchWithTimeout(url, { cache: "no-store" }, timeoutMs);
  if (res.status === 408) {
    res = await fetchWithTimeout(url, { cache: "no-store" }, timeoutMs);
  }
  return res;
}
const SHOP_FILTER_COUNTS_TIMEOUT_MS = 8000;
const BACK_TO_TOP_SCROLL_THRESHOLD = 400;

function BreederCatalogSeoBlock({
  breederName,
  summary,
  fullDesc,
  highlightRows,
  t,
}: {
  breederName: string;
  summary: string | null;
  fullDesc: string | null;
  highlightRows: {
    icon: typeof MapPin;
    label: string;
    value: string;
  }[];
  t: (th: string, en: string) => string;
}) {
  const hasStory = Boolean(fullDesc?.trim()) || highlightRows.length > 0;
  if (!summary?.trim() && !hasStory) return null;

  return (
    <section
      className="mt-12 border-t border-zinc-100 pt-10 sm:mt-14 sm:pt-12"
      aria-labelledby="breeder-catalog-seo-title"
    >
      <div className="min-h-[1px] rounded-2xl border border-zinc-100 bg-zinc-50/70 px-4 py-5 sm:px-6 sm:py-6">
        <h2
          id="breeder-catalog-seo-title"
          className="font-sans text-base font-semibold tracking-tight text-zinc-900 sm:text-lg"
        >
          {t("ประวัติและเกี่ยวกับค่าย", "History & breeder story")}: {breederName}
        </h2>
        {summary?.trim() ? (
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">{summary.trim()}</p>
        ) : null}

        {hasStory ? (
          <details className="group mt-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-primary outline-none [&::-webkit-details-marker]:hidden">
              <ChevronDown
                className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden
              />
              {t("อ่านประวัติเต็ม", "Read full story")}
            </summary>
            <div className="mt-4 space-y-4 border-l-2 border-primary/15 pl-4">
              {fullDesc?.trim() ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{fullDesc.trim()}</p>
              ) : null}
              {highlightRows.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {t("ไฮไลต์สำคัญ", "Key highlights")}
                  </p>
                  <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {highlightRows.map(({ icon: Icon, label, value }) => (
                      <li
                        key={label}
                        className="flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-zinc-100"
                      >
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/70">
                            {label}
                          </p>
                          <p className="text-xs leading-snug text-zinc-700">{value}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </details>
        ) : null}
      </div>
    </section>
  );
}

// ─── Shop Page ────────────────────────────────────────────────────────────────

export function ShopPageClient({
  initialProducts,
  initialCatalogTotal = null,
  initialCatalogNextCursor = null,
  initialCatalogUseCursor = false,
  showClearanceFilter = false,
  initialBreeder = null,
}: {
  initialProducts: ProductListItem[];
  /** Total rows for current URL filters from server (null if unknown). */
  initialCatalogTotal?: number | null;
  initialCatalogNextCursor?: number | null;
  initialCatalogUseCursor?: boolean;
  /** Hide «ล้างสต็อก» chip when no clearance products in catalog. */
  showClearanceFilter?: boolean;
  /** SSR breeder row for `/seeds/[slug]` — avoids idle breeder fetch for header. */
  initialBreeder?: Breeder | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const journalBreederSlug = parseJournalBreederSlugFromPathname(pathname);
  const journalCatalogBase = journalBreederCatalogBasePath(pathname);
  const breederParam =
    (journalBreederSlug ?? searchParams.get("breeder"))?.trim() || null;

  useEffect(() => {
    if (!isStorefrontCatalogPath(pathname)) return;
    const qs = searchParams.toString();
    saveCatalogReturnPath(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  const replaceCatalog = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(searchParams.toString());
      mutate(sp);
      const qs = sp.toString();
      if (journalCatalogBase) {
        router.replace(qs ? `${journalCatalogBase}?${qs}` : journalCatalogBase, {
          scroll: false,
        });
        return;
      }
      if (isSeedsIndexPath(pathname)) {
        router.replace(qs ? `/seeds?${qs}` : "/seeds", { scroll: false });
        return;
      }
      router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
    },
    [pathname, router, searchParams, journalCatalogBase]
  );
  const geneticsParam = searchParams.get("genetics") ?? "";
  const difficultyParam = searchParams.get("difficulty") ?? "";
  const thcParam = searchParams.get("thc") ?? "";
  const cbdParam = searchParams.get("cbd") ?? "";
  const sexParam = searchParams.get("sex") ?? "";
  const seedsParam = searchParams.get("seeds") ?? "";
  const ftRawQS = searchParams.get("ft") ?? "";
  const filterQueryParam = searchParams.get("filter") ?? "";
  const ftParam = useMemo(
    () => resolveCatalogFtFromUrl({ ft: ftRawQS, filter: filterQueryParam }),
    [ftRawQS, filterQueryParam]
  );
  const quickRawQS = searchParams.get("quick") ?? "";
  const sortRawQS = searchParams.get("sort") ?? "";
  const quickEffective = useMemo(() => {
    const q = quickRawQS.trim();
    if (q === "new" || q === "sale" || q === "clearance") return q;
    return resolveCatalogQuickFromFilter(filterQueryParam) ?? "";
  }, [quickRawQS, filterQueryParam]);
  const sortEffective = useMemo(() => {
    const s = sortRawQS.trim();
    if (s === "price_asc" || s === "price_desc" || s === "new_arrivals" || s === "newest") return s;
    return resolveCatalogSortFromFilter(filterQueryParam) ?? "";
  }, [sortRawQS, filterQueryParam]);
  const qParam = searchParams.get("q") ?? "";
  const qNorm = qParam.trim().toLowerCase();
  const categoryParam = searchParams.get("category") ?? "";
  const yieldQuickParam = searchParams.get("yield") ?? "";
  const priceRange = useMemo(
    () => parsePriceRangeParams(searchParams),
    [searchParams]
  );
  const priceMin = priceRange.min;
  const priceMax = priceRange.max;
  const hasSidebarFilter =
    Boolean(
      geneticsParam ||
        difficultyParam ||
        thcParam ||
        cbdParam ||
        sexParam ||
        seedsParam ||
        ftParam ||
        quickRawQS ||
        filterQueryParam ||
        sortRawQS ||
        categoryParam ||
        yieldQuickParam ||
        qParam ||
        priceFilterActive(priceMin, priceMax)
    );
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const [catalogTotal, setCatalogTotal] = useState<number | null>(initialCatalogTotal ?? null);
  const [loadedPage, setLoadedPage] = useState(1);
  const [catalogNextCursor, setCatalogNextCursor] = useState<number | null>(
    initialCatalogNextCursor
  );
  const [catalogUseCursor, setCatalogUseCursor] = useState(initialCatalogUseCursor);
  const [hasMoreServerProducts, setHasMoreServerProducts] = useState(
    () =>
      initialCatalogTotal != null
        ? initialProducts.length < initialCatalogTotal
        : initialProducts.length >= SHOP_PAGE_INITIAL
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const gridTopRef = useRef<HTMLDivElement | null>(null);
  const didMountScrollRef = useRef(false);
  const sortedInitialIdsKey = useMemo(
    () =>
      [...initialProducts]
        .map((p) => Number(p.id))
        .sort((a, b) => a - b)
        .join(","),
    [initialProducts]
  );
  const serverHydrateKey = useMemo(
    () =>
      `${pathname}|${breederParam ?? ""}|${categoryParam}|${qParam}|${ftRawQS}|${filterQueryParam}|${quickRawQS}|${sortRawQS}|${geneticsParam}|${difficultyParam}|${thcParam}|${cbdParam}|${sexParam}|${seedsParam}|${yieldQuickParam}|${priceMin ?? ""}|${priceMax ?? ""}|${sortedInitialIdsKey}`,
    [
      pathname,
      breederParam,
      categoryParam,
      qParam,
      ftRawQS,
      filterQueryParam,
      quickRawQS,
      sortRawQS,
      geneticsParam,
      difficultyParam,
      thcParam,
      cbdParam,
      sexParam,
      seedsParam,
      yieldQuickParam,
      priceMin,
      priceMax,
      sortedInitialIdsKey,
    ]
  );

  useEffect(() => {
    setProducts(initialProducts);
    setLoadedPage(1);
    setCatalogNextCursor(initialCatalogNextCursor);
    setCatalogUseCursor(initialCatalogUseCursor);
    setCatalogTotal(initialCatalogTotal ?? null);
    setHasMoreServerProducts(
      initialCatalogTotal != null
        ? initialProducts.length < initialCatalogTotal
        : initialProducts.length >= SHOP_PAGE_INITIAL
    );
    setVisibleCount(SHOP_PAGE_INITIAL);
  }, [
    serverHydrateKey,
    initialProducts,
    initialCatalogTotal,
    initialCatalogNextCursor,
    initialCatalogUseCursor,
  ]);

  const deferFirstDupClientCatalog = useRef(true);

  useEffect(() => {
    if (deferFirstDupClientCatalog.current) {
      deferFirstDupClientCatalog.current = false;
      if (initialProducts.length > 0) {
        if (!breederParam?.trim() || initialBreeder) return;
      }
    }
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const sp = new URLSearchParams({
          limit: String(SHOP_PAGE_INITIAL),
        });
        if (seedsParam.trim()) sp.set("includeVariants", "true");
        if (categoryParam.trim()) sp.set("category", categoryParam.trim());
        if (breederParam?.trim()) sp.set("breeder", breederParam.trim());
        const qTrim = qParam.trim();
        if (qTrim) sp.set("q", qTrim);
        if (ftRawQS.trim()) sp.set("ft", ftRawQS.trim());
        if (filterQueryParam.trim()) sp.set("filter", filterQueryParam.trim());
        if (quickRawQS.trim()) sp.set("quick", quickRawQS.trim());
        if (sortRawQS.trim()) sp.set("sort", sortRawQS.trim());
        if (seedsParam.trim()) sp.set("seeds", seedsParam.trim());
        if (geneticsParam.trim()) sp.set("genetics", geneticsParam.trim());
        if (difficultyParam.trim()) sp.set("difficulty", difficultyParam.trim());
        if (thcParam.trim()) sp.set("thc", thcParam.trim());
        if (cbdParam.trim()) sp.set("cbd", cbdParam.trim());
        if (sexParam.trim()) sp.set("sex", sexParam.trim());
        if (yieldQuickParam.trim()) sp.set("yield", yieldQuickParam.trim());
        if (priceMin != null) sp.set(PRICE_PARAM_MIN, String(priceMin));
        if (priceMax != null) sp.set(PRICE_PARAM_MAX, String(priceMax));
        const res = await fetchWithTimeout(`/api/products?${sp.toString()}`, { cache: "no-store" }, SHOP_CATALOG_FETCH_TIMEOUT_MS);
        const json = (await res.json()) as {
          products?: ProductListItem[];
          hasMore?: boolean;
          total?: number | null;
          nextCursor?: number | null;
          useCursor?: boolean;
        };
        if (cancelled || !res.ok) return;
        setProducts(Array.isArray(json.products) ? json.products : []);
        setLoadedPage(1);
        if (typeof json.total === "number") setCatalogTotal(json.total);
        else setCatalogTotal(null);
        setCatalogNextCursor(
          typeof json.nextCursor === "number" ? json.nextCursor : null
        );
        setCatalogUseCursor(Boolean(json.useCursor));
        setHasMoreServerProducts(Boolean(json.hasMore));
      } catch {
        if (!cancelled) setHasMoreServerProducts(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    pathname,
    breederParam,
    categoryParam,
    qParam,
    ftRawQS,
    filterQueryParam,
    quickRawQS,
    sortRawQS,
    seedsParam,
    geneticsParam,
    difficultyParam,
    thcParam,
    cbdParam,
    sexParam,
    yieldQuickParam,
    priceMin,
    priceMax,
    initialBreeder,
    initialProducts.length,
  ]);

  const priceCap = useMemo(
    () => (products.length > 0 ? computePriceSliderCap(products) : 5000),
    [products]
  );
  const { breeders: allBreeders, isLoading: breedersLoading } = useBreeders();
  const { locale, t } = useLanguage();
  const isEn = locale === "en";
  const { t: tMsg } = useTranslations();
  const [showFilter, setShowFilter] = useState(false);
  const [showPriceSheet, setShowPriceSheet] = useState(false);
  const [visibleCount, setVisibleCount] = useState(SHOP_PAGE_INITIAL);
  const [showBackToTop, setShowBackToTop] = useState(false);
  // Breeder selected via URL param — slug preferred; numeric id still supported
  const urlBreeder = useMemo(() => {
    if (!breederParam) return null;
    const fromClient = resolveBreederFromShopParam(allBreeders, breederParam);
    return fromClient ?? initialBreeder ?? null;
  }, [breederParam, allBreeders, initialBreeder]);

  useEffect(() => {
    if (!breederParam?.trim()) return;
    const resolved =
      resolveBreederFromShopParam(allBreeders, breederParam) ?? initialBreeder;
    if (!resolved && !breedersLoading && !initialBreeder) {
      const fallback = pathname?.startsWith("/brand/")
        ? "/breeders"
        : pathname?.startsWith("/seeds/")
          ? "/seeds"
          : "/shop";
      router.replace(fallback, { scroll: false });
      return;
    }
    if (resolved && /^\d+$/.test(breederParam.trim())) {
      const slug = breederSlugFromName(resolved.name);
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("breeder");
      const qs = sp.toString();
      if (journalCatalogBase) {
        const prefix = pathname?.startsWith("/brand/") ? "/brand" : "/seeds";
        router.replace(qs ? `${prefix}/${slug}?${qs}` : `${prefix}/${slug}`, { scroll: false });
      } else {
        sp.set("breeder", slug);
        router.replace(`/shop?${sp.toString()}`, { scroll: false });
      }
    }
  }, [breederParam, allBreeders, breedersLoading, router, searchParams, journalCatalogBase, pathname, initialBreeder]);

  useEffect(() => {
    if (!searchParams.get("type")) return;
    replaceCatalog((sp) => {
      sp.delete("type");
    });
  }, [searchParams, replaceCatalog]);

  // Breeders whose name/summary/description matches the search (for profile cards)
  const matchingBreeders = useMemo(() => {
    if (!qNorm) return [];
    return allBreeders.filter((b) => {
      const name = (b.name ?? "").toLowerCase();
      const summaryTh = (b.summary_th ?? "").toLowerCase();
      const summaryEn = (b.summary_en ?? "").toLowerCase();
      const desc = (b.description ?? "").toLowerCase();
      const descEn = (b.description_en ?? "").toLowerCase();
      return (
        name.includes(qNorm) ||
        summaryTh.includes(qNorm) ||
        summaryEn.includes(qNorm) ||
        desc.includes(qNorm) ||
        descEn.includes(qNorm)
      );
    });
  }, [allBreeders, qNorm]);

  const matchingBreederIds = useMemo(() => new Set(matchingBreeders.map((b) => b.id)), [matchingBreeders]);

  /** Instant search: name, descriptions (TH/EN), breeder name, breeders matched in profile text */
  const searchFilteredProducts = useMemo(() => {
    if (!qNorm) return products;
    const d = (s: string | null | undefined) => (s ?? "").toLowerCase();
    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(qNorm);
      const descMatch =
        d(p.description_th).includes(qNorm) || d(p.description_en).includes(qNorm);
      const breederNameMatch = p.breeders?.name?.toLowerCase().includes(qNorm) ?? false;
      const breederIdMatch = p.breeder_id != null && matchingBreederIds.has(p.breeder_id);
      return nameMatch || descMatch || breederNameMatch || breederIdMatch;
    });
  }, [products, qNorm, matchingBreederIds]);

  /** Breeder + search + flowering (ft) + category — base for sidebar counts & (when sale) pill counts. */
  const shopScopedProducts = useMemo(() => {
    const categoryNorm = categoryParam.trim().toLowerCase();
    return searchFilteredProducts.filter((p) => {
      let matchBreeder: boolean;
      if (breederParam?.trim()) {
        if (breedersLoading) matchBreeder = true;
        else if (!urlBreeder) matchBreeder = false;
        else matchBreeder = p.breeder_id === urlBreeder.id;
      } else {
        matchBreeder = true;
      }
      const matchFt = productMatchesCatalogFtParam(
        {
          flowering_type: p.flowering_type,
          category: p.category,
          product_categories: p.product_categories,
        },
        ftParam
      );
      const matchCategory =
        !categoryNorm ||
        (p.category ?? "").trim().toLowerCase() === categoryNorm ||
        (p.product_categories?.name ?? "").trim().toLowerCase() === categoryNorm;
      return matchBreeder && matchFt && matchCategory;
    });
  }, [searchFilteredProducts, urlBreeder, breederParam, breedersLoading, ftParam, categoryParam]);

  /** Drop only malformed `ft` / `filter` tokens. Do not strip valid buckets just because the
   * current loaded page slice shows count 0 (would break e.g. `?ft=auto` on /shop). */
  useEffect(() => {
    const raw = ftParam?.trim();
    if (!raw) return;
    const key = normalizeCatalogFtUrlParam(raw);
    if (key) return;
    replaceCatalog((sp) => {
      sp.delete("ft");
      const f = (sp.get("filter") ?? "").trim().toLowerCase();
      if (
        f === "auto" ||
        f === "autoflower" ||
        f === "photo" ||
        f === "photoperiod" ||
        f === "photo-ff" ||
        f === "photo_ff" ||
        f === "photo-3n" ||
        f === "photo_3n"
      ) {
        sp.delete("filter");
      }
    });
  }, [ftParam, replaceCatalog]);

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

  const attributeFilterParams = useMemo(
    () => ({
      genetics: parseListParam(geneticsParam),
      difficulty: parseListParam(difficultyParam),
      thc: parseListParam(thcParam),
      cbd: parseListParam(cbdParam),
      sex: parseListParam(sexParam),
      yieldQuick: yieldQuickParam.trim() || null,
      seeds: parseListParam(seedsParam),
    }),
    [
      geneticsParam,
      difficultyParam,
      thcParam,
      cbdParam,
      sexParam,
      yieldQuickParam,
      seedsParam,
    ]
  );

  const serverHandlesAttributeFilters = useMemo(
    () => catalogAttributeFiltersHandledOnServer(attributeFilterParams),
    [attributeFilterParams]
  );

  const clientFilterCountsFallback = useMemo(
    () => calculateFilterCounts(shopScopedProducts),
    [shopScopedProducts]
  );

  const [filterCountsFromApi, setFilterCountsFromApi] =
    useState<ShopFilterOptionCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sp = new URLSearchParams();
    if (categoryParam.trim()) sp.set("category", categoryParam.trim());
    if (breederParam?.trim()) sp.set("breeder", breederParam.trim());
    const qTrim = qParam.trim();
    if (qTrim) sp.set("q", qTrim);
    if (ftRawQS.trim()) sp.set("ft", ftRawQS.trim());
    if (filterQueryParam.trim()) sp.set("filter", filterQueryParam.trim());

    const fetchCounts = () => {
      void (async () => {
        try {
          const res = await fetchWithTimeout(
            `/api/shop/filter-counts?${sp.toString()}`,
            { cache: "no-store" },
            SHOP_FILTER_COUNTS_TIMEOUT_MS
          );
          const json = (await res.json()) as { counts?: ShopFilterOptionCounts };
          if (!cancelled && res.ok && json.counts) setFilterCountsFromApi(json.counts);
          else if (!cancelled) setFilterCountsFromApi(null);
        } catch {
          if (!cancelled) setFilterCountsFromApi(null);
        }
      })();
    };

    const cancelIdle = scheduleIdleWork(fetchCounts, SHOP_FILTER_COUNTS_IDLE_MS);
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [
    categoryParam,
    breederParam,
    qParam,
    ftRawQS,
    filterQueryParam,
  ]);

  const filterOptionCounts = filterCountsFromApi ?? clientFilterCountsFallback;

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
    const { genetics: geneticsSel, difficulty: difficultySel, thc: thcSel, cbd: cbdSel, sex: sexSel, seeds: seedsSel, yieldQuick } =
      attributeFilterParams;
    const matches = shopScopedProducts.filter((p) => {
      const attrOk = serverHandlesAttributeFilters
        ? true
        : productMatchesShopAttributeFilters(
            {
              strain_dominance: p.strain_dominance,
              sativa_ratio: (p as { sativa_ratio?: number | null }).sativa_ratio ?? null,
              indica_ratio: (p as { indica_ratio?: number | null }).indica_ratio ?? null,
              genetic_ratio: (p as { genetic_ratio?: string | null }).genetic_ratio ?? null,
              genetics: (p as { genetics?: string | null }).genetics ?? null,
              growing_difficulty: p.growing_difficulty,
              thc_percent: p.thc_percent,
              cbd_percent: p.cbd_percent ?? null,
              seed_type: p.seed_type ?? null,
              yield_info: (p as { yield_info?: string | null }).yield_info ?? null,
              product_variants: p.product_variants ?? null,
            },
            geneticsSel,
            difficultySel,
            thcSel,
            cbdSel,
            sexSel,
            yieldQuick,
            seedsSel
          );
      return attrOk && productMatchesPriceRange(p, priceMin, priceMax);
    });
    if (!breederParam?.trim()) return matches;
    if (
      quickEffective === "new" ||
      quickEffective === "sale" ||
      quickEffective === "clearance" ||
      sortEffective === "price_asc" ||
      sortEffective === "price_desc" ||
      sortEffective === "new_arrivals" ||
      sortEffective === "newest"
    ) {
      return matches;
    }
    return [...matches].sort((a, b) => {
      const priceA = Number(a.price ?? Number.MAX_SAFE_INTEGER);
      const priceB = Number(b.price ?? Number.MAX_SAFE_INTEGER);
      if (priceA !== priceB) return priceA - priceB;
      const stockA = Number(a.stock ?? Number.MAX_SAFE_INTEGER);
      const stockB = Number(b.stock ?? Number.MAX_SAFE_INTEGER);
      return stockA - stockB;
    });
  }, [
    shopScopedProducts,
    breederParam,
    attributeFilterParams,
    serverHandlesAttributeFilters,
    geneticsParam,
    difficultyParam,
    thcParam,
    cbdParam,
    sexParam,
    seedsParam,
    yieldQuickParam,
    priceMin,
    priceMax,
    quickEffective,
    sortEffective,
  ]);

  useEffect(() => {
    if (!didMountScrollRef.current) {
      didMountScrollRef.current = true;
      return;
    }
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [
    breederParam,
    categoryParam,
    geneticsParam,
    difficultyParam,
    thcParam,
    cbdParam,
    sexParam,
    seedsParam,
    ftRawQS,
    filterQueryParam,
    qParam,
    quickRawQS,
    sortRawQS,
    yieldQuickParam,
    priceMin,
    priceMax,
  ]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const totalFiltered = filteredProducts.length;
  const shownCount = visibleProducts.length;

  const isNarrowedByClientFilters = totalFiltered < products.length;
  /** Unfiltered catalog total from filter-counts API when SQL total is unknown. */
  const filterCountsScopedTotal = useMemo(() => {
    const f = filterOptionCounts.flowering;
    const sum =
      (f.auto ?? 0) +
      (f.photo ?? 0) +
      (f["photo-ff"] ?? 0) +
      (f["photo-3n"] ?? 0);
    return sum > 0 ? sum : null;
  }, [filterOptionCounts.flowering]);
  const catalogDisplayTotal = isNarrowedByClientFilters
    ? totalFiltered
    : catalogTotal ?? filterCountsScopedTotal ?? totalFiltered;
  const footerTotal = catalogDisplayTotal;
  const footerShown = Math.min(shownCount, totalFiltered);

  const allServerPagesFetched =
    catalogTotal != null ? products.length >= catalogTotal : !hasMoreServerProducts;

  const hasMoreProducts =
    shownCount < totalFiltered ||
    (!isNarrowedByClientFilters && hasMoreServerProducts && !allServerPagesFetched);

  useEffect(
    () => subscribeScrollYBeyond(BACK_TO_TOP_SCROLL_THRESHOLD, setShowBackToTop),
    []
  );

  const loadMoreProducts = useCallback(async () => {
    if (shownCount < totalFiltered) {
      setVisibleCount((c) => Math.min(c + SHOP_PAGE_STEP, totalFiltered));
      return;
    }
    if (!hasMoreServerProducts || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = loadedPage + 1;
      const sp = new URLSearchParams({
        limit: String(SHOP_PAGE_INITIAL),
      });
      if (catalogUseCursor && catalogNextCursor != null) {
        sp.set("cursor", String(catalogNextCursor));
        sp.set("page", "1");
      } else {
        sp.set("page", String(nextPage));
      }
      if (seedsParam.trim()) sp.set("includeVariants", "true");
      if (breederParam?.trim()) sp.set("breeder", breederParam.trim());
      if (categoryParam.trim()) sp.set("category", categoryParam.trim());
      if (qParam.trim()) sp.set("q", qParam.trim());
      if (ftRawQS.trim()) sp.set("ft", ftRawQS.trim());
      if (filterQueryParam.trim()) sp.set("filter", filterQueryParam.trim());
      if (quickRawQS.trim()) sp.set("quick", quickRawQS.trim());
      if (sortRawQS.trim()) sp.set("sort", sortRawQS.trim());
      if (seedsParam.trim()) sp.set("seeds", seedsParam.trim());
      if (geneticsParam.trim()) sp.set("genetics", geneticsParam.trim());
      if (difficultyParam.trim()) sp.set("difficulty", difficultyParam.trim());
      if (thcParam.trim()) sp.set("thc", thcParam.trim());
      if (cbdParam.trim()) sp.set("cbd", cbdParam.trim());
      if (sexParam.trim()) sp.set("sex", sexParam.trim());
      if (yieldQuickParam.trim()) sp.set("yield", yieldQuickParam.trim());
      if (priceMin != null) sp.set(PRICE_PARAM_MIN, String(priceMin));
      if (priceMax != null) sp.set(PRICE_PARAM_MAX, String(priceMax));
      const res = await fetchCatalogProductsApi(
        sp.toString(),
        SHOP_CATALOG_LOAD_MORE_TIMEOUT_MS
      );
      const json = (await res.json()) as {
        products?: ProductListItem[];
        hasMore?: boolean;
        total?: number | null;
        nextCursor?: number | null;
        useCursor?: boolean;
        error?: string;
      };
      if (!res.ok || res.status === 408) {
        throw new Error(json.error ?? "Failed to load more products");
      }
      const nextProducts = Array.isArray(json.products) ? json.products : [];
      if (typeof json.total === "number") setCatalogTotal(json.total);
      if (typeof json.nextCursor === "number") setCatalogNextCursor(json.nextCursor);
      else setCatalogNextCursor(null);
      if (typeof json.useCursor === "boolean") setCatalogUseCursor(json.useCursor);
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => String(p.id)));
        const merged = [...prev];
        for (const product of nextProducts) {
          const key = String(product.id);
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(product);
        }
        return merged;
      });
      if (!json.useCursor || json.nextCursor == null) {
        setLoadedPage(nextPage);
      }
      setHasMoreServerProducts(Boolean(json.hasMore));
      setVisibleCount((c) => {
        const seen = new Set(
          products.map((p) => String(p.id))
        );
        let added = 0;
        for (const product of nextProducts) {
          const key = String(product.id);
          if (seen.has(key)) continue;
          seen.add(key);
          added += 1;
        }
        if (added <= 0) return c;
        return c + added;
      });
    } catch {
      toast.error(t("โหลดสินค้าเพิ่มไม่สำเร็จ", "Could not load more products"));
    } finally {
      setLoadingMore(false);
    }
  }, [
    shownCount,
    totalFiltered,
    hasMoreServerProducts,
    loadingMore,
    loadedPage,
    catalogUseCursor,
    catalogNextCursor,
    breederParam,
    categoryParam,
    qParam,
    seedsParam,
    geneticsParam,
    difficultyParam,
    thcParam,
    cbdParam,
    sexParam,
    yieldQuickParam,
    ftRawQS,
    filterQueryParam,
    quickRawQS,
    sortRawQS,
    priceMin,
    priceMax,
    t,
    catalogTotal,
    products,
  ]);

  const hasFilters =
    !!qParam.trim() ||
    !!ftRawQS.trim() ||
    !!filterQueryParam.trim() ||
    !!quickRawQS.trim() ||
    !!sortRawQS.trim() ||
    !!categoryParam.trim() ||
    parseListParam(geneticsParam).length > 0 ||
    parseListParam(difficultyParam).length > 0 ||
    parseListParam(thcParam).length > 0 ||
    parseListParam(cbdParam).length > 0 ||
    parseListParam(sexParam).length > 0 ||
    parseListParam(seedsParam).length > 0 ||
    priceFilterActive(priceMin, priceMax);

  const clearFilters = () => {
    if (breederParam && urlBreeder) {
      const slug = breederSlugFromName(urlBreeder.name);
      if (pathname.startsWith("/brand/")) {
        router.replace(`/brand/${slug}`, { scroll: false });
      } else if (journalBreederSlug) {
        router.replace(`/seeds/${slug}`, { scroll: false });
      } else {
        router.replace(`/shop?breeder=${encodeURIComponent(slug)}`, { scroll: false });
      }
      return;
    }
    if (isSeedsIndexPath(pathname) || pathname.startsWith("/seeds/")) {
      router.push("/seeds");
      return;
    }
    if (pathname.startsWith("/brand/")) {
      router.push("/breeders");
      return;
    }
    router.push("/shop");
  };

  const fullDesc = urlBreeder
    ? (isEn ? (urlBreeder.description_en ?? urlBreeder.description) : (urlBreeder.description ?? urlBreeder.description_en))
    : null;
  const summary = urlBreeder
    ? (isEn ? (urlBreeder.summary_en ?? urlBreeder.summary_th) : (urlBreeder.summary_th ?? urlBreeder.summary_en))
    : null;
  const highlightRows = urlBreeder
    ? [
        { icon: MapPin, label: t("แหล่งกำเนิด", "Origin"), value: isEn ? (urlBreeder.highlight_origin_en ?? urlBreeder.highlight_origin_th ?? "") : (urlBreeder.highlight_origin_th ?? urlBreeder.highlight_origin_en ?? "") },
        { icon: Star, label: t("ความเชี่ยวชาญ", "Specialty"), value: isEn ? (urlBreeder.highlight_specialty_en ?? urlBreeder.highlight_specialty_th ?? "") : (urlBreeder.highlight_specialty_th ?? urlBreeder.highlight_specialty_en ?? "") },
        { icon: Trophy, label: t("ชื่อเสียง", "Reputation"), value: isEn ? (urlBreeder.highlight_reputation_en ?? urlBreeder.highlight_reputation_th ?? "") : (urlBreeder.highlight_reputation_th ?? urlBreeder.highlight_reputation_en ?? "") },
        { icon: Zap, label: t("จุดเด่น", "Focus"), value: isEn ? (urlBreeder.highlight_focus_en ?? urlBreeder.highlight_focus_th ?? "") : (urlBreeder.highlight_focus_th ?? urlBreeder.highlight_focus_en ?? "") },
      ].filter((r) => !!r.value)
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* ── Breeder strip: logo + name + count → products ASAP ───────────────── */}
      {urlBreeder ? (
        <div className="border-b border-zinc-100 bg-white px-4 py-2.5 sm:px-6">
          <div className="mx-auto max-w-7xl space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/breeders"
                className="inline-flex min-w-0 shrink items-center gap-1 text-[11px] font-medium text-primary hover:underline sm:text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{tMsg("breeder.back_to_list", "Back to Breeders")}</span>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/seeds")}
                className="h-8 max-w-[min(52%,14rem)] shrink-0 gap-1 border-zinc-200 px-2.5 text-xs text-zinc-600 hover:border-primary hover:text-primary sm:h-9 sm:max-w-none sm:px-3 sm:text-sm"
              >
                <ChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{tMsg("breeder.view_all_products", "View All Products")}</span>
              </Button>
            </div>
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="relative flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 sm:h-[4.75rem] sm:w-[4.75rem]">
                <BreederLogoImage
                  src={urlBreeder.logo_url}
                  breederName={urlBreeder.name}
                  width={72}
                  height={72}
                  className="rounded-lg"
                  imgClassName="object-contain"
                  sizes="(max-width: 640px) 68px, 76px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                  <h1 className="truncate text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
                    {urlBreeder.name}
                  </h1>
                  <span className="inline-block min-w-[3ch] shrink-0 tabular-nums text-xs text-zinc-400" aria-live="polite">
                    {isLoading ? "—" : `${catalogDisplayTotal} ${tMsg("breeder.strains_count", "Strains")}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 pb-28 pt-0 sm:px-6 max-lg:pb-[7.25rem] lg:pb-8">
        {/* Sticky strip: no overflow-* on ancestors; top matches Navbar h-20 / sm:h-28 */}
        <CatalogStickyFilterStrip
          catalogHeading={
            urlBreeder ? undefined : (
              <h1 className="font-sans text-lg font-bold leading-tight tracking-tight text-zinc-900 sm:text-xl">
                {quickEffective === "clearance"
                  ? t("ล้างสต็อก — เมล็ดพันธุ์ลดราคา", "Clearance — discounted seeds")
                  : quickEffective === "sale"
                    ? t("โปรแบรนด์ — สินค้าลดราคา", "Brand deals — on sale")
                    : t("คลังเมล็ดพันธุ์รวมทุกค่าย", "Seed vault — all breeders")}
                <span className="ml-2 inline-block min-w-[3ch] text-sm font-normal tabular-nums text-zinc-400">
                  {isLoading ? "(—)" : `(${catalogDisplayTotal} ${t("รายการ", "items")})`}
                </span>
              </h1>
            )
          }
        />

        <div className="flex min-h-0 flex-col lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-stretch lg:gap-8">
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

          <div ref={gridTopRef} className="min-w-0 scroll-mt-36">
            <div className="lg:hidden">
                <LazyShopPriceFilterBottomSheet
                  t={t}
                  open={showPriceSheet}
                  onOpenChange={setShowPriceSheet}
                  cap={priceCap}
                  min={priceMin}
                  max={priceMax}
                  onRangeChange={setPriceRange}
                  resultCount={catalogDisplayTotal}
                />
                <LazyShopFilterMobileSheet
                  t={t}
                  counts={filterOptionCounts}
                  open={showFilter}
                  onOpenChange={setShowFilter}
                  resultCount={catalogDisplayTotal}
                  onClearAll={clearFilters}
                  quickFilters={sidebarQuickFilters}
                />
            </div>

            {hasFilters && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-zinc-400 underline hover:text-zinc-600"
                >
                  {t("ล้างทั้งหมด", "Clear all")}
                </button>
              </div>
            )}

            {qNorm && matchingBreeders.length > 0 && (
              <div className="mb-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t("แบรนด์ที่ตรงกับคำค้น", "Brands matching your search")}
                </p>
                <div className="flex flex-wrap gap-4">
                  {matchingBreeders.map((b) => {
                    const summary = locale === "en"
                      ? (b.summary_en ?? b.summary_th ?? b.description ?? "")
                      : (b.summary_th ?? b.summary_en ?? b.description ?? "");
                    return (
                      <Link
                        key={b.id}
                        href={seedsBreederHref(b)}
                        className="flex w-full max-w-md items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:border-primary/25 sm:w-auto"
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                          <BreederLogoImage
                            src={b.logo_url}
                            breederName={b.name}
                            width={56}
                            height={56}
                            className="rounded-xl"
                            imgClassName="object-contain p-1"
                            sizes="56px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-zinc-900">{b.name}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{summary.slice(0, 120)}{summary.length > 120 ? "…" : ""}</p>
                          <span className="mt-1.5 inline-block text-xs font-medium text-emerald-600">
                            {t("ดูสายพันธุ์", "View genetics")} →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <div className="aspect-square animate-pulse bg-zinc-200" />
                    <div className="space-y-2 p-3">
                      <div className="mx-auto h-5 w-24 animate-pulse rounded-full bg-zinc-200" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200" />
                      <div className="h-10 animate-pulse rounded bg-zinc-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <>
                <div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-center">
                  <PackageX className="h-12 w-12 text-zinc-600" />
                  <p className="text-base font-medium text-zinc-600">
                    {(() => {
                      const qDisplay = qParam.trim();
                      if (qDisplay && urlBreeder) {
                        return t(
                          `ไม่พบผลลัพธ์สำหรับ "${qDisplay}" ในค่าย ${urlBreeder.name}`,
                          `No results for '${qDisplay}' in ${urlBreeder.name}`
                        );
                      }
                      if (qDisplay) {
                        return t(
                          `ไม่พบผลลัพธ์สำหรับ "${qDisplay}"`,
                          `No results for '${qDisplay}'`
                        );
                      }
                      return t("ไม่พบสินค้าที่ตรงกับการค้นหา", "No matching products");
                    })()}
                  </p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    {t("ล้างตัวกรอง", "Clear filters")}
                  </Button>
                </div>
                {urlBreeder ? (
                  <BreederCatalogSeoBlock
                    breederName={urlBreeder.name}
                    summary={summary}
                    fullDesc={fullDesc}
                    highlightRows={highlightRows}
                    t={t}
                  />
                ) : null}
              </>
            ) : (
              <>
                <GeneticVaultProductGrid
                  products={visibleProducts}
                  catalogSeedsFilter={seedsParam.trim() ? seedsParam : null}
                />
                {totalFiltered > 0 && (
                  <p className="mt-6 text-center text-sm text-zinc-500">
                    {t("แสดง {current} จาก {total} สินค้า", "Showing {current} of {total} products")
                      .replace("{current}", String(footerShown))
                      .replace("{total}", String(footerTotal))}
                  </p>
                )}
                {hasMoreProducts && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-w-[10rem] border-primary/30 bg-white font-semibold text-primary hover:bg-primary/5"
                      disabled={loadingMore}
                      onClick={loadMoreProducts}
                    >
                      {loadingMore ? t("กำลังโหลด...", "Loading...") : t("โหลดเพิ่ม", "Load more")}
                    </Button>
                  </div>
                )}
                {urlBreeder ? (
                  <BreederCatalogSeoBlock
                    breederName={urlBreeder.name}
                    summary={summary}
                    fullDesc={fullDesc}
                    highlightRows={highlightRows}
                    t={t}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div
          className="pointer-events-none h-10 bg-gradient-to-t from-white from-40% via-white/90 to-transparent"
          aria-hidden
        />
        <div className="pointer-events-auto border-t border-zinc-200/90 bg-white/98 px-4 py-3 shadow-[0_-8px_32px_rgba(18,70,62,0.14)] backdrop-blur-lg pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-md gap-3">
            <Button
              type="button"
              className="h-14 min-h-12 flex-1 gap-2 rounded-2xl border-2 border-primary/25 bg-secondary text-base font-bold text-primary shadow-md ring-1 ring-white/80 transition-transform active:scale-[0.98] hover:bg-secondary/90"
              onClick={() => setShowPriceSheet(true)}
            >
              <Tag className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
              {t("กรองราคา", "Price")}
            </Button>
            <Button
              type="button"
              className="h-14 min-h-12 flex-1 gap-2 rounded-2xl border-2 border-primary/80 bg-primary px-4 text-base font-bold text-primary-foreground shadow-[0_6px_20px_rgba(18,70,62,0.35)] ring-2 ring-primary/20 transition-transform active:scale-[0.98] hover:bg-primary/90"
              onClick={() => setShowFilter(true)}
            >
              <SlidersHorizontal className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
              {t("ตัวกรอง", "Filters")}
            </Button>
          </div>
        </div>
      </div>

      {showBackToTop && (
        <button
          type="button"
          aria-label={t("กลับขึ้นด้านบน", "Back to top")}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-md transition hover:bg-zinc-50 max-lg:bottom-[6.75rem] sm:right-8"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        </button>
      )}
    </div>
  );
}

