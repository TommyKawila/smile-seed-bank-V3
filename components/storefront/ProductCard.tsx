"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import type {
  ProductImageRow,
  ProductVariantRow,
  ProductWithBreeder,
} from "@/lib/supabase/types";
import { cn, formatPrice } from "@/lib/utils";
import { resolveListingUnitAfterBrand } from "@/lib/brand-promotion-checkout";
import {
  computeStartingPrice,
  getClearancePercentOff,
  getEffectiveListingPrice,
  getEffectiveVariantPrice,
  getPackSizeLabelFromUnitLabel,
  getStartingVariant,
  getStartingVariantLabel,
  productDetailHref,
} from "@/lib/product-utils";
import { seedsBreederHref } from "@/lib/breeder-slug";
import { touchCatalogReturnFromWindow } from "@/lib/catalog-return-path";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { CatalogImagePlaceholder } from "@/components/storefront/CatalogImagePlaceholder";
import { requestCartFlyAnimation } from "@/components/storefront/CartAnimation";
import { ProductAvailabilityNote } from "@/components/storefront/ProductAvailabilityNote";
import {
  CatalogProductCardBody,
  CatalogProductCardBreederLogo,
  CatalogProductCardImageArea,
  CatalogProductCardShell,
  type ProductStatusAccent,
} from "@/components/storefront/CatalogProductCardShell";
import {
  clearanceDiscountBadgeClass,
  NEW_SEEDS_ACCENT,
  productAccentTokens,
  resolveProductAccent,
} from "@/lib/storefront-category-accents";
import {
  cardStrainTypeLabel,
  isNewArrivalProduct,
} from "@/lib/product-card-present";
import { toast } from "sonner";
import { pickVariantForSeedPackSlugs, parseListParam } from "@/lib/shop-attribute-filters";
import { roundCheckoutBahtWhole } from "@/lib/money-thb";
import { resolveStorefrontCartStoredUnitBaht } from "@/lib/storefront-cart-unit";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { getProductAggregateStock } from "@/lib/product-stock";

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
    discount_percent?: number;
    discount_ends_at?: string | null;
    stock: number | null;
    is_active: boolean | null;
    unit_label: string;
  }[] | null;
}) {
  const inStock =
    product.product_variants?.filter(
      (v) => v.is_active !== false && (v.stock ?? 0) > 0
    ) ?? [];
  return getStartingVariant(inStock);
}

type ProductListItem = ProductWithBreeder & {
  product_variants?: ProductVariantRow[] | null;
  product_images?: ProductImageRow[] | null;
};

type ProductWithMeta = ProductListItem & { created_at?: string | null };

type ProductCardProps = {
  product: ProductListItem;
  variant?: "shop" | "showcase";
  imagePriority?: boolean;
  disableOuterMotion?: boolean;
  catalogSeedsFilter?: string | null;
  /** PDP link only — no add-to-cart (e.g. /new drill-down). */
  linkOnly?: boolean;
  /** Always show NEW badge (new seeds grid). */
  showNewBadge?: boolean;
  /** Override status-driven accent (e.g. clearance drill-down). */
  accent?: ProductStatusAccent;
};

function ProductCardBase({
  product,
  imagePriority = false,
  catalogSeedsFilter = null,
  linkOnly = false,
  showNewBadge = false,
  accent: accentOverride,
}: ProductCardProps) {
  const { addToCart, openCart, brandPromotionRules } = useCartContext();
  const { t, locale } = useLanguage();
  const loc = locale as "th" | "en";
  const accent = accentOverride ?? resolveProductAccent(product);
  const tokens = productAccentTokens(accent);
  const href = productDetailHref(product);
  const seedsSel = parseListParam(catalogSeedsFilter);
  const displayVariant =
    seedsSel.length > 0
      ? pickVariantForSeedPackSlugs(product.product_variants ?? null, seedsSel) ??
        getDefaultVariant(product)
      : getDefaultVariant(product);
  const aggregateStock = getProductAggregateStock(product);
  const outOfStock = aggregateStock <= 0 || !displayVariant;
  const cardImage = getPrimaryImage(product);
  const pm = product as ProductWithMeta;
  const cardImageAlt = product.name?.trim()
    ? product.name.trim()
    : t("สินค้า", "Product");

  const stopNavBubble = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const localizedAddError = (msg: string) => {
    if (locale === "en" && (msg.startsWith("ขออภัย") || /สต็อก|ชิ้น/.test(msg))) {
      return "Sorry, only a limited number of this item is in stock.";
    }
    return msg;
  };

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    stopNavBubble(e);
    if (displayVariant) {
      const variantListPrice = Number(displayVariant.price ?? 0);
      const unit = resolveStorefrontCartStoredUnitBaht(
        product,
        variantListPrice,
        product.breeders?.name,
        brandPromotionRules
      );
      if (typeof addToCart !== "function") {
        toast.error(locale === "th" ? "ตะกร้าไม่พร้อมใช้งาน" : "Cart is unavailable.");
        return;
      }
      const listRounded = roundCheckoutBahtWhole(variantListPrice);
      const { error } = addToCart({
        variantId: displayVariant.id,
        productId: product.id,
        productName: product.name,
        productImage: cardImage,
        unitLabel: displayVariant.unit_label,
        price: unit,
        ...(listRounded > unit ? { listPrice: listRounded } : {}),
        quantity: 1,
        stock_quantity: displayVariant.stock ?? 0,
        masterSku: (product as { master_sku?: string | null }).master_sku ?? null,
        breeder_id: product.breeder_id ?? null,
        breederLogoUrl: product.breeders?.logo_url ?? null,
        breederName: product.breeders?.name ?? null,
      });
      if (error) {
        toast.error(localizedAddError(error));
        return;
      }
      const announceTh = `เพิ่มสินค้า '${product.name}' เข้าตะกร้าแล้ว`;
      const announceEn = `Added “${product.name}” to your cart`;
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
      if (reduceMotion) {
        toast.success(locale === "th" ? announceTh : announceEn, { duration: 2800 });
        return;
      }
      try {
        if (typeof requestCartFlyAnimation === "function" && e.currentTarget instanceof HTMLElement) {
          requestCartFlyAnimation(e.currentTarget, {
            productName: product.name,
            productImage: cardImage,
            locale: loc,
            announceTh,
            announceEn,
          });
        }
      } catch {
        /* ignore animation failures */
      }
      toast.success(
        locale === "th" ? "เพิ่มลงตะกร้าเรียบร้อยแล้ว" : "Added to your cart",
        { duration: 2200 }
      );
    } else {
      toast.error(
        locale === "th" ? "ไม่พบแพ็กสำหรับสั่งซื้อ" : "No pack available to order"
      );
      if (typeof openCart === "function") openCart();
    }
  };

  const thcPill =
    product.thc_percent != null && Number.isFinite(Number(product.thc_percent))
      ? `${Math.round(Number(product.thc_percent))}%`
      : null;
  const typePill = cardStrainTypeLabel(product);

  type WithBrandListing = {
    brand_listing_base_baht?: number;
    brand_listing_effective_baht?: number;
    brand_promotion_percent?: number | null;
  };
  const pb = product as WithBrandListing;
  const rawListForBrand = (() => {
    const vp = Number(displayVariant?.price ?? 0);
    if (vp > 0) return vp;
    return Number((product as { price?: number | null }).price ?? 0) || 0;
  })();

  const useServerBrandListingSlice =
    seedsSel.length === 0 &&
    pb.brand_listing_base_baht != null &&
    pb.brand_listing_effective_baht != null;

  const brandResolved = useServerBrandListingSlice
    ? {
        baseBaht: pb.brand_listing_base_baht!,
        effectiveBaht: pb.brand_listing_effective_baht!,
        brandDiscountPercent: pb.brand_promotion_percent ?? null,
      }
    : resolveListingUnitAfterBrand(rawListForBrand, product.breeders?.name, brandPromotionRules);

  const hasBrandSale =
    brandResolved.effectiveBaht < brandResolved.baseBaht && brandResolved.baseBaht > 0;

  const listingFallbackPrice = getEffectiveListingPrice(product);
  const listRegular = Number(
    displayVariant?.price ?? computeStartingPrice(product.product_variants)
  );
  const listFrom = displayVariant
    ? getEffectiveVariantPrice(product, listRegular)
    : listingFallbackPrice;
  const clearancePct = getClearancePercentOff(product);

  const priceLabel = (() => {
    if (hasBrandSale) {
      if (brandResolved.effectiveBaht > 0) return formatPrice(brandResolved.effectiveBaht);
      return t("สอบถาม", "Inquire");
    }
    return listFrom > 0 ? formatPrice(listFrom) : t("สอบถาม", "Inquire");
  })();

  const showStrike = hasBrandSale
    ? brandResolved.baseBaht > brandResolved.effectiveBaht
    : listRegular > listFrom;
  const strikeDisplay = hasBrandSale ? brandResolved.baseBaht : listRegular;

  const topLeftSalePct = hasBrandSale
    ? brandResolved.brandDiscountPercent ??
      Math.round((1 - brandResolved.effectiveBaht / brandResolved.baseBaht) * 100)
    : clearancePct;

  const seedsPackLabel = displayVariant
    ? getPackSizeLabelFromUnitLabel(displayVariant.unit_label, locale)
    : getStartingVariantLabel(product.product_variants, locale);

  const showBest = Boolean(product.is_featured);
  const showNew = showNewBadge || isNewArrivalProduct(pm.created_at);
  const breederOffset = topLeftSalePct ? "top-10" : undefined;

  const imageOverlay = (
    <>
      {topLeftSalePct ? (
        <span
          className={cn(
            "absolute left-2 top-2 z-20 rounded-md px-2 py-0.5 text-[10px] font-bold tabular-nums shadow-md",
            hasBrandSale
              ? tokens.brandDiscountBadge
              : accent === "clearance" && clearancePct
                ? clearanceDiscountBadgeClass(topLeftSalePct)
                : tokens.brandDiscountBadge
          )}
        >
          {hasBrandSale
            ? t(`−${topLeftSalePct}%`, `−${topLeftSalePct}%`)
            : `−${topLeftSalePct}%`}
        </span>
      ) : null}
      {showNew ? (
        <span
          className={cn(
            "absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-md",
            NEW_SEEDS_ACCENT.newBadge
          )}
        >
          <Sparkles className="h-3 w-3" aria-hidden />
          {t("ใหม่", "NEW")}
        </span>
      ) : showBest ? (
        <span className="absolute right-2 top-2 z-20 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
          {t("ขายดี", "Best")}
        </span>
      ) : null}
      {product.breeders ? (
        <CatalogProductCardBreederLogo
          breeder={product.breeders}
          accent={accent}
          className={breederOffset}
        />
      ) : null}
    </>
  );

  return (
    <div className="h-full">
      <CatalogProductCardShell accent={accent}>
        <CatalogProductCardImageArea
          href={href}
          onNavigate={touchCatalogReturnFromWindow}
          outOfStock={outOfStock}
          soldOutLabel={t("สินค้าหมด / SOLD OUT", "Sold out / SOLD OUT")}
          imageOverlay={imageOverlay}
        >
          {cardImage ? (
            <Image
              src={cardImage}
              alt={cardImageAlt}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              quality={60}
              className={`object-cover transition duration-500 hover:scale-[1.02] ${outOfStock ? "brightness-75 grayscale" : ""}`}
              priority={imagePriority}
              fetchPriority={imagePriority ? "high" : "low"}
              loading={imagePriority ? "eager" : "lazy"}
              unoptimized={shouldOffloadImageOptimization(cardImage)}
            />
          ) : (
            <CatalogImagePlaceholder
              seed={product.id}
              className={`absolute inset-0 ${outOfStock ? "brightness-75 grayscale" : ""}`}
            />
          )}
        </CatalogProductCardImageArea>

        <CatalogProductCardBody>
          {(thcPill || typePill) && (
            <p className="text-[10px] font-medium tabular-nums text-zinc-400">
              {thcPill ? <span className={tokens.cardThcPill}>THC {thcPill}</span> : null}
              {thcPill && typePill ? <span className="text-zinc-600"> · </span> : null}
              {typePill ? <span>{typePill}</span> : null}
            </p>
          )}

          {product.breeders ? (
            <Link
              href={seedsBreederHref(product.breeders)}
              onClick={() => touchCatalogReturnFromWindow()}
              className={cn(
                "line-clamp-1 text-[11px] font-medium text-zinc-500 transition-colors",
                tokens.cardBreederLink
              )}
            >
              {product.breeders.name}
            </Link>
          ) : null}

          <Link
            href={href}
            onClick={touchCatalogReturnFromWindow}
            className={cn(
              "line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-zinc-100",
              tokens.cardTitleHover
            )}
          >
            {product.name}
          </Link>

          {seedsPackLabel ? (
            <p className={cn("text-[10px] font-medium", tokens.cardPackLabel)}>{seedsPackLabel}</p>
          ) : null}

          <div className="mt-auto space-y-1.5 border-t border-zinc-800 pt-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="min-w-0">
                {showStrike && (
                  <p className="text-xs tabular-nums text-zinc-500 line-through">
                    {formatPrice(strikeDisplay)}
                  </p>
                )}
                <p
                  className={cn(
                    "text-base font-bold tabular-nums",
                    outOfStock ? "text-muted-foreground" : tokens.cardPrice
                  )}
                >
                  {priceLabel}
                </p>
              </div>
              {!linkOnly && !outOfStock ? (
                <Button
                  type="button"
                  size="icon"
                  disabled={!displayVariant}
                  onClick={handleAdd}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label={t("เพิ่มลงตะกร้า", "Add to cart")}
                  className={cn(
                    "relative z-20 h-10 w-10 shrink-0 rounded-full border text-lg font-bold leading-none shadow-sm transition active:scale-95 disabled:pointer-events-none disabled:opacity-40",
                    tokens.addButton
                  )}
                >
                  +
                </Button>
              ) : null}
            </div>
            {!linkOnly && outOfStock ? (
              <p className="text-[11px] font-medium text-zinc-500">
                {t("สินค้าหมดชั่วคราว", "Sold out")}
              </p>
            ) : null}
            {!outOfStock && displayVariant ? (
              <ProductAvailabilityNote stock={displayVariant.stock} locale={locale} accent={accent} />
            ) : null}
          </div>
        </CatalogProductCardBody>
      </CatalogProductCardShell>
    </div>
  );
}

export const ProductCard = memo(ProductCardBase);
