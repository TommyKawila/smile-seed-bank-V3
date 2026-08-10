"use client";

import Image from "next/image";
import Link from "next/link";
import { Leaf, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { getGeneticPercents } from "@/lib/genetic-percents";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { getProductAggregateStock, isProductAggregateOutOfStock } from "@/lib/product-stock";
import {
  getEffectiveListingPrice,
  getEffectiveVariantPrice,
  getPackSizeLabelFromUnitLabel,
  getStartingVariant,
  getStartingVariantLabel,
  productDetailHref,
} from "@/lib/product-utils";
import { seedsBreederHref } from "@/lib/breeder-slug";
import { formatPrice } from "@/lib/utils";
import { touchCatalogReturnFromWindow } from "@/lib/catalog-return-path";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";

function cardStrainTypeLabel(product: ProductWithBreederAndVariants): string | null {
  const sd = (product.strain_dominance ?? "").trim();
  if (sd) {
    const lower = sd.toLowerCase();
    if (lower.includes("hybrid") || lower.includes("50/50")) return "Hybrid";
    if (lower.includes("mostly sativa") || /^sativa/i.test(sd)) return "Sativa";
    if (lower.includes("mostly indica") || /^indica/i.test(sd)) return "Indica";
  }
  const g = getGeneticPercents(product);
  if (g) {
    if (g.sativa >= 58) return "Sativa";
    if (g.indica >= 58) return "Indica";
    return "Hybrid";
  }
  return null;
}

export function NewSeedsProductCard({
  product,
}: {
  product: ProductWithBreederAndVariants;
}) {
  const { t, locale } = useLanguage();
  const href = productDetailHref(product);
  const img = getListingThumbnailUrl(product);
  const aggregateStock = getProductAggregateStock(product);
  const outOfStock = isProductAggregateOutOfStock(product);
  const limitedRelease = !outOfStock && aggregateStock > 0 && aggregateStock <= 5;

  const inStockVariants =
    product.product_variants?.filter(
      (v) => v.is_active !== false && (v.stock ?? 0) > 0
    ) ?? [];
  const displayVariant = getStartingVariant(inStockVariants);
  const listRegular = Number(displayVariant?.price ?? 0);
  const sale = displayVariant
    ? getEffectiveVariantPrice(product, listRegular)
    : getEffectiveListingPrice(product);
  const packLabel = displayVariant
    ? getPackSizeLabelFromUnitLabel(displayVariant.unit_label, locale)
    : getStartingVariantLabel(product.product_variants, locale);

  const thcPill =
    product.thc_percent != null && Number.isFinite(Number(product.thc_percent))
      ? `${Math.round(Number(product.thc_percent))}%`
      : null;
  const typePill = cardStrainTypeLabel(product);

  return (
    <article
      className={`flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-violet-500/20 bg-zinc-950 shadow-lg transition duration-300 hover:border-violet-400/35 ${JOURNAL_PRODUCT_FONT_VARS}`}
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

        <span className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-500 to-cyan-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-950 shadow-md">
          <Sparkles className="h-3 w-3" aria-hidden />
          {t("ใหม่", "NEW")}
        </span>

        {product.breeders ? (
          <span className="absolute left-2 top-2 z-20 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-violet-500/30 bg-white shadow-md ring-1 ring-violet-500/15">
            <BreederLogoImage
              src={product.breeders.logo_url}
              breederName={product.breeders.name}
              width={32}
              height={32}
              className="rounded-full"
              imgClassName="object-cover"
              sizes="32px"
            />
          </span>
        ) : null}

        {outOfStock ? (
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
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {(thcPill || typePill) && (
          <p className="text-[10px] font-medium tabular-nums text-zinc-400">
            {thcPill ? <span className="text-violet-300/90">THC {thcPill}</span> : null}
            {thcPill && typePill ? <span className="text-zinc-600"> · </span> : null}
            {typePill ? <span>{typePill}</span> : null}
          </p>
        )}

        {product.breeders ? (
          <Link
            href={seedsBreederHref(product.breeders)}
            onClick={() => touchCatalogReturnFromWindow()}
            className="line-clamp-1 text-[11px] font-medium text-zinc-500 transition-colors hover:text-violet-300"
          >
            {product.breeders.name}
          </Link>
        ) : null}

        <Link
          href={href}
          onClick={() => touchCatalogReturnFromWindow()}
          className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-zinc-100 hover:text-violet-300"
        >
          {product.name}
        </Link>

        {packLabel ? (
          <p className="text-[10px] font-medium text-cyan-400/80">{packLabel}</p>
        ) : null}

        <div className="mt-auto space-y-1 border-t border-zinc-800 pt-2">
          <span
            className={`text-base font-bold tabular-nums ${outOfStock ? "text-muted-foreground" : "text-violet-200"}`}
          >
            {sale > 0 ? formatPrice(sale) : t("สอบถาม", "Inquire")}
          </span>
        </div>

        {limitedRelease ? (
          <p className="text-[10px] font-medium uppercase tracking-wide text-violet-300/80">
            {t("จำนวนจำกัด", "Limited release")}
          </p>
        ) : null}
      </div>
    </article>
  );
}
