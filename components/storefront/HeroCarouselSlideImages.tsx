"use client";

import Image from "next/image";
import { HERO_CAROUSEL_BANNER_SIZES } from "@/components/storefront/hero-carousel-image-sizes";

/** Same ratio as hero mobile column (390×429 artboard). */
const MOBILE_INTRINSIC_W = 780;
const MOBILE_INTRINSIC_H = 858;

export type HeroCarouselSlideImagesProps = {
  mobileSrc: string;
  desktopSrc: string;
  heroAlt: string;
  priority: boolean;
};

/** Plain Images — no Framer Motion (LCP path). Mobile: intrinsic W/H for layout reserve; desktop: fill in bounded viewport. */
export function HeroCarouselSlideImages({
  mobileSrc,
  desktopSrc,
  heroAlt,
  priority,
}: HeroCarouselSlideImagesProps) {
  const isPriority = priority;
  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden">
      <div className="absolute inset-0 md:hidden">
        <div className="relative aspect-[4/5] h-full w-full min-h-0">
          <Image
            src={mobileSrc}
            alt={heroAlt}
            width={MOBILE_INTRINSIC_W}
            height={MOBILE_INTRINSIC_H}
            priority={isPriority}
            fetchPriority={isPriority ? "high" : "auto"}
            loading={isPriority ? "eager" : "lazy"}
            decoding={isPriority ? "sync" : "async"}
            quality={60}
            sizes={HERO_CAROUSEL_BANNER_SIZES}
            className="h-full w-full object-contain object-center duration-500 fill-mode-both"
          />
        </div>
      </div>
      <div className="absolute inset-0 hidden min-h-0 md:block">
        <Image
          src={desktopSrc}
          alt={heroAlt}
          fill
          priority={isPriority}
          fetchPriority={isPriority ? "high" : "auto"}
          loading={isPriority ? "eager" : "lazy"}
          decoding={isPriority ? "sync" : "async"}
          quality={65}
          className="object-cover object-center"
          sizes={HERO_CAROUSEL_BANNER_SIZES}
        />
      </div>
    </div>
  );
}
