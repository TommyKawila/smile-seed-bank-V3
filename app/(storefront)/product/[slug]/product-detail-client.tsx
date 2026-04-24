"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ShoppingCart, Leaf, FlaskConical, TestTube2, Flower2, Gauge, Sprout, Clock, Dna, GitFork, Package } from "lucide-react";
type ProductWithSpecs = ProductFull;
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useCartContext } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslations } from "@/hooks/use-translations";
import { labelFloweringType } from "@/lib/cannabis-attributes";
import { seedTypeDetailShort, sexTypeDetailShort } from "@/lib/seed-type-filter";
import { cn, formatPrice } from "@/lib/utils";
import { getClearancePercentOff, getEffectiveVariantPrice } from "@/lib/product-utils";
import { shopBreederHref } from "@/lib/breeder-slug";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { StickyBuyBar } from "@/components/storefront/StickyBuyBar";
import { requestCartFlyAnimation } from "@/components/storefront/CartAnimation";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import {
  FeminizedSeedSpecChip,
  FeminizedStatCard,
  GeneticRatioBar,
  RegularSeedSpecChip,
  RegularStatCard,
} from "@/components/storefront/ProductSpecs";
import type { ProductFull, ProductVariant } from "@/types/supabase";
import { resolveDetailHeroUrl } from "@/lib/product-gallery-utils";
/** Sans + tabular figures for prices and spec values (same family as nav). */
const fontSansTabular = "font-sans tabular-nums";

function fillN(template: string, n: number) {
  return template.replace(/\{n\}/g, String(n));
}

function formatCbdDisplay(raw: string | number | null | undefined): string {
  if (raw == null || raw === "") return "";
  const s = String(raw).trim();
  if (!s) return "";
  if (s.includes("%") || /^[<>≤≥]/.test(s)) return s;
  return `${s}%`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toArray(data: unknown): string[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.map(String);
  if (typeof data === "string") return data.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function normalizeSpecCompare(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Genetics row: show only when genetic_ratio is set and not redundant vs lineage */
function shouldShowGeneticsRow(
  geneticRatio: string | null | undefined,
  lineage: string | null | undefined
): boolean {
  const gr = (geneticRatio ?? "").trim();
  if (!gr) return false;
  const ln = (lineage ?? "").trim();
  if (!ln) return true;
  return normalizeSpecCompare(gr) !== normalizeSpecCompare(ln);
}

/** Description body; subtle emphasis on names and THC/CBD tokens (no heavy bold). */
function formatDescriptionJournal(text: string, productName: string): React.ReactNode {
  if (!productName.trim()) return text;
  const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped}|THC\\s*\\d+\\s*%|CBD\\s*\\d+\\s*%)`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="font-normal text-zinc-800">
        {part}
      </span>
    ) : (
      part
    )
  );
}

const statCardShell =
  "flex flex-col items-center justify-center rounded-[length:var(--radius)] border border-zinc-200 bg-zinc-50 p-4 text-center";

// Stat card — unified light surface + emerald icon accent
function StatCard({
  value,
  label,
  icon: Icon,
}: {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={statCardShell}>
      <Icon className="mb-1.5 h-6 w-6 text-primary" aria-hidden />
      <span className={cn("text-xl font-semibold tracking-tight text-zinc-900", fontSansTabular)}>
        {value}
      </span>
      <span className="mt-0.5 text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</span>
    </div>
  );
}

// Chip row with colored pills
function ChipRow({
  emoji,
  label,
  data,
  chipClass = "bg-zinc-100 text-zinc-700",
}: {
  emoji: string;
  label: string;
  data: unknown;
  chipClass?: string;
}) {
  const items = toArray(data);
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
        <span>{emoji}</span> {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${chipClass}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// Info row for text specs (with optional icon)
function SpecRow({
  label,
  value,
  alwaysShow = false,
  icon: Icon,
}: {
  label: string;
  value: string | number | null | undefined;
  alwaysShow?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (!value && value !== 0 && !alwaysShow) return null;
  const display = value ?? "Unknown";
  const isUnk = display === "Unknown";
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 py-2.5 text-sm last:border-0">
      <span className="flex shrink-0 items-center gap-2 text-zinc-500">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        {label}
      </span>
      <span
        className={cn(
          "text-right text-sm font-medium",
          fontSansTabular,
          isUnk ? "text-muted-foreground italic" : "text-zinc-800"
        )}
      >
        {display}
      </span>
    </div>
  );
}

function parsePackCountFromLabel(unitLabel: string): number {
  const m = String(unitLabel).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function sortVariantsByPriceThenPack<T extends { price: number; unit_label: string }>(
  variants: T[]
): T[] {
  return [...variants].sort((a, b) => {
    const d = a.price - b.price;
    if (d !== 0) return d;
    return parsePackCountFromLabel(a.unit_label) - parsePackCountFromLabel(b.unit_label);
  });
}

/** Internal browse URL from document.referrer (same product excluded). */
function getValidListReferrerPath(): string | null {
  if (typeof document === "undefined" || !document.referrer) return null;
  let u: URL;
  try {
    u = new URL(document.referrer);
  } catch {
    return null;
  }
  if (u.origin !== window.location.origin) return null;
  const path = u.pathname;
  if (path.startsWith("/api") || path.startsWith("/admin") || path.startsWith("/_next")) {
    return null;
  }
  if (path === window.location.pathname) return null;
  return u.pathname + (u.search || "") + (u.hash || "");
}

// ─── Product Detail Page ──────────────────────────────────────────────────────

export default function ProductDetailClient({
  initialProduct,
}: {
  initialProduct: ProductFull | null;
}) {
  const { addToCart, openCart } = useCartContext();
  const { locale, t } = useLanguage();
  const { t: tMsg } = useTranslations();

  const [product] = useState<ProductWithSpecs | null>(initialProduct);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(() => {
    if (!initialProduct) return null;
    const active =
      initialProduct.product_variants?.filter((v) => v.is_active !== false) ?? [];
    const sorted = sortVariantsByPriceThenPack(active);
    return sorted.find((v) => (v.stock ?? 0) > 0) ?? sorted[0] ?? null;
  });
  const [added, setAdded] = useState(false);
  const [infoTab, setInfoTab] = useState("specs");
  const [showStickyBuy, setShowStickyBuy] = useState(false);
  const [listReferrerPath, setListReferrerPath] = useState<string | null>(null);
  const mainAddToCartRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setListReferrerPath(getValidListReferrerPath());
  }, [product?.id]);

  const handleAddToCart = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (!product || !selectedVariant) return;
    const unit = getEffectiveVariantPrice(product, Number(selectedVariant.price));
    const { error } = addToCart({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      productImage: resolveDetailHeroUrl(product, selectedVariant.id),
      unitLabel: selectedVariant.unit_label,
      price: unit,
      quantity: 1,
      stock_quantity: selectedVariant.stock ?? 0,
      masterSku: (product as { master_sku?: string | null }).master_sku ?? null,
      breeder_id: product.breeder_id ?? null,
      breederLogoUrl: product.breeders?.logo_url ?? null,
    });
    if (error) {
      toast.error(error);
      return;
    }
    if (e?.currentTarget) {
      const img = resolveDetailHeroUrl(product, selectedVariant.id);
      requestCartFlyAnimation(e.currentTarget, {
        productName: product.name,
        productImage: img,
        locale: locale as "th" | "en",
        announceTh: `เพิ่มสินค้า '${product.name}' เข้าตะกร้าแล้ว`,
        announceEn: `Added “${product.name}” to your cart`,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCart();
  };

  useEffect(() => {
    const el = mainAddToCartRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBuy(!entry.isIntersecting);
      },
      { root: null, threshold: 0, rootMargin: "0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [product.id, selectedVariant?.id]);

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 pt-16 text-center font-sans">
        <Leaf className="h-12 w-12 text-zinc-200" />
        <p className={cn("font-sans", "text-lg font-medium text-zinc-700")}>ไม่พบสินค้า</p>
        <Button asChild variant="outline">
          <Link href="/shop">{tMsg("common.back_to_shop", "Back to Shop")}</Link>
        </Button>
      </div>
    );
  }

  const backNav: { href: string; text: string; title: string } = (() => {
    if (listReferrerPath) {
      const text = t("กลับไปหน้าก่อน", "Back to previous page");
      return { href: listReferrerPath, text, title: text };
    }
    if (product.breeders) {
      const textTh = `กลับไปที่ ${product.breeders.name}`;
      const textEn = `Back to ${product.breeders.name}`;
      return {
        href: shopBreederHref(product.breeders),
        text: locale === "th" ? textTh : textEn,
        title: locale === "th" ? textTh : textEn,
      };
    }
    const fallback = tMsg("common.back_to_shop", "Back to Shop");
    return { href: "/shop", text: fallback, title: fallback };
  })();

  const activeVariants = sortVariantsByPriceThenPack(
    product.product_variants?.filter((v) => v.is_active !== false) ?? []
  );
  const outOfStock = !selectedVariant || selectedVariant.stock === 0;
  const clearancePct = getClearancePercentOff(product);
  const selectedEff =
    selectedVariant != null ? getEffectiveVariantPrice(product, Number(selectedVariant.price)) : 0;
  const selectedList = selectedVariant != null ? Number(selectedVariant.price) : 0;

  const preferredDesc = locale === "th" ? product.description_th : product.description_en;
  const fallbackDesc = locale === "th" ? product.description_en : product.description_th;
  const descPlain = (preferredDesc?.trim() || fallbackDesc?.trim() || "").trim();

  const goToFullDescription = () => {
    setInfoTab("description");
    window.setTimeout(() => {
      document.getElementById("product-full-description")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-white pt-16 font-sans sm:pt-28",
        showStickyBuy && "max-lg:pb-28"
      )}
    >
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 sm:py-6">
        {/* Breadcrumb / back — list referrer, else breeder page, else shop */}
        <Link
          href={backNav.href}
          className="mb-2 inline-flex max-w-full min-w-0 items-center gap-1 text-sm text-zinc-500 hover:text-primary sm:mb-4"
          title={backNav.title}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 truncate font-sans">{backNav.text}</span>
        </Link>

        {/* Main Layout */}
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
          {/* ── Left: Image Gallery ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <ProductGallery product={product} selectedVariantId={selectedVariant?.id ?? null} />
          </motion.div>

          {/* ── Right: Info ───────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-white/95 p-4 shadow-sm sm:gap-2.5 sm:p-5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
          >
            <div className="flex min-w-0 items-start gap-3 max-lg:gap-2.5">
              <div className="min-w-0 flex-1 space-y-1.5 max-lg:space-y-1">
                <h1 className="font-sans text-2xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
                  {product.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  {clearancePct != null && clearancePct > 0 && (
                    <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                      −{clearancePct}%
                    </span>
                  )}
                  <div className="flex min-w-0 flex-col">
                    {selectedVariant && selectedList > selectedEff && (
                      <span
                        className={cn(
                          fontSansTabular,
                          "text-sm tabular-nums text-zinc-400 line-through"
                        )}
                      >
                        {formatPrice(selectedList)}
                      </span>
                    )}
                    <span
                      className={cn(
                        fontSansTabular,
                        "text-2xl font-extrabold text-emerald-600 sm:text-3xl"
                      )}
                    >
                      {selectedVariant ? formatPrice(selectedEff) : "—"}
                    </span>
                  </div>
                  {selectedVariant &&
                    (selectedVariant.stock ?? 0) <= 5 &&
                    (selectedVariant.stock ?? 0) > 0 && (
                      <Badge className="shrink-0 border border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/10">
                        {fillN(tMsg("product.only_n_left", "Only {n} left"), selectedVariant.stock ?? 0)}
                      </Badge>
                    )}
                </div>
              </div>
              {product.breeders && (
                <Link
                  href={shopBreederHref(product.breeders)}
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-zinc-200/90 bg-white shadow-md ring-1 ring-zinc-100/80 transition-transform hover:scale-[1.02] hover:shadow-lg"
                  aria-label={product.breeders.name}
                >
                  <BreederLogoImage
                    src={product.breeders.logo_url}
                    breederName={product.breeders.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-lg"
                    imgClassName="object-contain p-0.5"
                    sizes="48px"
                  />
                </Link>
              )}
            </div>

            <GeneticRatioBar
              product={product}
              variant="compact"
              t={t}
              className={cn(fontSansTabular, "text-[11px] sm:text-xs -mt-0.5 max-lg:mb-0.5")}
            />

            {descPlain ? (
              <div className="space-y-1 max-lg:mt-0">
                <p
                  className={cn(
                    fontSansTabular,
                    "line-clamp-3 whitespace-pre-line text-sm font-light leading-relaxed text-zinc-600"
                  )}
                >
                  {descPlain}
                </p>
                <button
                  type="button"
                  onClick={goToFullDescription}
                  className="font-sans text-sm font-medium text-primary hover:underline"
                >
                  {t("อ่านเพิ่มเติม", "Read more")}
                </button>
              </div>
            ) : null}

            {/* Spec chips */}
            <div className="flex flex-wrap gap-2">
              {product.flowering_type && (
                <span
                  className={cn(
                    fontSansTabular,
                    "inline-flex items-center rounded-sm border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-800"
                  )}
                >
                  {labelFloweringType(product.flowering_type)}
                </span>
              )}
              {product.seed_type === "FEMINIZED" && <FeminizedSeedSpecChip />}
              {product.seed_type === "REGULAR" && <RegularSeedSpecChip />}
              {product.thc_percent != null && (
                <span
                  className={cn(
                    fontSansTabular,
                    "inline-flex items-center rounded-sm border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-medium text-emerald-950"
                  )}
                >
                  THC {product.thc_percent}%
                </span>
              )}
              {product.cbd_percent ? (
                <span
                  className={cn(
                    fontSansTabular,
                    "inline-flex items-center rounded-sm border border-violet-200/80 bg-violet-50/80 px-2.5 py-1 text-[11px] font-medium text-zinc-800"
                  )}
                >
                  CBD {formatCbdDisplay(product.cbd_percent)}
                </span>
              ) : null}
            </div>

            <Separator className="my-0" />

            {/* Variant Selector */}
            {activeVariants.length > 0 && (
              <div className="space-y-2">
                <p className="font-sans text-sm font-bold text-zinc-900">{t("เลือกแพ็กเกจ", "Pack size")}</p>
                <div className="flex flex-wrap gap-2">
                  {activeVariants.map((v) => {
                    const soldOut = (v.stock ?? 0) === 0;
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => !soldOut && setSelectedVariant(v)}
                        disabled={soldOut}
                        className={`relative rounded-lg border-2 px-4 py-2.5 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-zinc-900 shadow-sm ring-1 ring-primary/25"
                            : soldOut
                            ? "border-zinc-100 bg-zinc-50 text-zinc-300 line-through cursor-not-allowed"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-primary/40"
                        }`}
                      >
                        <span className="block text-[11px] font-normal leading-tight text-inherit opacity-90">
                          {v.unit_label}
                        </span>
                        <span
                          className={cn(
                            "block text-base font-semibold",
                            fontSansTabular,
                            isSelected ? "text-primary" : "text-zinc-900"
                          )}
                        >
                          {formatPrice(getEffectiveVariantPrice(product, Number(v.price)))}
                        </span>
                        {(v.stock ?? 0) <= 5 && (v.stock ?? 0) > 0 && (
                          <span className="block text-[10px] text-destructive">
                            {fillN(tMsg("product.stock_left_simple", "{n} left"), v.stock ?? 0)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              ref={mainAddToCartRef}
              onClick={handleAddToCart}
              disabled={outOfStock || !selectedVariant}
              className="h-12 w-full bg-primary text-base font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {outOfStock
                ? t("หมดสต็อก", "Out of stock")
                : added
                  ? t("✓ เพิ่มแล้ว!", "✓ Added!")
                  : tMsg("product.add_to_cart", "Add to Cart")}
            </Button>
          </motion.div>
        </div>

        {/* ── Premium Specs Section ─────────────────────────────────────── */}
        <div id="product-full-description" className="mt-8 scroll-mt-24 sm:mt-10">
          <Tabs value={infoTab} onValueChange={setInfoTab}>
            <TabsList className="h-auto w-full flex-wrap gap-1 bg-zinc-100/90 p-1.5 sm:w-auto">
              <TabsTrigger
                value="specs"
                className={cn(
                  "font-sans",
                  "flex-1 rounded-sm px-3 py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm sm:flex-none"
                )}
              >
                🧬 {t("พันธุกรรม & สเปก", "Genetics & Specs")}
              </TabsTrigger>
              <TabsTrigger
                value="effects"
                className={cn(
                  "font-sans",
                  "flex-1 rounded-sm px-3 py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm sm:flex-none"
                )}
              >
                ⚡ {t("ผล & รสชาติ", "Effects & Flavors")}
              </TabsTrigger>
              <TabsTrigger
                value="description"
                className={cn(
                  "font-sans",
                  "flex-1 rounded-sm px-3 py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm sm:flex-none"
                )}
              >
                📋 {t("คำบรรยาย", "Description")}
              </TabsTrigger>
            </TabsList>

            {/* ── Genetics & Specs (Bento Grid) ─────────────────────────── */}
            <TabsContent value="specs" className="mt-4">
              <div className="space-y-4">

                {/* Stat Cards Row */}
                {(product.thc_percent ||
                  product.cbd_percent ||
                  product.flowering_type ||
                  product.sex_type ||
                  product.seed_type === "FEMINIZED" ||
                  product.seed_type === "REGULAR") && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {product.thc_percent != null && (
                      <StatCard value={`${product.thc_percent}%`} label="THC" icon={FlaskConical} />
                    )}
                    {product.cbd_percent != null && product.cbd_percent !== "" && (
                      <StatCard
                        value={formatCbdDisplay(product.cbd_percent)}
                        label="CBD"
                        icon={TestTube2}
                      />
                    )}
                    {(product.flowering_type ??
                      product.sex_type ??
                      (product.seed_type === "FEMINIZED" ? "feminized" : null) ??
                      (product.seed_type === "REGULAR" ? "regular" : null))
                      ? (() => {
                          const isFem =
                            product.sex_type === "feminized" ||
                            (product.seed_type === "FEMINIZED" &&
                              !product.flowering_type &&
                              !product.sex_type);
                          const isReg =
                            !isFem &&
                            (product.seed_type === "REGULAR" || product.sex_type === "regular");
                          if (isFem) {
                            return <FeminizedStatCard label={t("ประเภทเพศ", "Sex Type")} />;
                          }
                          if (isReg) {
                            return <RegularStatCard label={t("ประเภทเพศ", "Sex Type")} />;
                          }
                          const v =
                            sexTypeDetailShort(product.sex_type) ??
                            (product.flowering_type
                              ? labelFloweringType(product.flowering_type)
                              : null) ??
                            "—";
                          return (
                            <StatCard value={v} label={t("ประเภทเพศ", "Sex Type")} icon={Flower2} />
                          );
                        })()
                      : null}
                    <StatCard
                      value={product.growing_difficulty ?? "Unknown"}
                      label={t("ความยาก", "Difficulty")}
                      icon={Gauge}
                    />
                  </div>
                )}

                <GeneticRatioBar
                  product={product}
                  variant="card"
                  t={t}
                  className={cn(fontSansTabular, "text-[11px] sm:text-xs")}
                />

                {/* Genetics Details Card */}
                {(shouldShowGeneticsRow(product.genetic_ratio, product.lineage) ||
                  product.lineage?.trim() ||
                  product.seed_type ||
                  product.flowering_type ||
                  product.yield_info) && (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/90 p-5 shadow-sm">
                    <p className="mb-3 flex items-center gap-2 font-sans text-sm font-bold text-zinc-900">
                      <Dna className="h-4 w-4 text-primary" /> {t("โปรไฟล์พันธุกรรม", "Genetic Profile")}
                    </p>
                    {shouldShowGeneticsRow(product.genetic_ratio, product.lineage) && (
                      <SpecRow label={t("พันธุกรรม", "Genetics")} value={product.genetic_ratio} icon={Dna} />
                    )}
                    <SpecRow label={t("สายเลือด", "Lineage")} value={product.lineage} icon={GitFork} />
                    <SpecRow
                      label={t("ประเภทดอก", "Flowering")}
                      value={labelFloweringType(product.flowering_type)}
                      icon={Clock}
                    />
                    <SpecRow
                      label={t("ประเภทเมล็ด", "Seed Type")}
                      value={seedTypeDetailShort(product.seed_type) ?? product.seed_type ?? ""}
                      icon={Package}
                    />
                    <SpecRow label={t("ผลผลิต", "Yield")} value={product.yield_info} alwaysShow icon={Sprout} />
                  </div>
                )}

                {/* Terpene Profile */}
                {toArray(product.terpenes).length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                    <ChipRow
                      emoji="🫙"
                      label={t("เทอร์พีน", "Terpene Profile")}
                      data={product.terpenes}
                      chipClass="border border-violet-200/80 bg-white text-violet-800"
                    />
                  </div>
                )}

                {/* Empty state */}
                {!shouldShowGeneticsRow(product.genetic_ratio, product.lineage) &&
                  !product.thc_percent &&
                  !product.lineage?.trim() &&
                  toArray(product.terpenes).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-400">
                    {t("ยังไม่มีข้อมูล AI Specs", "No AI specs available yet")}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Effects & Flavors ──────────────────────────────────────── */}
            <TabsContent value="effects" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">

                {toArray(product.effects).length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                    <ChipRow
                      emoji="⚡"
                      label={t("อาการ / ความรู้สึก", "Effects")}
                      data={product.effects}
                      chipClass="border border-zinc-200 bg-white text-zinc-800"
                    />
                  </div>
                )}

                {toArray(product.flavors).length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                    <ChipRow
                      emoji="🍋"
                      label={t("รสชาติ & กลิ่น", "Flavors & Aroma")}
                      data={product.flavors}
                      chipClass="border border-zinc-200 bg-white text-zinc-800"
                    />
                  </div>
                )}

                {toArray(product.medical_benefits).length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:col-span-2">
                    <ChipRow
                      emoji="💊"
                      label={t("สรรพคุณทางยา", "Medical Benefits")}
                      data={product.medical_benefits}
                      chipClass="border border-zinc-200 bg-white text-zinc-800"
                    />
                  </div>
                )}

                {toArray(product.effects).length === 0 && toArray(product.flavors).length === 0 && toArray(product.medical_benefits).length === 0 && (
                  <div className="col-span-2 rounded-2xl border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-400">
                    {t("ยังไม่มีข้อมูล Effects & Flavors", "No effects or flavors data yet")}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Description (locale-based, pre-line, bold terms, icon sections) ─ */}
            <TabsContent value="description" className="mt-4">
              <div className="space-y-5">
                {(() => {
                  const preferred = locale === "th" ? product.description_th : product.description_en;
                  const fallback = locale === "th" ? product.description_en : product.description_th;
                  const text = (preferred?.trim() || fallback?.trim() || "") || null;
                  const hasLineage = product.lineage?.trim();
                  const hasGeneticsDistinct = shouldShowGeneticsRow(
                    product.genetic_ratio,
                    product.lineage
                  );
                  const hasYield = product.yield_info?.trim();
                  const terpeneList = toArray(product.terpenes);
                  const hasTerpenes = terpeneList.length > 0;
                  const hasDifficulty = product.growing_difficulty?.trim();
                  const hasStructured =
                    hasLineage || hasGeneticsDistinct || hasYield || hasTerpenes || hasDifficulty;

                  if (!text && !hasStructured) {
                    return (
                      <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
                        <p className="text-sm text-zinc-400">{t("ยังไม่มีคำบรรยาย", "No description available")}</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {text && (
                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
                          {(text.match(/\n\n/) ? text.split(/\n\n+/) : [text]).map((para, i) => (
                            <p
                              key={i}
                              className="mb-4 text-sm font-light leading-relaxed text-zinc-600 last:mb-0 whitespace-pre-line"
                            >
                              {formatDescriptionJournal(para.trim(), product.name)}
                            </p>
                          ))}
                        </div>
                      )}
                      {hasStructured && (
                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6 space-y-3">
                          {hasGeneticsDistinct && (
                            <p className="flex items-start gap-2 text-sm text-zinc-700">
                              <Dna className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                              <span>
                                <span className="font-semibold text-zinc-800">{t("พันธุกรรม", "Genetics")}:</span>{" "}
                                {product.genetic_ratio}
                              </span>
                            </p>
                          )}
                          {hasLineage && (
                            <p className="flex items-start gap-2 text-sm text-zinc-700">
                              <GitFork className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                              <span>
                                <span className="font-semibold text-zinc-800">{t("สายเลือด", "Lineage")}:</span>{" "}
                                {product.lineage}
                              </span>
                            </p>
                          )}
                          {hasDifficulty && (
                            <p className="text-sm text-zinc-700">
                              <span className="mr-2">🌿</span>
                              <span className="font-semibold text-zinc-800">{t("คุณสมบัติการเติบโต", "Growth")}:</span> {product.growing_difficulty}
                            </p>
                          )}
                          {hasTerpenes && (
                            <p className="text-sm text-zinc-700">
                              <span className="mr-2">🍋</span>
                              <span className="font-semibold text-zinc-800">{t("รสชาติและกลิ่น", "Flavor & Aroma")}:</span> {terpeneList.join(", ")}
                            </p>
                          )}
                          {hasYield && (
                            <p className="text-sm text-zinc-700">
                              <span className="mr-2">⚖️</span>
                              <span className="font-semibold text-zinc-800">{t("ผลผลิต", "Yield")}:</span> {product.yield_info}
                            </p>
                          )}
                          {product.breeders?.name && (
                            <p className="text-sm text-zinc-700 pt-1 border-t border-zinc-100">
                              <span className="mr-2">🏆</span>
                              <span className="font-semibold text-zinc-800">{t("บทสรุป", "Summary")}:</span> {product.name} {t("โดย", "by")} {product.breeders.name}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </TabsContent>
          </Tabs>
          {(product.master_sku ?? "").trim() !== "" && (
            <p className="mt-8 border-t border-zinc-100 pt-6 font-sans text-xs text-zinc-500">
              {t("รหัสสินค้า", "SKU")}:{" "}
              <span className="font-medium tabular-nums text-zinc-600">{product.master_sku}</span>
            </p>
          )}
        </div>
      </div>

      {selectedVariant && (
        <StickyBuyBar
          visible={showStickyBuy}
          productName={product.name}
          priceLabel={formatPrice(selectedEff)}
          outOfStock={outOfStock}
          disabled={outOfStock}
          onAdd={handleAddToCart}
          addLabel={tMsg("product.add_to_cart", "Add to Cart")}
          outOfStockLabel={t("หมดสต็อก", "Out of stock")}
          lowStock={
            !outOfStock && (selectedVariant.stock ?? 0) > 0 && (selectedVariant.stock ?? 0) <= 5
          }
          lowStockLabel={t("เหลือน้อย", "Low stock")}
        />
      )}
    </div>
  );
}
