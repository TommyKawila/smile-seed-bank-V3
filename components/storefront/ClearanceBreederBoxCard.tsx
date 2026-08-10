"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Percent } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import type { StorefrontClearanceBreederBox } from "@/lib/clearance";
import {
  CLEARANCE_ACCENT,
  clearanceDiscountBadgeClass,
} from "@/lib/storefront-category-accents";
import { cn } from "@/lib/utils";

export function ClearanceBreederBoxCard({
  box,
  featured = false,
  style,
}: {
  box: StorefrontClearanceBreederBox;
  featured?: boolean;
  style?: CSSProperties;
}) {
  const { t, locale } = useLanguage();
  const title =
    locale === "en" && box.titleEn?.trim()
      ? box.titleEn.trim()
      : box.titleTh || box.name;
  const href = `/clearance?breeder=${encodeURIComponent(box.slug)}&pct=${box.discountPercent}`;
  const img = box.imageUrl || box.logoUrl;
  const pctLabel = `−${box.discountPercent}%`;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-zinc-950 transition duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700",
        CLEARANCE_ACCENT.boxBorder,
        featured && "md:col-span-2 md:row-span-2"
      )}
      style={style}
    >
      <Link
        href={href}
        className={cn(
          "relative block min-h-[48px] overflow-hidden bg-zinc-950 focus-visible:outline-none focus-visible:ring-2",
          CLEARANCE_ACCENT.boxFocusRing,
          featured ? "aspect-[4/3] md:aspect-auto md:min-h-[22rem]" : "aspect-[4/3]"
        )}
        aria-label={`${title} — Clearance ${pctLabel}`}
      >
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 640px) 50vw, 33vw"}
            className="object-cover transition duration-700 group-hover:scale-[1.05]"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={shouldOffloadImageOptimization(img)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-950 to-zinc-950">
            <Percent className="h-10 w-10 text-orange-400/70" />
          </div>
        )}
        <div aria-hidden className={CLEARANCE_ACCENT.boxRadial} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/25 to-transparent" />
        <span
          className={cn(
            "absolute left-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-md sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]",
            clearanceDiscountBadgeClass(box.discountPercent)
          )}
        >
          <Percent className="h-3 w-3" aria-hidden />
          {pctLabel}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <p
            className={cn(
              "font-semibold tracking-tight text-white",
              featured ? "text-lg sm:text-2xl" : "text-sm sm:text-lg"
            )}
          >
            {title}
          </p>
          <p className={cn("mt-0.5 text-[10px] sm:text-xs", CLEARANCE_ACCENT.boxSubtitle)}>
            {t(`${box.productCount} สินค้า`, `${box.productCount} strains`)}
          </p>
        </div>
      </Link>
    </article>
  );
}
