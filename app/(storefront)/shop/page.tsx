"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { ShopSkeleton } from "@/components/skeletons/ShopSkeleton";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  Search,
  X,
  PackageX,
  ChevronLeft,
  MapPin,
  Star,
  Trophy,
  Zap,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/useProducts";
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
  floweringTypeToSlug,
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
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { ShopGeneticVaultHero } from "@/components/storefront/ShopGeneticVaultHero";
import { GeneticVaultProductGrid } from "@/components/storefront/GeneticVaultProductGrid";
import type { MagazinePostPublic } from "@/lib/blog-service";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";

const SHOP_PAGE_INITIAL = 30;
const SHOP_PAGE_STEP = 24;
const BACK_TO_TOP_SCROLL_THRESHOLD = 400;

// ─── Shop Page ────────────────────────────────────────────────────────────────

function ShopContent() {
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
  const ftParam = searchParams.get("ft") ?? "";
  const qParam = searchParams.get("q") ?? "";

  /** Full catalog client-side (~90 items): no server limit — instant filter in memory */
  const { products, isLoading } = useProducts({ autoFetch: true, includeVariants: true });
  const { breeders: allBreeders, isLoading: breedersLoading } = useBreeders();
  const { locale, t } = useLanguage();
  const { t: tMsg } = useTranslations();
  const isLg = useMediaQuery("(min-width: 1024px)", true);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    setSearchTerm(qParam);
  }, [qParam]);
  const [showFilter, setShowFilter] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(SHOP_PAGE_INITIAL);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [researchPosts, setResearchPosts] = useState<MagazinePostPublic[]>([]);
  const [finalArchiveSpotlights, setFinalArchiveSpotlights] = useState<ProductWithBreederAndVariants[]>(
    []
  );

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
    setBannerExpanded(false);
  }, [urlBreeder?.id]);

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

  /** Instant search: product name + breeder name (+ products under breeders matched in profile text) */
  const searchFilteredProducts = useMemo(() => {
    if (!qNorm) return products;
    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(qNorm);
      const breederNameMatch = p.breeders?.name?.toLowerCase().includes(qNorm) ?? false;
      const breederIdMatch = p.breeder_id != null && matchingBreederIds.has(p.breeder_id);
      return nameMatch || breederNameMatch || breederIdMatch;
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
    const key = floweringTypeToSlug(raw);
    const allowed = new Set(catalogFloweringPillOptions.map((o) => o.slug));
    if (key && allowed.size > 0 && !allowed.has(key)) {
      replaceCatalog((sp) => {
        sp.delete("ft");
      });
      return;
    }
    const ok = key === "auto" || key === "photo" || key === "photo-ff" || key === "photo-3n";
    if (ok) return;
    replaceCatalog((sp) => {
      sp.delete("ft");
    });
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

  /** Breeder + search + flowering (ft) scope only — used for sidebar filter option counts. */
  const shopScopedProducts = useMemo(() => {
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
      return matchBreeder && matchFt;
    });
  }, [searchFilteredProducts, urlBreeder, breederParam, breedersLoading, ftParam]);

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
    return shopScopedProducts.filter((p) =>
      productMatchesShopAttributeFilters(
        {
          strain_dominance: p.strain_dominance,
          growing_difficulty: p.growing_difficulty,
          thc_percent: p.thc_percent,
          cbd_percent: p.cbd_percent ?? null,
          seed_type: p.seed_type ?? null,
        },
        geneticsSel,
        difficultySel,
        thcSel,
        cbdSel,
        sexSel
      )
    );
  }, [
    shopScopedProducts,
    geneticsParam,
    difficultyParam,
    thcParam,
    cbdParam,
    sexParam,
  ]);

  const isEn = locale === "en";

  const vaultHeroProduct = useMemo(() => {
    if (filteredProducts.length === 0) return null;
    const withImg = filteredProducts.find((p) => getListingThumbnailUrl(p));
    return withImg ?? filteredProducts[0];
  }, [filteredProducts]);

  const filteredIdsKey = useMemo(
    () => filteredProducts.map((p) => p.id).join(","),
    [filteredProducts]
  );

  useEffect(() => {
    setVisibleCount(SHOP_PAGE_INITIAL);
  }, [filteredIdsKey]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const totalFiltered = filteredProducts.length;
  const shownCount = visibleProducts.length;
  const hasMoreProducts = shownCount < totalFiltered;

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

  useEffect(() => {
    let cancelled = false;
    const ids = filteredProducts.map((p) => p.id);
    if (ids.length === 0) {
      setFinalArchiveSpotlights([]);
      return;
    }
    const q = new URLSearchParams();
    q.set("ids", ids.join(","));
    fetch(`/api/storefront/low-stock-spotlight?${q.toString()}`)
      .then((r) => r.json())
      .then((j: { products?: ProductWithBreederAndVariants[] }) => {
        if (cancelled || !Array.isArray(j?.products)) return;
        setFinalArchiveSpotlights(j.products);
      })
      .catch(() => {
        if (!cancelled) setFinalArchiveSpotlights([]);
      });
    return () => {
      cancelled = true;
    };
  }, [filteredIdsKey]);

  const hasFilters =
    searchTerm.trim().length > 0 ||
    !!ftParam?.trim() ||
    parseListParam(geneticsParam).length > 0 ||
    parseListParam(difficultyParam).length > 0 ||
    parseListParam(thcParam).length > 0 ||
    parseListParam(cbdParam).length > 0 ||
    parseListParam(sexParam).length > 0;

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
      {/* ── Breeder Banner (URL param mode) ──────────────────────────────── */}
      {urlBreeder ? (
        <motion.div
          layout
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="border-b border-primary/15 bg-gradient-to-r from-accent via-white to-accent px-4 py-8 sm:px-6"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-md sm:h-28 sm:w-28">
              <BreederLogoImage
                src={urlBreeder.logo_url}
                breederName={urlBreeder.name}
                width={80}
                height={80}
                className="rounded-xl"
                imgClassName="object-contain"
                sizes="(max-width: 640px) 64px, 80px"
              />
            </div>

            <div className="min-w-0 flex-1">
              <Link href="/breeders" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <ChevronLeft className="h-3.5 w-3.5" />
                {tMsg("breeder.back_to_list", "Back to Breeders")}
              </Link>
              <span className="mb-1 block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary w-fit">Breeder Collection</span>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">{urlBreeder.name}</h1>

              <div className="mt-1.5 max-w-2xl">
                {!bannerExpanded && summary && <p className="text-sm leading-relaxed text-zinc-500">{summary}</p>}
                <AnimatePresence mode="wait">
                  {bannerExpanded ? (
                    <motion.div
                      key="full"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      {fullDesc && <p className="text-sm leading-relaxed text-zinc-500">{fullDesc}</p>}
                      {highlightRows.length > 0 && (
                        <>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("Key Highlights", "Key Highlights")}</p>
                          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {highlightRows.map(({ icon: Icon, label, value }) => (
                              <li key={label} className="flex items-start gap-2 rounded-xl bg-primary/5 px-3 py-2.5">
                                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/60">{label}</p>
                                  <p className="text-xs leading-snug text-zinc-700">{value}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                {fullDesc && (
                  <button
                    type="button"
                    onClick={() => setBannerExpanded((v) => !v)}
                    className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                  >
                    {bannerExpanded ? t("ย่อลง", "Show Less") : t("อ่านประวัติเต็ม", "Read Full Story")}
                  </button>
                )}
              </div>

              <p className="mt-3 text-xs text-zinc-400">
                {isLoading
                  ? t("กำลังโหลด...", "Loading...")
                  : `${filteredProducts.length} ${tMsg("breeder.strains_count", "Strains")}`}
              </p>
            </div>

            <div className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/seeds")}
                className="gap-1.5 border-zinc-200 text-zinc-600 hover:border-primary hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4" />
                {tMsg("breeder.view_all_products", "View All Products")}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : vaultHeroProduct ? (
        <ShopGeneticVaultHero product={vaultHeroProduct} isEn={isEn} t={t} />
      ) : (
        <div
          className={`border-b border-zinc-100 bg-white px-4 py-10 sm:px-6 ${JOURNAL_PRODUCT_FONT_VARS}`}
        >
          <div className="mx-auto max-w-7xl">
            <p className="font-[family-name:var(--font-journal-product-mono)] text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">
              {t("คลังพันธุกรรม", "GENETIC_VAULT")}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-journal-product-serif)] text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
              {t("ร้านค้า", "Shop")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-zinc-600">
              {t(
                "สำรวจสายพันธุ์ที่ตรวจสอบแล้ว — จากงานวิจัยสู่การปลูกของคุณ",
                "Verified genetics—research-led picks for your grow."
              )}
            </p>
            <p className="mt-2 font-[family-name:var(--font-journal-product-mono)] text-xs tabular-nums text-zinc-500">
              {isLoading
                ? t("กำลังโหลด...", "Loading...")
                : t(`${filteredProducts.length} รายการ`, `${filteredProducts.length} items`)}
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-0 sm:px-6">
        {/* Sticky strip: no overflow-* on ancestors; top matches Navbar h-20 / sm:h-28 */}
        <div
          className={`sticky top-20 z-40 -mx-4 mb-4 border-b border-zinc-200 bg-white px-4 pt-3 pb-2 sm:-mx-6 sm:top-28 sm:px-6 ${JOURNAL_PRODUCT_FONT_VARS}`}
        >
          {catalogFloweringScope.length > 0 && catalogFloweringPillOptions.length > 1 && (
            <BreederTypeFilter
              options={catalogFloweringPillOptions}
              allLabel={t("ทั้งหมด", "All")}
              paramKey="ft"
              ariaLabel={t("ประเภทการออกดอก", "Flowering type")}
            />
          )}
          <div className="mt-1 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder={t("ค้นหาสายพันธุ์หรือแบรนด์...", "Search strains or brands...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-w-0 bg-white pl-9"
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
              className={`shrink-0 bg-white lg:hidden ${showFilter ? "border-primary bg-primary/5 text-primary" : ""}`}
              onClick={() => setShowFilter((v) => !v)}
              aria-expanded={showFilter}
              aria-controls="shop-filters"
            >
              <SlidersHorizontal className="mr-1.5 h-4 w-4" />
              {t("ตัวกรอง", "Filters")}
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-col lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-stretch lg:gap-8">
          {isLg && (
            <aside className="flex min-h-0 min-w-0 flex-col items-stretch self-stretch">
              <FilterSidebar t={t} counts={filterOptionCounts} />
            </aside>
          )}

          <div className="min-w-0">
            {!isLg && (
              <ShopFilterMobileSheet
                t={t}
                counts={filterOptionCounts}
                open={showFilter}
                onOpenChange={setShowFilter}
                resultCount={filteredProducts.length}
                onClearAll={clearFilters}
              />
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
                        className="flex w-full max-w-md items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:w-auto"
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
                          <span className="mt-1.5 inline-block text-xs font-medium text-primary">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-sm border border-zinc-50 shadow-sm">
                    <div className="aspect-square animate-pulse bg-zinc-100" />
                    <div className="space-y-2 p-4">
                      <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
                      <div className="h-4 animate-pulse rounded bg-zinc-100" />
                      <div className="h-8 animate-pulse rounded bg-zinc-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-center">
                <PackageX className="h-12 w-12 text-zinc-200" />
                <p className="text-base font-medium text-zinc-500">
                  {t("ไม่พบสินค้าที่ตรงกับการค้นหา", "No results found")}
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  {t("ล้างตัวกรอง", "Clear filters")}
                </Button>
              </div>
            ) : (
              <>
                <GeneticVaultProductGrid
                  products={visibleProducts}
                  researchPosts={researchPosts}
                  finalArchiveProducts={finalArchiveSpotlights}
                />
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
                      onClick={() =>
                        setVisibleCount((c) => Math.min(c + SHOP_PAGE_STEP, totalFiltered))
                      }
                    >
                      {t("โหลดเพิ่ม", "Load more")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showBackToTop && (
        <button
          type="button"
          aria-label={t("กลับขึ้นด้านบน", "Back to top")}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-primary/80 text-white shadow-md backdrop-blur-md transition hover:bg-primary sm:bottom-8 sm:right-8"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        </button>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent />
    </Suspense>
  );
}
