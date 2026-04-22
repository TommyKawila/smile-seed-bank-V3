"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CatalogImagePlaceholder } from "@/components/storefront/CatalogImagePlaceholder";
import { MicroGeneticsBar } from "@/components/storefront/MicroGeneticsBar";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import {
  productDetailHref,
  computeStartingPrice,
  getClearancePercentOff,
  getEffectiveListingPrice,
  getStartingVariantLabel,
} from "@/lib/product-utils";
import { formatPrice } from "@/lib/utils";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import type { Product } from "@/types/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

export function FinalArchiveSpotlightCard({
  product,
  variants,
}: {
  product: ProductWithBreederAndVariants;
  variants?: import("framer-motion").Variants;
}) {
  const { t, locale } = useLanguage();
  const img = getListingThumbnailUrl(product);
  const units = Math.max(0, Math.floor(product.stock ?? 0));
  const listFrom = getEffectiveListingPrice(product);
  const listRegular = computeStartingPrice(product.product_variants);
  const clearancePct = getClearancePercentOff(product);
  const showStrike = clearancePct != null && listRegular > listFrom;
  const seedsPackLabel = getStartingVariantLabel(product.product_variants, locale);
  const barPct = Math.min(100, Math.max(8, (units / 24) * 100));

  return (
    <motion.div
      variants={variants}
      className="col-span-2 flex h-full min-h-0 w-full min-w-0 flex-col font-sans"
    >
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm ring-1 ring-zinc-100">
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-transparent" />

        <Link
          href={productDetailHref(product)}
          className="group relative z-[2] flex min-h-[200px] flex-col font-sans sm:min-h-[220px] sm:flex-row"
        >
          <div className="relative aspect-[4/3] w-full shrink-0 sm:aspect-auto sm:h-auto sm:w-[40%] sm:max-w-sm">
            {img ? (
              <Image
                src={img}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, 38vw"
                unoptimized={shouldOffloadImageOptimization(img)}
              />
            ) : (
              <CatalogImagePlaceholder seed={product.id} className="absolute inset-0" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center border-t border-zinc-100 p-5 sm:border-l sm:border-t-0 sm:p-6">
            <h3 className="font-sans text-xl font-bold leading-snug tracking-tight text-zinc-900 sm:text-2xl">
              {t("สินค้าเหลือชิ้นสุดท้าย", "Last items in stock")}
            </h3>
            <p className="mt-1 font-sans text-sm font-medium text-zinc-800">{product.name}</p>
            <p className="mt-3 font-sans text-xs font-semibold leading-snug text-emerald-800">
              {t("รีบเลย! เหลือเพียง {n} ชิ้นสุดท้าย", "Hurry! Only {n} left").replace(
                /\{n\}/g,
                String(units)
              )}
            </p>
            <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500"
                style={{ width: `${barPct}%` }}
              />
            </div>
            <div className="mt-4 w-full min-w-0 max-w-md">
              <MicroGeneticsBar product={product as Product} />
            </div>
            <div className="mt-4 min-w-0 max-w-md border-t border-zinc-100 pt-3">
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
            <span className="mt-5 inline-flex w-fit items-center rounded-full border border-emerald-700 bg-emerald-700 px-4 py-2 font-sans text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-emerald-800">
              {t("สั่งซื้อก่อนหมด", "Order before sold out")}
            </span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
