"use client";

import Image from "next/image";
import {
  HERO_CAROUSEL_DESKTOP_SIZES,
  HERO_CAROUSEL_MOBILE_SIZES,
  HERO_IMAGE_QUALITY_DESKTOP,
  HERO_IMAGE_QUALITY_DESKTOP_LCP,
  HERO_IMAGE_QUALITY_MOBILE,
  HERO_IMAGE_QUALITY_MOBILE_LCP,
  HERO_MOBILE_ASPECT_H,
  HERO_MOBILE_ASPECT_W,
} from "@/components/storefront/hero-carousel-image-sizes";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

export type HeroCarouselSlideImagesProps = {
  mobileSrc: string;
  desktopSrc: string;
  heroAlt: string;
  priority: boolean;
};

/** Plain `next/image` — LCP path; explicit W/H + `sizes` for `/_next/image` srcset selection. */
export function HeroCarouselSlideImages({
  mobileSrc,
  desktopSrc,
  heroAlt,
  priority,
}: HeroCarouselSlideImagesProps) {
  const alt = heroAlt.trim() || "Smile Seed Bank Campaign";
  const isPriority = priority;

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden">
      <div className="absolute inset-0 md:hidden">
        <div className="relative aspect-[4/5] h-full w-full min-h-0">
          <Image
            src={mobileSrc}
            alt={alt}
            width={HERO_MOBILE_ASPECT_W}
            height={HERO_MOBILE_ASPECT_H}
            priority={isPriority}
            fetchPriority={isPriority ? "high" : "auto"}
            loading={isPriority ? "eager" : "lazy"}
            decoding="async"
            quality={isPriority ? HERO_IMAGE_QUALITY_MOBILE_LCP : HERO_IMAGE_QUALITY_MOBILE}
            sizes={HERO_CAROUSEL_MOBILE_SIZES}
            unoptimized={shouldOffloadImageOptimization(mobileSrc)}
            className="h-full w-full object-contain object-center"
          />
        </div>
      </div>
      <div className="absolute inset-0 hidden min-h-0 md:block">
        <Image
          src={desktopSrc}
          alt={alt}
          fill
          priority={isPriority}
          fetchPriority={isPriority ? "high" : "auto"}
          loading={isPriority ? "eager" : "lazy"}
          decoding="async"
          quality={isPriority ? HERO_IMAGE_QUALITY_DESKTOP_LCP : HERO_IMAGE_QUALITY_DESKTOP}
          sizes={HERO_CAROUSEL_DESKTOP_SIZES}
          unoptimized={shouldOffloadImageOptimization(desktopSrc)}
          className="object-cover object-center"
        />
      </div>
    </div>
  );
}
