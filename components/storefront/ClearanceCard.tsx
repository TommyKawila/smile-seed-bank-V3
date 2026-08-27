"use client";

import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import {
  getClearancePercentOff,
  getEffectiveListingPrice,
  getPackSizeLabelFromUnitLabel,
  getStartingVariant,
  listClearancePackSummaries,
  productDetailHref,
} from "@/lib/product-utils";
import { isProductAggregateOutOfStock } from "@/lib/product-stock";
import { formatPrice } from "@/lib/utils";
import { touchCatalogReturnFromWindow } from "@/lib/catalog-return-path";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { ProductAvailabilityNote } from "@/components/storefront/ProductAvailabilityNote";
import {
  CatalogProductCardBody,
  CatalogProductCardBreederLogo,
  CatalogProductCardImageArea,
  CatalogProductCardShell,
} from "@/components/storefront/CatalogProductCardShell";
import {
  CLEARANCE_ACCENT,
  clearanceDiscountBadgeClass,
} from "@/lib/storefront-category-accents";
import { cn } from "@/lib/utils";

export function ClearanceCard({ product }: { product: ProductWithBreederAndVariants }) {
  const { t, locale } = useLanguage();
  const href = productDetailHref(product);
  const img = getListingThumbnailUrl(product);
  const pct = getClearancePercentOff(product);
  const clearancePacks = listClearancePackSummaries(product);
  const activePackCount = (product.product_variants ?? []).filter(
    (v) => v.is_active !== false && (v.stock ?? 0) > 0
  ).length;
  const partialClearance =
    clearancePacks.length > 0 && clearancePacks.length < activePackCount;

  const bestPack =
    clearancePacks.length > 0
      ? clearancePacks.reduce((a, b) =>
          a.clearancePrice <= b.clearancePrice ? a : b
        )
      : null;
  const listPrice = bestPack?.listPrice ?? 0;
  const sale =
    bestPack?.clearancePrice ?? getEffectiveListingPrice(product);
  const bestLabel = bestPack
    ? getPackSizeLabelFromUnitLabel(bestPack.unitLabel, locale) ??
      bestPack.unitLabel
    : null;

  const outOfStock = isProductAggregateOutOfStock(product);
  const inStockVariants =
    product.product_variants?.filter(
      (v) => v.is_active !== false && (v.stock ?? 0) > 0
    ) ?? [];
  const displayVariant = getStartingVariant(inStockVariants);

  const imageOverlay = (
    <>
      {pct != null && pct > 0 && (
        <span
          className={cn(
            "absolute left-2 top-2 z-20 rounded-md px-2 py-1 text-[11px] font-bold tabular-nums shadow-md",
            clearanceDiscountBadgeClass(pct)
          )}
        >
          −{pct}%
        </span>
      )}
      {product.breeders ? (
        <CatalogProductCardBreederLogo
          breeder={product.breeders}
          accent="clearance"
          className={pct ? "top-10" : undefined}
        />
      ) : null}
    </>
  );

  return (
    <CatalogProductCardShell accent="clearance">
      <CatalogProductCardImageArea
        href={href}
        onNavigate={touchCatalogReturnFromWindow}
        outOfStock={outOfStock}
        soldOutLabel={t("สินค้าหมด / SOLD OUT", "Sold out / SOLD OUT")}
        imageOverlay={imageOverlay}
      >
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 85vw, 280px"
            className={`object-cover transition duration-500 hover:scale-[1.02] ${outOfStock ? "brightness-75 grayscale" : ""}`}
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={shouldOffloadImageOptimization(img)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-900">
            <Leaf className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </CatalogProductCardImageArea>

      <CatalogProductCardBody>
        <Link
          href={href}
          onClick={touchCatalogReturnFromWindow}
          className={cn(
            "line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-zinc-100",
            CLEARANCE_ACCENT.cardTitleHover
          )}
        >
          {product.name}
        </Link>

        {clearancePacks.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {clearancePacks.map((pack) => {
              const label =
                getPackSizeLabelFromUnitLabel(pack.unitLabel, locale) ??
                pack.unitLabel;
              return (
                <span
                  key={`${pack.variantId ?? pack.unitLabel}-${pack.percentOff}`}
                  className={cn(
                    "inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-tight",
                    CLEARANCE_ACCENT.packChip
                  )}
                >
                  <span className="truncate">{label}</span>
                  <span className="ml-1 shrink-0 tabular-nums">−{pack.percentOff}%</span>
                </span>
              );
            })}
          </div>
        ) : null}

        <div className="mt-auto space-y-1.5 border-t border-zinc-800 pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {listPrice > sale && sale > 0 ? (
              <span className="text-xs tabular-nums text-zinc-500 line-through">
                {formatPrice(listPrice)}
              </span>
            ) : null}
            <span
              className={cn(
                "text-base font-bold tabular-nums",
                outOfStock ? "text-muted-foreground" : CLEARANCE_ACCENT.cardPrice
              )}
            >
              {formatPrice(sale)}
            </span>
          </div>
          {partialClearance && bestLabel ? (
            <p className="text-[10px] font-medium text-zinc-400">
              {t(`จาก ${bestLabel}`, `From ${bestLabel}`)}
            </p>
          ) : null}
          {!outOfStock && displayVariant ? (
            <ProductAvailabilityNote
              stock={displayVariant.stock}
              locale={locale}
              accent="clearance"
            />
          ) : null}
        </div>
      </CatalogProductCardBody>
    </CatalogProductCardShell>
  );
}
