"use client";

import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import {
  computeTotalStock,
  getClearancePercentOff,
  getEffectiveListingPrice,
  getPackSizeLabelFromUnitLabel,
  listClearancePackSummaries,
  productDetailHref,
} from "@/lib/product-utils";
import { isProductAggregateOutOfStock } from "@/lib/product-stock";
import { formatPrice } from "@/lib/utils";
import { touchCatalogReturnFromWindow } from "@/lib/catalog-return-path";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";

export function ClearanceCard({ product }: { product: ProductWithBreederAndVariants }) {
  const { t, locale } = useLanguage();
  const href = productDetailHref(product);
  const img = getListingThumbnailUrl(product);
  const pct = getClearancePercentOff(product);
  const clearancePacks = listClearancePackSummaries(product);
  const activePackCount = (product.product_variants ?? []).filter(
    (v) => v.is_active !== false
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

  const totalStock = computeTotalStock(product.product_variants ?? []);
  const outOfStock = isProductAggregateOutOfStock(product);

  return (
    <article
      className={`flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-lg ${JOURNAL_PRODUCT_FONT_VARS}`}
    >
      <Link
        href={href}
        onClick={() => touchCatalogReturnFromWindow()}
        className="relative block aspect-[4/3] overflow-hidden bg-zinc-900"
      >
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 85vw, 280px"
            className={`object-cover transition duration-500 hover:scale-[1.03] ${outOfStock ? "brightness-75 grayscale" : ""}`}
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={shouldOffloadImageOptimization(img)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-900">
            <Leaf className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        {pct != null && pct > 0 && (
          <span className="absolute left-2 top-2 z-20 rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-bold tabular-nums text-white shadow-md">
            −{pct}%
          </span>
        )}
        {outOfStock && (
          <div
            className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center bg-zinc-950/35 p-3"
            aria-hidden
          >
            <div className="w-full max-w-[min(92%,15rem)] rounded-lg border border-zinc-700 bg-zinc-950/95 px-3 py-2.5 text-center shadow-lg">
              <p className="font-sans text-[11px] font-bold leading-tight text-zinc-100 sm:text-xs">
                {t("สินค้าหมด / SOLD OUT", "Sold out / SOLD OUT")}
              </p>
            </div>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={href}
          onClick={() => touchCatalogReturnFromWindow()}
          className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-zinc-100 hover:text-emerald-400"
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
                  className="inline-flex max-w-full items-center rounded-md border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-amber-300"
                >
                  <span className="truncate">{label}</span>
                  <span className="ml-1 shrink-0 tabular-nums">−{pack.percentOff}%</span>
                </span>
              );
            })}
          </div>
        ) : null}
        <div className="mt-auto space-y-1 border-t border-zinc-800 pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {listPrice > sale && sale > 0 ? (
              <span className="text-xs tabular-nums text-muted-foreground line-through">
                {formatPrice(listPrice)}
              </span>
            ) : null}
            <span
              className={`text-base font-bold tabular-nums ${outOfStock ? "text-muted-foreground" : "text-emerald-400"}`}
            >
              {formatPrice(sale)}
            </span>
          </div>
          {partialClearance && bestLabel ? (
            <p className="text-[10px] font-medium text-zinc-400">
              {t(`จาก ${bestLabel}`, `From ${bestLabel}`)}
            </p>
          ) : null}
        </div>
        {!outOfStock && totalStock > 0 && totalStock < 10 && (
          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-400/90">
            {t("สต็อกจำกัด", "Limited stock")}
          </p>
        )}
      </div>
    </article>
  );
}
