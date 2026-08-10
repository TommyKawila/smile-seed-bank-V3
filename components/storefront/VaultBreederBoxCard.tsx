"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Leaf } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { seedsBreederHref } from "@/lib/breeder-slug";
import type { SeedsHubBreederBox } from "@/lib/seeds-hub";
import { VAULT_ACCENT } from "@/lib/storefront-category-accents";
import {
  BREEDER_BOX_BANNER_IMAGE_CLASS,
  BREEDER_BOX_LOGO_IMAGE_CLASS,
  breederBoxUsesBannerCover,
} from "@/lib/storefront-breeder-box-image";
import { cn } from "@/lib/utils";

export function VaultBreederBoxCard({
  box,
  featured = false,
  style,
}: {
  box: SeedsHubBreederBox;
  featured?: boolean;
  style?: CSSProperties;
}) {
  const { t } = useLanguage();
  const href = seedsBreederHref(box);
  const img = box.logoUrl;
  const usesBannerCover = breederBoxUsesBannerCover(box.logoUrl, box.logoUrl);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-zinc-950 transition duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700",
        VAULT_ACCENT.boxBorder,
        featured && "md:col-span-2 md:row-span-2"
      )}
      style={style}
    >
      <Link
        href={href}
        className={cn(
          "relative block min-h-[48px] overflow-hidden bg-zinc-950 focus-visible:outline-none focus-visible:ring-2",
          VAULT_ACCENT.boxFocusRing,
          featured ? "aspect-[4/3] md:aspect-auto md:min-h-[22rem]" : "aspect-[4/3]"
        )}
        aria-label={`${box.name} — ${t("คลังพันธุกรรม", "Genetic Vault")}`}
      >
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 640px) 50vw, 33vw"}
            className={usesBannerCover ? BREEDER_BOX_BANNER_IMAGE_CLASS : BREEDER_BOX_LOGO_IMAGE_CLASS}
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={shouldOffloadImageOptimization(img)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-950 to-zinc-950">
            <Leaf className="h-10 w-10 text-emerald-400/70" />
          </div>
        )}
        <div aria-hidden className={VAULT_ACCENT.boxRadial} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <p
            className={cn(
              "font-semibold tracking-tight text-white",
              featured ? "text-lg sm:text-2xl" : "text-sm sm:text-lg"
            )}
          >
            {box.name}
          </p>
          {box.productCount > 0 ? (
            <p className={cn("mt-0.5 text-[10px] sm:text-xs", VAULT_ACCENT.boxSubtitle)}>
              {t(`${box.productCount} สินค้า`, `${box.productCount} strains`)}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
