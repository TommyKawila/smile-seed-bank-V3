"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  SlidersHorizontal,
  Search,
  X,
  PackageX,
  ChevronLeft,
  ChevronDown,
  MapPin,
  Star,
  Trophy,
  Zap,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBreeders } from "@/hooks/useBreeders";
import { BreederRibbon } from "@/components/storefront/BreederRibbon";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslations } from "@/hooks/use-translations";
import {
  breederSlugFromName,
  resolveBreederFromShopParam,
  seedsBreederHref,
} from "@/lib/breeder-slug";
import { parseSeedsBreederSlugFromPathname, isSeedsIndexPath } from "@/lib/catalog-navigation";
import {
  catalogFloweringBucket,
  productMatchesCatalogFtParam,
  normalizeCatalogFtUrlParam,
  type CatalogFloweringBucket,
} from "@/lib/seed-type-filter";
import { BreederTypeFilter } from "@/components/storefront/BreederTypeFilter";
import { FilterSidebar, ShopFilterMobileSheet } from "@/components/storefront/FilterSidebar";
import { useMediaQuery } from "@/hooks/use-media-query";
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
import { ShopPriceChipsRow, ShopPriceFilterBottomSheet } from "@/components/storefront/ShopPriceFilter";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { ShopGeneticVaultHero } from "@/components/storefront/ShopGeneticVaultHero";
import { selectVaultFeaturedProducts } from "@/lib/vault-featured-products";
import { GeneticVaultProductGrid } from "@/components/storefront/GeneticVaultProductGrid";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { fetchWithTimeout } from "@/lib/timeout";
import type { ProductListItem } from "@/services/storefront-product-service";

const SHOP_PAGE_INITIAL = 30;
const SHOP_PAGE_STEP = 24;
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

export function ShopPageClient({ initialProducts }: { initialProducts: ProductListItem[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const seedsPathSlug = parseSeedsBreederSlugFromPathname(pathname);
  const breederParam =
    (seedsPathSlug ?? searchParams.get("breeder"))?.trim() || null;

  const replaceCatalog = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(searchParams.toString());
      mutate(sp);
      const qs = sp.toString();
      if (seedsPathSlug) {
        router.replace(qs ? `/seeds/${seedsPathSlug}?${qs}` : `/seeds/${seedsPathSlug}`, {
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
    [pathname, router, searchParams, seedsPathSlug]
  );
  const geneticsParam = searchParams.get("genetics") ?? "";
  const difficultyParam = searchParams.get("difficulty") ?? "";
  const thcParam = searchParams.get("thc") ?? "";
  const cbdParam = searchParams.get("cbd") ?? "";
  const sexParam = searchParams.get("sex") ?? "";
  const seedsParam = searchParams.get("seeds") ?? "";
  const ftParam = searchParams.get("ft") ?? "";
  const qParam = searchParams.get("q") ?? "";
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
        categoryParam ||
        yieldQuickParam ||
        qParam ||
        priceFilterActive(priceMin, priceMax)
    );
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const [loadedPage, setLoadedPage] = useState(1);
  const [hasMoreServerProducts, setHasMoreServerProducts] = useState(
    initialProducts.length >= SHOP_PAGE_INITIAL
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
      `${pathname}|${breederParam ?? ""}|${categoryParam}|${qParam}|${ftParam}|${sortedInitialIdsKey}`,
    [pathname, breederParam, categoryParam, qParam, ftParam, sortedInitialIdsKey]
  );

  useEffect(() => {
    setProducts(initialProducts);
    setLoadedPage(1);
    setHasMoreServerProducts(initialProducts.length >= SHOP_PAGE_INITIAL);
  }, [serverHydrateKey, initialProducts]);

  const deferFirstDupClientCatalog = useRef(true);

  useEffect(() => {
    if (deferFirstDupClientCatalog.current) {
      deferFirstDupClientCatalog.current = false;
      if (initialProducts.length > 0) return;
    }
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const sp = new URLSearchParams({
          limit: String(SHOP_PAGE_INITIAL),
          includeVariants: "true",
        });
        if (categoryParam.trim()) sp.set("category", categoryParam.trim());
        if (breederParam?.trim()) sp.set("breeder", breederParam.trim());
        const qTrim = qParam.trim();
        if (qTrim) sp.set("q", qTrim);
        if (ftParam.trim()) sp.set("ft", ftParam.trim());
        const res = await fetchWithTimeout(`/api/products?${sp.toString()}`, { cache: "no-store" }, 4000);
        const json = (await res.json()) as { products?: ProductListItem[]; hasMore?: boolean };
        if (cancelled || !res.ok) return;
        setProducts(Array.isArray(json.products) ? json.products : []);
        setLoadedPage(1);
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
  }, [pathname, breederParam, categoryParam, qParam, ftParam]);

  const priceCap = useMemo(
    () => (products.length > 0 ? computePriceSliderCap(products) : 5000),
    [products]
  );
  const { breeders: allBreeders, isLoading: breedersLoading } = useBreeders();
  const { locale, t } = useLanguage();
  const { t: tMsg } = useTranslations();
  const isLg = useMediaQuery("(min-width: 1024px)", true);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    setSearchTerm(qParam);
  }, [qParam]);
  const [showFilter, setShowFilter] = useState(false);
  const [showPriceSheet, setShowPriceSheet] = useState(false);
  const [visibleCount, setVisibleCount] = useState(SHOP_PAGE_INITIAL);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [researchPosts, setResearchPosts] = useState<MagazinePostPublic[]>([]);

  // Breeder selected via URL param — slug preferred; numeric id still supported
  const urlBreeder = useMemo(
    () => (breederParam ? resolveBreederFromShopParam(allBreeders, breederParam) : null),
    [breederParam, allBreeders]
  );

  useEffect(() => {
    if (!breederParam?.trim() || breedersLoading) return;
    const resolved = resolveBreederFromShopParam(allBreeders, breederParam);
    if (!resolved) {
      router.replace(seedsPathSlug ? "/seeds" : "/shop", { scroll: false });
      return;
    }
    if (/^\d+$/.test(breederParam.trim())) {
      const slug = breederSlugFromName(resolved.name);
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("breeder");
      const qs = sp.toString();
      if (seedsPathSlug) {
        router.replace(qs ? `/seeds/${slug}?${qs}` : `/seeds/${slug}`, { scroll: false });
      } else {
        sp.set("breeder", slug);
        router.replace(`/shop?${sp.toString()}`, { scroll: false });
      }
    }
  }, [breederParam, allBreeders, breedersLoading, router, searchParams, seedsPathSlug]);

  useEffect(() => {
    if (!searchParams.get("type")) return;
    replaceCatalog((sp) => {
      sp.delete("type");
    });
  }, [searchParams, replaceCatalog]);

  const qNorm = searchTerm.trim().toLowerCase();

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

  /** Flowering pill counts: search + optional breeder scope (not filtered by ft). */
  const catalogFloweringScope = useMemo(() => {
    const base = searchFilteredProducts;
    if (!urlBreeder) return base;
    return base.filter((p) => p.breeder_id === urlBreeder.id);
  }, [searchFilteredProducts, urlBreeder]);

  const catalogFloweringOptions = useMemo(() => {
    const rows: { slug: string; label: string; count: number }[] = [
      { slug: "auto", label: t("ออโต้", "Auto"), count: 0 },
      { slug: "photo", label: t("โฟโต้", "Photo"), count: 0 },
      { slug: "photo-ff", label: t("โฟโต้ FF", "Photo FF"), count: 0 },
      { slug: "photo-3n", label: tMsg("photo_3n", "Photo 3N"), count: 0 },
    ];
    const idx = (b: CatalogFloweringBucket) => {
      if (b === "auto") return 0;
      if (b === "photo") return 1;
      if (b === "photo_ff") return 2;
      if (b === "photo_3n") return 3;
      return -1;
    };
    for (const p of catalogFloweringScope) {
      const b = catalogFloweringBucket({
        flowering_type: p.flowering_type,
        category: p.category,
        product_categories: p.product_categories,
      });
      if (!b) continue;
      const i = idx(b);
      if (i >= 0) rows[i].count += 1;
    }
    return rows;
  }, [catalogFloweringScope, t, tMsg]);

  /** Pills with count > 0 only (bucket via catalogFloweringBucket). */
  const catalogFloweringPillOptions = useMemo(
    () => catalogFloweringOptions.filter((o) => o.count > 0),
    [catalogFloweringOptions]
  );

  useEffect(() => {
    const raw = ftParam?.trim();
    if (!raw) return;
    const key = normalizeCatalogFtUrlParam(raw);
    if (!key) {
      replaceCatalog((sp) => {
        sp.delete("ft");
      });
      return;
    }
    const allowed = new Set(catalogFloweringPillOptions.map((o) => o.slug));
    if (allowed.size > 0 && !allowed.has(key)) {
      replaceCatalog((sp) => {
        sp.delete("ft");
      });
    }
  }, [ftParam, replaceCatalog, catalogFloweringPillOptions]);

  useEffect(() => {
    const tid = setTimeout(() => {
      const next = searchTerm.trim();
      if (next === qParam.trim()) return;
      replaceCatalog((sp) => {
        if (next) sp.set("q", next);
        else sp.delete("q");
      });
    }, 400);
    return () => clearTimeout(tid);
  }, [searchTerm, qParam, replaceCatalog]);

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

  /** Breeder + search + flowering (ft) scope only — used for sidebar filter option counts. */
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

  const filterOptionCounts = useMemo(
    () => calculateFilterCounts(shopScopedProducts),
    [shopScopedProducts]
  );

  const filteredProducts = useMemo(() => {
    const geneticsSel = parseListParam(geneticsParam);
    const difficultySel = parseListParam(difficultyParam);
    const thcSel = parseListParam(thcParam);
    const cbdSel = parseListParam(cbdParam);
    const sexSel = parseListParam(sexParam);
    const seedsSel = parseListParam(seedsParam);
    const matches = shopScopedProducts.filter(
      (p) =>
        productMatchesShopAttributeFilters(
          {
            strain_dominance: p.strain_dominance,
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
          yieldQuickParam.trim() || null,
          seedsSel
        ) && productMatchesPriceRange(p, priceMin, priceMax)
    );
    if (!breederParam?.trim()) return matches;
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
    geneticsParam,
    difficultyParam,
    thcParam,
    cbdParam,
    sexParam,
    seedsParam,
    yieldQuickParam,
    priceMin,
    priceMax,
  ]);

  const isEn = locale === "en";

  /** `/seeds` and `/seeds/[breeder]` use the compact catalog header only (no vault hero). */
  const isSeedsJournalCatalogPath =
    isSeedsIndexPath(pathname) || Boolean(seedsPathSlug);

  const vaultHeroProducts = useMemo(() => {
    if (isSeedsJournalCatalogPath) return [];
    return selectVaultFeaturedProducts(filteredProducts);
  }, [filteredProducts, isSeedsJournalCatalogPath]);

  const filteredIdsKey = useMemo(
    () => filteredProducts.map((p) => p.id).join(","),
    [filteredProducts]
  );

  useEffect(() => {
    setVisibleCount(SHOP_PAGE_INITIAL);
  }, [filteredIdsKey]);

  useEffect(() => {
    if (!didMountScrollRef.current) {
      didMountScrollRef.current = true;
      return;
    }
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [breederParam, categoryParam, geneticsParam, difficultyParam, thcParam, cbdParam, sexParam, seedsParam, ftParam, qParam, yieldQuickParam, priceMin, priceMax]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const totalFiltered = filteredProducts.length;
  const shownCount = visibleProducts.length;
  const hasMoreProducts = shownCount < totalFiltered || hasMoreServerProducts;

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > BACK_TO_TOP_SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/storefront/magazine/recent?take=2")
      .then((r) => r.json())
      .then((j: { posts?: MagazinePostPublic[] }) => {
        if (cancelled || !Array.isArray(j?.posts)) return;
        setResearchPosts(j.posts.slice(0, 2));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
        page: String(nextPage),
        limit: String(SHOP_PAGE_STEP),
        includeVariants: "true",
      });
      if (breederParam?.trim()) sp.set("breeder", breederParam.trim());
      if (categoryParam.trim()) sp.set("category", categoryParam.trim());
      if (qParam.trim()) sp.set("q", qParam.trim());
      if (ftParam.trim()) sp.set("ft", ftParam.trim());
      if (seedsParam.trim()) sp.set("seeds", seedsParam.trim());
      if (priceMin != null) sp.set(PRICE_PARAM_MIN, String(priceMin));
      if (priceMax != null) sp.set(PRICE_PARAM_MAX, String(priceMax));
      const res = await fetchWithTimeout(`/api/products?${sp.toString()}`, { cache: "no-store" }, 2000);
      const json = (await res.json()) as { products?: ProductListItem[]; hasMore?: boolean };
      if (!res.ok) throw new Error("Failed to load more products");
      const nextProducts = Array.isArray(json.products) ? json.products : [];
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
      setLoadedPage(nextPage);
      setHasMoreServerProducts(Boolean(json.hasMore));
      setVisibleCount((c) => c + SHOP_PAGE_STEP);
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
    breederParam,
    categoryParam,
    qParam,
    seedsParam,
    ftParam,
    priceMin,
    priceMax,
    t,
  ]);

  const hasFilters =
    searchTerm.trim().length > 0 ||
    !!ftParam?.trim() ||
    !!categoryParam.trim() ||
    parseListParam(geneticsParam).length > 0 ||
    parseListParam(difficultyParam).length > 0 ||
    parseListParam(thcParam).length > 0 ||
    parseListParam(cbdParam).length > 0 ||
    parseListParam(sexParam).length > 0 ||
    parseListParam(seedsParam).length > 0 ||
    priceFilterActive(priceMin, priceMax);

  const clearFilters = () => {
    setSearchTerm("");
    if (breederParam && urlBreeder) {
      const slug = breederSlugFromName(urlBreeder.name);
      if (seedsPathSlug) {
        router.replace(`/seeds/${slug}`, { scroll: false });
      } else {
        router.replace(`/shop?breeder=${encodeURIComponent(slug)}`, { scroll: false });
      }
      return;
    }
    router.push(seedsPathSlug || isSeedsIndexPath(pathname) ? "/seeds" : "/shop");
  };

  const activeBreederSlug =
    urlBreeder && breederParam?.trim() ? breederSlugFromName(urlBreeder.name) : null;

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
    <div className="min-h-screen bg-white pt-20 sm:pt-28">
      {/* Breeder ribbon — scrolls with page (not sticky) */}
      <div className="border-b border-zinc-100 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <BreederRibbon compact activeBreederSlug={activeBreederSlug} scrollOnNav={false} />
        </div>
      </div>
      {/* ── Breeder strip: logo + name + count → products ASAP ───────────────── */}
      {urlBreeder ? (
        <div className="border-b border-zinc-100 bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
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
                <Link
                  href="/breeders"
                  className="mb-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  <ChevronLeft className="h-3 w-3" aria-hidden />
                  {tMsg("breeder.back_to_list", "Back to Breeders")}
                </Link>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                  <h1 className="truncate text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">{urlBreeder.name}</h1>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-400" aria-live="polite">
                    {isLoading
                      ? t("กำลังโหลด...", "Loading...")
                      : `${filteredProducts.length} ${tMsg("breeder.strains_count", "Strains")}`}
                  </span>
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/seeds")}
              className="h-9 w-full shrink-0 gap-1.5 border-zinc-200 text-zinc-600 hover:border-primary hover:text-primary sm:w-auto sm:self-center"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {tMsg("breeder.view_all_products", "View All Products")}
            </Button>
          </div>
        </div>
      ) : vaultHeroProducts.length > 0 ? (
        <ShopGeneticVaultHero key={filteredIdsKey} products={vaultHeroProducts} isEn={isEn} t={t} />
      ) : (
        <div className="border-b border-zinc-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="mx-auto max-w-7xl">
            <h1 className="font-sans text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              {t("คลังเมล็ดพันธุ์รวมทุกค่าย", "Seed vault — all breeders")}
              <span className="ml-2 text-sm font-normal tabular-nums text-zinc-400">
                {isLoading
                  ? `(${t("กำลังโหลด...", "Loading...")})`
                  : `(${filteredProducts.length} ${t("รายการ", "items")})`}
              </span>
            </h1>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-0 sm:px-6 lg:pb-8">
        {/* Sticky strip: no overflow-* on ancestors; top matches Navbar h-20 / sm:h-28 */}
        <div
          className={`sticky top-20 z-40 -mx-4 mb-3 border-b border-zinc-100 bg-white/95 px-4 pt-2 pb-1.5 backdrop-blur-md sm:-mx-6 sm:top-28 sm:px-6 ${JOURNAL_PRODUCT_FONT_VARS}`}
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200/60 bg-white p-2 shadow-sm sm:p-2.5">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder={t("ค้นหาสายพันธุ์หรือแบรนด์...", "Search strains or brands...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-full min-w-0 rounded-xl border-zinc-200 bg-white py-2 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className={`hidden h-9 shrink-0 rounded-xl border-zinc-200 bg-white px-3 text-zinc-700 lg:inline-flex ${showFilter ? "border-primary bg-primary/10 text-primary" : ""}`}
                onClick={() => setShowFilter((v) => !v)}
                aria-expanded={showFilter}
                aria-controls="shop-filters"
              >
                <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                {t("ตัวกรอง", "Filters")}
              </Button>
            </div>
            <div className="relative min-h-[2.25rem]">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-5 bg-gradient-to-r from-white to-transparent sm:w-6"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-5 bg-gradient-to-l from-white to-transparent sm:w-6"
                aria-hidden
              />
              <div
                role="toolbar"
                aria-label={t("กรองสินค้า", "Shop filters")}
                className="flex min-h-[2.25rem] items-center gap-2 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {catalogFloweringScope.length > 0 && catalogFloweringPillOptions.length > 1 && (
                  <>
                    <BreederTypeFilter
                      appearance="chips"
                      options={catalogFloweringPillOptions}
                      allLabel={t("ทั้งหมด", "All")}
                      paramKey="ft"
                      ariaLabel={t("ประเภทการออกดอก", "Flowering type")}
                    />
                    <div
                      className="mx-2 h-6 w-px shrink-0 bg-zinc-200"
                      aria-hidden
                    />
                  </>
                )}
                <ShopPriceChipsRow
                  compact
                  showBahtGlyph
                  t={t}
                  cap={priceCap}
                  min={priceMin}
                  max={priceMax}
                  onRangeChange={setPriceRange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-stretch lg:gap-8">
          {isLg && (
            <aside className="flex min-h-0 min-w-0 flex-col items-stretch self-stretch">
              <FilterSidebar
                t={t}
                counts={filterOptionCounts}
                priceFilter={{
                  cap: priceCap,
                  min: priceMin,
                  max: priceMax,
                  onRangeChange: setPriceRange,
                }}
              />
            </aside>
          )}

          <div ref={gridTopRef} className="min-w-0 scroll-mt-36">
            {!isLg && (
              <>
                <ShopPriceFilterBottomSheet
                  t={t}
                  open={showPriceSheet}
                  onOpenChange={setShowPriceSheet}
                  cap={priceCap}
                  min={priceMin}
                  max={priceMax}
                  onRangeChange={setPriceRange}
                  resultCount={filteredProducts.length}
                />
                <ShopFilterMobileSheet
                  t={t}
                  counts={filterOptionCounts}
                  open={showFilter}
                  onOpenChange={setShowFilter}
                  resultCount={filteredProducts.length}
                  onClearAll={clearFilters}
                />
              </>
            )}

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
                <GeneticVaultProductGrid products={visibleProducts} researchPosts={researchPosts} />
                {totalFiltered > 0 && (
                  <p className="mt-6 text-center text-sm text-zinc-500">
                    {t("แสดง {current} จาก {total} สินค้า", "Showing {current} of {total} products")
                      .replace("{current}", String(shownCount))
                      .replace("{total}", String(totalFiltered))}
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

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
        <div className="pointer-events-auto flex w-full max-w-md gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 rounded-full border-zinc-200 bg-white text-sm font-semibold text-emerald-800 shadow-md hover:bg-zinc-50"
            onClick={() => setShowPriceSheet(true)}
          >
            {t("กรองราคา", "Filter by price")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 rounded-full border-zinc-200 bg-white px-5 text-sm font-semibold text-emerald-800 shadow-md hover:bg-zinc-50"
            onClick={() => setShowFilter(true)}
          >
            {t("ตัวกรอง", "Filters")} 🔍
          </Button>
        </div>
      </div>

      {showBackToTop && (
        <button
          type="button"
          aria-label={t("กลับขึ้นด้านบน", "Back to top")}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-md transition hover:bg-zinc-50 max-lg:bottom-[5.5rem] sm:right-8"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        </button>
      )}
    </div>
  );
}

