"use client";

import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { CLEARANCE_DISCOUNT_PERCENT } from "@/lib/clearance";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import type { StorefrontClearanceBreederBox } from "@/lib/clearance";

export function ClearanceBreederBoxCard({ box }: { box: StorefrontClearanceBreederBox }) {
  const { t, locale } = useLanguage();
  const title =
    locale === "en" && box.titleEn?.trim()
      ? box.titleEn.trim()
      : box.titleTh || box.name;
  const href = `/clearance?breeder=${encodeURIComponent(box.slug)}`;
  const img = box.imageUrl || box.logoUrl;

  return (
    <article className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-lg sm:rounded-2xl">
      <Link
        href={href}
        className="relative block min-h-[48px] overflow-hidden bg-zinc-900 aspect-[4/3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:aspect-[16/10]"
        aria-label={`${title} — −${CLEARANCE_DISCOUNT_PERCENT}%`}
      >
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={shouldOffloadImageOptimization(img)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-900">
            <Leaf className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
        <span className="absolute left-2 top-2 rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white shadow-md sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
          −{CLEARANCE_DISCOUNT_PERCENT}%
        </span>
        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-4">
          <p className="text-sm font-semibold tracking-tight text-white sm:text-lg">{title}</p>
          <p className="mt-0.5 text-[10px] text-zinc-300 sm:text-xs">
            {t(`${box.productCount} สินค้า`, `${box.productCount} strains`)}
          </p>
        </div>
      </Link>
    </article>
  );
}
