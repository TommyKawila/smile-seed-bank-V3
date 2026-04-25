"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { getGeneticPercents } from "@/components/storefront/ProductSpecs";
import { formatPrice } from "@/lib/utils";
import {
  computeStartingPrice,
  getClearancePercentOff,
  getEffectiveListingPrice,
  getEffectiveVariantPrice,
  getStartingVariant,
  getStartingVariantLabel,
} from "@/lib/product-utils";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { getProductAggregateStock, isProductAggregateOutOfStock } from "@/lib/product-stock";
import { productDetailHref } from "@/lib/product-utils";
import { shopBreederHref } from "@/lib/breeder-slug";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { CatalogImagePlaceholder } from "@/components/storefront/CatalogImagePlaceholder";
import { requestCartFlyAnimation } from "@/components/storefront/CartAnimation";
import { toast } from "sonner";

const shopCardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const showcaseCardVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const glassBadge =
  "rounded-full border border-white/30 bg-white/20 px-2 py-0.5 text-[10px] font-medium backdrop-blur-md";

function getPrimaryImage(product: {
  image_urls?: unknown;
  image_url?: string | null;
  product_images?: unknown;
}): string | null {
  return getListingThumbnailUrl(product);
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
  const inStock =
    product.product_variants?.filter(
      (v) => v.is_active !== false && (v.stock ?? 0) > 0
    ) ?? [];
  return getStartingVariant(inStock);
}

const NEW_ARRIVAL_MS = 35 * 24 * 60 * 60 * 1000;

function isNewArrivalProduct(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < NEW_ARRIVAL_MS;
}

type ProductListItem = ReturnType<typeof useProducts>["products"][number];

/** Urgency strip below image: same height for every card (empty = spacer). */
const URGENCY_STRIP_H = "h-10";

/** Indica / Sativa / Hybrid for card spec row */
function cardStrainTypeLabel(p: ProductListItem): string | null {
  const sd = (p.strain_dominance ?? "").trim();
  if (sd) {
    const lower = sd.toLowerCase();
    if (lower.includes("hybrid") || lower.includes("50/50")) return "Hybrid";
    if (lower.includes("mostly sativa") || /^sativa/i.test(sd)) return "Sativa";
    if (lower.includes("mostly indica") || /^indica/i.test(sd)) return "Indica";
  }
  const g = getGeneticPercents(p);
  if (g) {
    if (g.sativa >= 58) return "Sativa";
    if (g.indica >= 58) return "Indica";
    return "Hybrid";
  }
  return null;
}

/** Single letter for compact genetics pill (I / S / H) */
function cardGeneticsLetter(p: ProductListItem): string {
  const label = cardStrainTypeLabel(p);
  if (!label) return "—";
  if (label === "Indica") return "I";
  if (label === "Sativa") return "S";
  if (label === "Hybrid") return "H";
  return label.slice(0, 1).toUpperCase();
}

type ProductWithMeta = ProductListItem & { created_at?: string | null };

function ProductImageBadges({ product, t }: { product: ProductWithMeta; t: (th: string, en: string) => string }) {
  const showBest = Boolean(product.is_featured);
  const showNew = isNewArrivalProduct(product.created_at);
  if (!showBest && !showNew) return null;
  return (
    <div className="absolute right-2 top-2 z-20 flex max-w-[min(55%,calc(100%-3.5rem))] flex-col items-end gap-1">
      {showBest && (
        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-white/30">
          {t("ขายดี", "Best Seller")}
        </span>
      )}
      {showNew && (
        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-white/30">
          {t("ใหม่", "New Arrival")}
        </span>
      )}
    </div>
  );
}

export function ProductCard({
  product,
  variant = "shop",
}: {
  product: ProductListItem;
  variant?: "shop" | "showcase";
}) {
  const { addToCart, openCart } = useCartContext();
  const { t, locale } = useLanguage();
  const loc = locale as "th" | "en";
  const stock = getProductAggregateStock(product);
  const outOfStock = isProductAggregateOutOfStock(product);
  const lastOneLeft = !outOfStock && stock === 1;
  const lowStock = !outOfStock && stock > 0 && stock <= 5;
  const defaultVariant = getDefaultVariant(product);
  const cardImage = getPrimaryImage(product);
  const pm = product as ProductWithMeta;

  const stopNavBubble = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const successToast = (isTh: boolean) =>
    isTh ? "เพิ่มลงตะกร้าเรียบร้อยแล้ว" : "Added to your cart";
  const localizedAddError = (msg: string) => {
    if (locale === "en" && (msg.startsWith("ขออภัย") || /สต็อก|ชิ้น/.test(msg))) {
      return "Sorry, only a limited number of this item is in stock.";
    }
    return msg;
  };

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    stopNavBubble(e);
    if (defaultVariant) {
      const unit = getEffectiveVariantPrice(product, Number(defaultVariant.price));
      const { error } = addToCart({
        variantId: defaultVariant.id,
        productId: product.id,
        productName: product.name,
        productImage: cardImage,
        unitLabel: defaultVariant.unit_label,
        price: unit,
        quantity: 1,
        stock_quantity: defaultVariant.stock ?? 0,
        masterSku: (product as { master_sku?: string | null }).master_sku ?? null,
        breeder_id: product.breeder_id ?? null,
        breederLogoUrl: product.breeders?.logo_url ?? null,
      });
      if (error) {
        toast.error(localizedAddError(error));
        return;
      }
      const announceTh = `เพิ่มสินค้า '${product.name}' เข้าตะกร้าแล้ว`;
      const announceEn = `Added “${product.name}” to your cart`;
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        toast.success(locale === "th" ? announceTh : announceEn, { duration: 2800 });
        return;
      }
      requestCartFlyAnimation(e.currentTarget, {
        productName: product.name,
        productImage: cardImage,
        locale: loc,
        announceTh,
        announceEn,
      });
      toast.success(successToast(locale === "th"), { duration: 2200 });
    } else {
      toast.error(
        locale === "th" ? "ไม่พบแพ็กสำหรับสั่งซื้อ" : "No pack available to order"
      );
      openCart();
    }
  };

  const motionVariants = variant === "showcase" ? showcaseCardVariant : shopCardVariants;
  const thcPill =
    product.thc_percent != null && Number.isFinite(Number(product.thc_percent))
      ? `${Math.round(Number(product.thc_percent))}%`
      : "—";
  const genLetter = cardGeneticsLetter(product);
  const typePill = cardStrainTypeLabel(product) ?? genLetter;
  const listFrom = getEffectiveListingPrice(product);
  const listRegular = computeStartingPrice(product.product_variants);
  const clearancePct = getClearancePercentOff(product);
  const showStrike = clearancePct != null && listRegular > listFrom;
  const seedsPackLabel = getStartingVariantLabel(product.product_variants, locale);

  return (
    <motion.div variants={motionVariants} className="h-full">
      <div className="group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:border-zinc-200 hover:shadow-md">
        <div className="relative aspect-square shrink-0 overflow-hidden bg-zinc-50">
          <Link href={productDetailHref(product)} className="absolute inset-0 block">
            {cardImage ? (
              <Image
                src={cardImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${outOfStock ? "brightness-75 grayscale" : ""}`}
                unoptimized={shouldOffloadImageOptimization(cardImage)}
              />
            ) : (
              <CatalogImagePlaceholder
                seed={product.id}
                className={`absolute inset-0 ${outOfStock ? "brightness-75 grayscale" : ""}`}
              />
            )}
          </Link>

          {outOfStock && (
            <div
              className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center bg-zinc-950/35 p-3"
              aria-hidden
            >
              <div className="w-full max-w-[min(92%,15rem)] rounded-md border border-zinc-400/80 bg-zinc-900/95 px-3 py-2.5 text-center shadow-lg ring-1 ring-black/20">
                <p className="font-sans text-[11px] font-extrabold leading-tight text-white sm:text-xs">
                  {t("สินค้าหมด / SOLD OUT", "Sold out / SOLD OUT")}
                </p>
              </div>
            </div>
          )}

          <ProductImageBadges product={pm} t={t} />
          {clearancePct != null && clearancePct > 0 && (
            <span className="absolute right-2 top-12 z-20 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white shadow-sm">
              −{clearancePct}%
            </span>
          )}

          <div className="absolute bottom-2 left-2 z-10 flex max-w-[min(100%,11rem)] flex-wrap gap-1">
            {lowStock && !outOfStock && !lastOneLeft && (
              <span className={`${glassBadge} text-red-800`}>{t("เหลือน้อย", "Low")}</span>
            )}
          </div>

          {product.breeders && (
            <Link
              href={shopBreederHref(product.breeders)}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-2 top-2 z-[15] flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white shadow-md ring-2 ring-white transition-transform hover:scale-105"
              aria-label={product.breeders.name}
            >
              <BreederLogoImage
                src={product.breeders.logo_url}
                breederName={product.breeders.name}
                width={32}
                height={32}
                className="rounded-full"
                imgClassName="object-cover"
                sizes="32px"
              />
            </Link>
          )}
        </div>

        <div className={`relative shrink-0 overflow-hidden ${URGENCY_STRIP_H}`}>
          {lastOneLeft ? (
            <div className="absolute inset-0 overflow-hidden border-b border-red-500/20 bg-gradient-to-r from-red-600 via-rose-600 to-red-700">
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden
              >
                <div
                  className="absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-80 animate-shimmer-urgent"
                  style={{ width: "55%" }}
                />
              </div>
              <p
                className="relative box-border flex h-10 min-h-0 items-center justify-center px-1.5 text-center font-sans text-[8px] font-extrabold leading-tight text-white sm:px-2 sm:text-[10px] sm:leading-none"
                title={
                  loc === "th"
                    ? "โอกาสสุดท้าย! เหลือเพียง 1 ชิ้นเท่านั้น"
                    : "LAST ONE! Only 1 left"
                }
              >
                <span className="line-clamp-1 [overflow-wrap:anywhere]">
                  {loc === "th"
                    ? "🔥 โอกาสสุดท้าย! เหลือเพียง 1 ชิ้นเท่านั้น (ห้ามพลาด!)"
                    : "🔥 LAST ONE! Only 1 left (Act Now!)"}
                </span>
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-2.5 pb-2.5 pt-2">
          <div className="flex shrink-0 items-center justify-center">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold tabular-nums text-zinc-800 ring-1 ring-zinc-200/80">
              <span className="text-emerald-800">THC {thcPill}</span>
              <span className="text-zinc-400">·</span>
              <span className="truncate">{typePill}</span>
            </span>
          </div>

          {product.breeders ? (
            <Link
              href={shopBreederHref(product.breeders)}
              onClick={(e) => e.stopPropagation()}
              className="line-clamp-1 min-h-[1.25rem] shrink-0 text-center text-[11px] font-medium leading-tight text-emerald-600 hover:text-emerald-700"
            >
              {product.breeders.name}
            </Link>
          ) : (
            <div className="min-h-[1.25rem] shrink-0" aria-hidden />
          )}

          <Link
            href={productDetailHref(product)}
            className="flex min-h-[2.5rem] shrink-0 flex-col justify-center"
          >
            <h3 className="line-clamp-2 text-center font-sans text-[14px] font-bold leading-snug tracking-tight text-zinc-900">
              {product.name}
            </h3>
          </Link>

          {lastOneLeft ? (
            <div className="mt-auto flex min-h-0 flex-col border-t border-zinc-100 pt-2">
              <div className="text-center">
                {seedsPackLabel ? (
                  <p className="mb-0.5 font-sans text-[10px] leading-tight text-emerald-600/80 sm:text-xs">
                    {seedsPackLabel}
                  </p>
                ) : null}
                {showStrike && (
                  <p className="text-xs tabular-nums text-zinc-400 line-through">
                    {formatPrice(listRegular)}
                  </p>
                )}
                <p className="text-[15px] font-bold tabular-nums text-zinc-900">
                  {listFrom > 0 ? formatPrice(listFrom) : t("สอบถาม", "Inquire")}
                </p>
              </div>
              <Button
                type="button"
                disabled={!defaultVariant}
                onClick={handleAdd}
                onPointerDown={(e) => e.stopPropagation()}
                className="relative z-20 mt-1.5 h-10 w-full shrink-0 border-0 bg-gradient-to-b from-emerald-500 to-emerald-700 p-0 font-sans text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(16,185,129,0.5)] transition hover:from-emerald-500 hover:to-emerald-800 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
                aria-label={
                  loc === "th" ? "สั่งซื้อก่อนหมด" : "Buy before it is gone"
                }
              >
                <span className="inline-flex h-full w-full animate-urgent-cta-blink items-center justify-center gap-1.5 px-1">
                  {loc === "th" ? "🚀 สั่งซื้อก่อนหมด!" : "🚀 BUY BEFORE IT'S GONE!"}
                </span>
              </Button>
            </div>
          ) : (
            <div className="mt-auto border-t border-zinc-100 pt-2">
              {outOfStock ? (
                <div className="flex min-h-0 flex-col">
                  <div className="text-center">
                    {seedsPackLabel ? (
                      <p className="mb-0.5 font-sans text-[10px] leading-tight text-zinc-500 sm:text-xs">
                        {seedsPackLabel}
                      </p>
                    ) : null}
                    {showStrike && (
                      <p className="text-xs tabular-nums text-zinc-400 line-through">
                        {formatPrice(listRegular)}
                      </p>
                    )}
                    <p className="text-[15px] font-bold tabular-nums text-zinc-500">
                      {listFrom > 0 ? formatPrice(listFrom) : t("สอบถาม", "Inquire")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    disabled
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label={t("สินค้าหมดชั่วคราว", "Sold Out")}
                    className="relative z-20 mt-1.5 h-10 w-full shrink-0 border border-zinc-300 bg-zinc-200 p-0 font-sans text-sm font-semibold text-zinc-600 shadow-none hover:bg-zinc-200"
                  >
                    {t("สินค้าหมดชั่วคราว", "Sold Out")}
                  </Button>
                </div>
              ) : (
                <div className="flex min-h-0 items-end justify-between gap-2">
                  <div className="min-w-0">
                    {seedsPackLabel ? (
                      <p className="mb-0.5 font-sans text-[10px] leading-tight text-emerald-600/80 sm:text-xs">
                        {seedsPackLabel}
                      </p>
                    ) : null}
                    {showStrike && (
                      <p className="text-xs tabular-nums text-zinc-400 line-through">
                        {formatPrice(listRegular)}
                      </p>
                    )}
                    <p className="text-[15px] font-bold tabular-nums text-zinc-900">
                      {listFrom > 0 ? formatPrice(listFrom) : t("สอบถาม", "Inquire")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    disabled={!defaultVariant}
                    onClick={handleAdd}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                    aria-label={t("เพิ่มลงตะกร้า", "Add to cart")}
                    className="relative z-20 h-10 w-10 shrink-0 rounded-full border-0 bg-primary p-0 text-lg font-bold leading-none text-primary-foreground shadow-sm transition-transform hover:scale-110 hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                  >
                    +
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
