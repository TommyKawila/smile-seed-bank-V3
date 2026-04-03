"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { ShopSkeleton } from "@/components/skeletons/ShopSkeleton";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { SlidersHorizontal, Search, X, Leaf, PackageX, ChevronLeft, MapPin, Star, Trophy, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/useProducts";
import { useBreeders } from "@/hooks/useBreeders";
import { BreederRibbon } from "@/components/storefront/BreederRibbon";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { formatPrice } from "@/lib/utils";
import { productDetailHref } from "@/lib/product-utils";
import { useCartContext } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

// ─── Product Card ─────────────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const glassBadge =
  "rounded-full border border-white/30 bg-white/20 px-2 py-0.5 text-[10px] font-medium backdrop-blur-md";
const glassChip =
  "rounded-full border border-zinc-200/70 bg-white/70 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm";

function getPrimaryImage(product: { image_urls?: unknown; image_url?: string | null }): string | null {
  if (Array.isArray(product.image_urls) && (product.image_urls as string[]).length > 0) {
    return (product.image_urls as string[])[0] ?? null;
  }
  return product.image_url ?? null;
}

function getDefaultVariant(product: {
  product_variants?: {
    id: number;
    price: number;
    stock: number | null;
    is_active: boolean | null;
    unit_label: string;
  }[];
}) {
  const variants =
    product.product_variants?.filter((v) => v.is_active !== false && (v.stock ?? 0) > 0) ?? [];
  return variants.sort((a, b) => a.price - b.price)[0] ?? null;
}

function ProductCard({ product }: { product: ReturnType<typeof useProducts>["products"][number] }) {
  const { addToCart, openCart } = useCartContext();
  const stock = product.stock ?? 0;
  const lowStock = stock > 0 && stock <= 5;
  const outOfStock = stock === 0;
  const defaultVariant = getDefaultVariant(product);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (defaultVariant) {
      addToCart({
        variantId: defaultVariant.id,
        productId: product.id,
        productName: product.name,
        productImage: getPrimaryImage(product),
        unitLabel: defaultVariant.unit_label,
        price: defaultVariant.price,
        quantity: 1,
        masterSku: (product as { master_sku?: string | null }).master_sku ?? null,
      });
    } else {
      openCart();
    }
  };

  return (
    <motion.div variants={cardVariants}>
      <Link
        href={productDetailHref(product)}
        className="group block overflow-hidden rounded-2xl border border-zinc-100 bg-white transition-shadow hover:shadow-lg"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-zinc-50">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-transform duration-500 ease-out group-hover:scale-110 ${outOfStock ? "opacity-50 grayscale" : ""}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Leaf className="h-10 w-10 text-zinc-200" />
            </div>
          )}

          {/* Status Badges — glassmorphism, flex-wrap for mobile */}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            {outOfStock && (
              <span className={`${glassBadge} text-zinc-800`}>หมด</span>
            )}
            {lowStock && !outOfStock && (
              <span className={`${glassBadge} text-red-800`}>เหลือน้อย</span>
            )}
          </div>

          {/* Breeder Logo — clickable link */}
          {product.breeders && (
            <Link
              href={`/shop?breeder=${product.breeders.id}`}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 right-2 flex h-9 w-9 overflow-hidden rounded-full border border-white/30 bg-white/20 shadow-md backdrop-blur-md transition-transform hover:scale-110"
            >
              <BreederLogoImage
                src={product.breeders.logo_url}
                breederName={product.breeders.name}
                width={36}
                height={36}
                className="rounded-full"
                imgClassName="object-cover"
                sizes="36px"
              />
            </Link>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-col gap-2 p-4">
          {product.breeders && (
            <Link
              href={`/shop?breeder=${product.breeders.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-block max-w-fit text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              {product.breeders.name}
            </Link>
          )}
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 sm:text-base">
            {product.name}
          </h3>

          {/* Spec Chips — glassmorphism */}
          <div className="flex flex-wrap gap-1.5">
            {product.flowering_type && (
              <span className={`${glassChip} text-zinc-700`}>{product.flowering_type}</span>
            )}
            {product.seed_type && (
              <span className={`${glassChip} text-zinc-700`}>{product.seed_type}</span>
            )}
            {product.thc_percent && (
              <span className={`${glassChip} text-primary`}>THC {product.thc_percent}%</span>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-400">เริ่มต้น</p>
              <p className="text-base font-bold text-primary">
                {(product.price ?? 0) > 0 ? formatPrice(product.price ?? 0) : "สอบถาม"}
              </p>
            </div>
            <Button
              size="sm"
              disabled={outOfStock}
              onClick={handleAdd}
              className="h-8 bg-primary text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-primary/90 disabled:opacity-50 active:scale-95"
            >
              {outOfStock ? "หมด" : "เพิ่ม"}
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Shop Page ────────────────────────────────────────────────────────────────

const CATEGORIES = ["ทั้งหมด", "Seeds", "Accessories", "Nutrients"];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const breederParam = searchParams.get("breeder");
  const qParam = searchParams.get("q") ?? "";

  /** Full catalog client-side (~90 items): no server limit — instant filter in memory */
  const { products, isLoading } = useProducts({ autoFetch: true, includeVariants: true });
  const { breeders: allBreeders } = useBreeders();
  const { locale, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    setSearchTerm(qParam);
  }, [qParam]);
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [activeBreeder, setActiveBreeder] = useState<string>("ทั้งหมด");
  const [showFilter, setShowFilter] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(false);

  // Breeder selected via URL param (must be before any hook that depends on it)
  const urlBreeder = useMemo(
    () => (breederParam ? allBreeders.find((b) => b.id === Number(breederParam)) : null),
    [breederParam, allBreeders]
  );

  useEffect(() => {
    setBannerExpanded(false);
  }, [urlBreeder?.id]);

  // Extract unique breeder names for the filter panel (used when no URL param)
  const breederNames = useMemo(() => {
    const names = products.map((p) => p.breeders?.name).filter(Boolean) as string[];
    return ["ทั้งหมด", ...Array.from(new Set(names))];
  }, [products]);

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

  const filteredProducts = useMemo(() => {
    return searchFilteredProducts.filter((p) => {
      const matchCategory = activeCategory === "ทั้งหมด" || p.category === activeCategory;
      const matchBreeder = urlBreeder
        ? p.breeder_id === urlBreeder.id
        : activeBreeder === "ทั้งหมด" || p.breeders?.name === activeBreeder;
      return matchCategory && matchBreeder;
    });
  }, [searchFilteredProducts, activeCategory, activeBreeder, urlBreeder]);

  const hasFilters =
    activeCategory !== "ทั้งหมด" || activeBreeder !== "ทั้งหมด" || searchTerm.trim().length > 0;

  const clearFilters = () => {
    setSearchTerm("");
    setActiveCategory("ทั้งหมด");
    setActiveBreeder("ทั้งหมด");
    if (breederParam) router.push("/shop");
  };

  const activeBreederId = breederParam ? parseInt(breederParam, 10) : null;
  const safeActiveId = activeBreederId != null && !Number.isNaN(activeBreederId) ? activeBreederId : null;

  const isEn = locale === "en";
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
    <div className="min-h-screen bg-white pt-20">
      {/* Sticky Breeder Ribbon — stays at top for easy brand switching */}
      <div className="sticky top-20 z-20 border-b border-zinc-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
        <div className="mx-auto max-w-7xl">
          <BreederRibbon compact activeBreederId={safeActiveId} scrollOnNav={false} />
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
                กลับไปหน้ารวมค่ายเมล็ด
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
                {isLoading ? "กำลังโหลด..." : `${filteredProducts.length} สายพันธุ์`}
              </p>
            </div>

            <div className="shrink-0">
              <Button variant="outline" size="sm" onClick={() => router.push("/shop")} className="gap-1.5 border-zinc-200 text-zinc-600 hover:border-primary hover:text-primary">
                <ChevronLeft className="h-4 w-4" />
                ดูสินค้าทั้งหมดของร้าน
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Default Header */
        <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">ร้านค้า</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {isLoading ? "กำลังโหลด..." : `${filteredProducts.length} รายการ`}
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Search + Filter Toggle */}
        <div className="mb-5 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder={t("ค้นหาสินค้าหรือแบรนด์...", "Search products or brands...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-w-0 pl-9"
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
            onClick={() => setShowFilter((v) => !v)}
            className={showFilter ? "border-primary bg-primary/5 text-primary" : ""}
          >
            <SlidersHorizontal className="mr-1.5 h-4 w-4" />
            ตัวกรอง
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="mb-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-4">
            {/* Category */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                หมวดหมู่
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      activeCategory === cat
                        ? "bg-primary text-white"
                        : "bg-white border border-zinc-200 text-zinc-600 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Breeder */}
            {breederNames.length > 1 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Breeder / แบรนด์
                </p>
                <div className="flex flex-wrap gap-2">
                  {breederNames.map((b) => (
                    <button
                      key={b}
                      onClick={() => setActiveBreeder(b)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        activeBreeder === b
                          ? "bg-primary text-white"
                          : "bg-white border border-zinc-200 text-zinc-600 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Filter Chips */}
        {hasFilters && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            {activeCategory !== "ทั้งหมด" && (
              <Badge variant="outline" className="gap-1 text-xs">
                {activeCategory}
                <button onClick={() => setActiveCategory("ทั้งหมด")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {activeBreeder !== "ทั้งหมด" && (
              <Badge variant="outline" className="gap-1 text-xs">
                {activeBreeder}
                <button onClick={() => setActiveBreeder("ทั้งหมด")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-zinc-400 underline hover:text-zinc-600"
            >
              ล้างทั้งหมด
            </button>
          </div>
        )}

        {/* Breeder profile cards when search matches a brand */}
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
                    href={`/shop?breeder=${b.id}`}
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

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-zinc-100">
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
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        )}
      </div>
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
