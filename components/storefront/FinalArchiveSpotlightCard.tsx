"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CatalogImagePlaceholder } from "@/components/storefront/CatalogImagePlaceholder";
import { MicroGeneticsBar } from "@/components/storefront/MicroGeneticsBar";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { productDetailHref } from "@/lib/product-utils";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import type { Product } from "@/types/supabase";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

const serif = "font-[family-name:var(--font-journal-product-serif)]";
const mono = "font-[family-name:var(--font-journal-product-mono)]";

export function FinalArchiveSpotlightCard({
  product,
  variants,
}: {
  product: ProductWithBreederAndVariants;
  variants?: import("framer-motion").Variants;
}) {
  const { t } = useLanguage();
  const img = getListingThumbnailUrl(product);
  const units = Math.max(0, Math.floor(product.stock ?? 0));

  return (
    <motion.div
      variants={variants}
      className={cn("col-span-2 w-full min-w-0", JOURNAL_PRODUCT_FONT_VARS)}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-sm border border-amber-500/25 bg-white shadow-sm",
          "ring-1 ring-amber-500/15"
        )}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
          initial={{ top: "0%" }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "linear" }}
        />
        <div className="pointer-events-none absolute inset-0 z-[1] animate-pulse bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent opacity-60" />

        <Link
          href={productDetailHref(product)}
          className="group relative z-[2] flex min-h-[200px] flex-col sm:min-h-[220px] sm:flex-row"
        >
          <div className="relative aspect-[4/3] w-full shrink-0 sm:aspect-auto sm:h-auto sm:w-[40%] sm:max-w-sm">
            {img ? (
              <Image
                src={img}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, 38vw"
              />
            ) : (
              <CatalogImagePlaceholder seed={product.id} className="absolute inset-0" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center border-t border-amber-500/10 p-5 sm:border-l sm:border-t-0 sm:p-6">
            <h3
              className={cn(
                serif,
                "text-xl font-semibold leading-snug tracking-tight text-zinc-900 sm:text-2xl"
              )}
            >
              {t("สินค้าเหลือชิ้นสุดท้าย", "Last items in stock")}
            </h3>
            <p className={cn(mono, "mt-1 text-xs font-medium tabular-nums text-zinc-500")}>
              {product.name}
            </p>
            <p
              className={cn(
                mono,
                "mt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-amber-700/95 sm:text-[11px]"
              )}
            >
              STATUS: LOW_STOCK_ALERT // {units} UNITS LEFT
            </p>
            <div className="mt-4 w-full min-w-0 max-w-md">
              <MicroGeneticsBar product={product as Product} />
            </div>
            <span
              className={cn(
                mono,
                "mt-5 inline-flex w-fit items-center rounded-sm border border-primary/35 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary transition-colors group-hover:bg-primary/5"
              )}
            >
              {t("สั่งซื้อก่อนหมด", "ORDER BEFORE SOLD OUT")}
            </span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
