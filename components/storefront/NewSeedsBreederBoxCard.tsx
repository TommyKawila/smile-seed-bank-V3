"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import type { StorefrontNewSeedsBreederBox } from "@/lib/new-seeds";
import { cn } from "@/lib/utils";

export function NewSeedsBreederBoxCard({
  box,
  featured = false,
  style,
}: {
  box: StorefrontNewSeedsBreederBox;
  featured?: boolean;
  style?: CSSProperties;
}) {
  const { t, locale } = useLanguage();
  const title =
    locale === "en" && box.titleEn?.trim()
      ? box.titleEn.trim()
      : box.titleTh || box.name;
  const href = `/new?breeder=${encodeURIComponent(box.slug)}`;
  const img = box.imageUrl || box.logoUrl;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-violet-500/25 bg-white shadow-[0_0_40px_-12px_rgba(139,92,246,0.45)] transition duration-500 hover:border-cyan-400/40 hover:shadow-[0_0_48px_-8px_rgba(34,211,238,0.35)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700",
        featured && "md:col-span-2 md:row-span-2"
      )}
      style={style}
    >
      <Link
        href={href}
        className={cn(
          "relative block min-h-[48px] overflow-hidden bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
          featured ? "aspect-[4/3] md:aspect-auto md:min-h-[22rem]" : "aspect-[4/3]"
        )}
        aria-label={`${title} — ${t("สินค้าใหม่", "New Seeds")}`}
      >
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 640px) 50vw, 33vw"}
            className="object-contain p-3 transition duration-700 group-hover:scale-[1.05] sm:p-6 lg:p-8"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={shouldOffloadImageOptimization(img)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-white">
            <Sparkles className="h-10 w-10 text-violet-500/70" />
          </div>
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-500 to-cyan-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-950 shadow-md sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
          <Sparkles className="h-3 w-3" aria-hidden />
          {t("ใหม่", "NEW")}
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-zinc-900/90 p-3 sm:p-4">
          <p
            className={cn(
              "font-semibold tracking-tight text-white",
              featured ? "text-lg sm:text-2xl" : "text-sm sm:text-lg"
            )}
          >
            {title}
          </p>
          <p className="mt-0.5 text-[10px] text-violet-200/90 sm:text-xs">
            {t(`${box.productCount} สายพันธุ์ใหม่`, `${box.productCount} new strains`)}
          </p>
        </div>
      </Link>
    </article>
  );
}
