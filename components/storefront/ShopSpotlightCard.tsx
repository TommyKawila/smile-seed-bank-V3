"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MicroGeneticsBar } from "@/components/storefront/MicroGeneticsBar";
import { CatalogImagePlaceholder } from "@/components/storefront/CatalogImagePlaceholder";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import {
  productDetailHref,
  computeStartingPrice,
  getClearancePercentOff,
  getEffectiveListingPrice,
  getStartingVariantLabel,
} from "@/lib/product-utils";
import { formatPrice } from "@/lib/utils";
import { plainTextFromHtml, truncateMetaDescription } from "@/lib/magazine-seo";
import type { ProductVariantRow, ProductWithBreeder } from "@/lib/supabase/types";
import type { FloweringType } from "@/types/supabase";
import { useLanguage } from "@/context/LanguageContext";

function excerpt(product: ProductWithBreeder): string {
  const raw = product.description_th ?? product.description_en ?? "";
  const plain = plainTextFromHtml(String(raw));
  return truncateMetaDescription(plain, 140);
}

function asMicroGeneticsProduct(product: ProductWithBreeder): ProductWithBreeder & { flowering_type: FloweringType | null } {
  const floweringType =
    product.flowering_type === "autoflower" ||
    product.flowering_type === "photoperiod" ||
    product.flowering_type === "photo_ff" ||
    product.flowering_type === "photo_3n"
      ? product.flowering_type
      : null;
  return { ...product, flowering_type: floweringType };
}

export function ShopSpotlightCard({
  product,
  variants,
}: {
  product: ProductWithBreeder;
  variants?: import("framer-motion").Variants;
}) {
  const { t, locale } = useLanguage();
  const img = getListingThumbnailUrl(product);
  const ex = excerpt(product);
  const variantsList = (product as ProductWithBreeder & { product_variants?: ProductVariantRow[] | null })
    .product_variants;
  const listFrom = getEffectiveListingPrice({
    ...product,
    product_variants: variantsList ?? null,
  });
  const listRegular = computeStartingPrice(variantsList);
  const clearancePct = getClearancePercentOff({
    ...product,
    product_variants: variantsList ?? null,
  });
  const showStrike = clearancePct != null && listRegular > listFrom;
  const seedsPackLabel = getStartingVariantLabel(variantsList ?? null, locale);

  return (
    <motion.div
      variants={variants}
      className="col-span-2 flex h-full min-h-0 flex-col font-sans"
    >
      <Link
        href={productDetailHref(product)}
        className="group flex h-full min-h-[200px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white font-sans shadow-sm transition-shadow hover:border-emerald-200/80 hover:shadow-md sm:min-h-[220px] sm:flex-row"
      >
        <div className="relative aspect-[4/3] w-full shrink-0 sm:aspect-auto sm:h-auto sm:w-[42%] sm:max-w-md">
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, 40vw"
              unoptimized={shouldOffloadImageOptimization(img)}
            />
          ) : (
            <CatalogImagePlaceholder seed={product.id} className="absolute inset-0" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-6">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {t("สปอตไลต์", "Spotlight")}
          </p>
          <h3 className="mt-2 font-sans text-xl font-bold leading-snug tracking-tight text-zinc-900 sm:text-2xl">
            {product.name}
          </h3>
          <div className="mt-3 w-full min-w-0">
            <MicroGeneticsBar product={asMicroGeneticsProduct(product)} />
          </div>
          {ex && (
            <p className="mt-4 line-clamp-3 font-sans text-sm font-normal leading-relaxed text-zinc-600">
              {ex}
            </p>
          )}
          <div className="mt-4 min-w-0 border-t border-zinc-100 pt-3">
            {seedsPackLabel ? (
              <p className="mb-0.5 font-sans text-[10px] leading-tight text-emerald-600/80 sm:text-xs">
                {seedsPackLabel}
              </p>
            ) : null}
            {showStrike && (
              <p className="font-sans text-xs tabular-nums text-zinc-400 line-through">
                {formatPrice(listRegular)}
              </p>
            )}
            <p className="font-sans text-[15px] font-bold tabular-nums text-zinc-900">
              {listFrom > 0 ? formatPrice(listFrom) : t("สอบถาม", "Inquire")}
            </p>
          </div>
          <span className="mt-4 inline-flex w-fit items-center rounded-full bg-emerald-700 px-4 py-2 font-sans text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-emerald-800">
            {t("เปิดรายงานสายพันธุ์", "Open strain dossier")} →
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
