"use client";

import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import {
  computeStartingPrice,
  computeTotalStock,
  getClearancePercentOff,
  getEffectiveListingPrice,
  productDetailHref,
} from "@/lib/product-utils";
import { formatPrice } from "@/lib/utils";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";

export function ClearanceCard({ product }: { product: ProductWithBreederAndVariants }) {
  const { t } = useLanguage();
  const href = productDetailHref(product);
  const img = getListingThumbnailUrl(product);
  const pct = getClearancePercentOff(product);
  const regular = computeStartingPrice(product.product_variants);
  const sale = getEffectiveListingPrice(product);
  const totalStock = computeTotalStock(product.product_variants ?? []);

  return (
    <article
      className={`flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-lg ${JOURNAL_PRODUCT_FONT_VARS}`}
    >
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-zinc-900">
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 85vw, 280px"
            className="object-cover transition duration-500 hover:scale-[1.03]"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={shouldOffloadImageOptimization(img)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-900">
            <Leaf className="h-10 w-10 text-zinc-600" />
          </div>
        )}
        {pct != null && pct > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-bold tabular-nums text-white shadow-md">
            −{pct}%
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={href}
          className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-zinc-100 hover:text-emerald-400"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-zinc-800 pt-2">
          {regular > sale && (
            <span className="text-xs tabular-nums text-zinc-500 line-through">{formatPrice(regular)}</span>
          )}
          <span className="text-base font-bold tabular-nums text-emerald-400">{formatPrice(sale)}</span>
        </div>
        {totalStock > 0 && totalStock < 10 && (
          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-400/90">
            {t("สต็อกจำกัด", "Limited stock")}
          </p>
        )}
      </div>
    </article>
  );
}
