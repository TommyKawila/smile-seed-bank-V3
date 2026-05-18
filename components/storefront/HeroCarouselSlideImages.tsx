"use client";

import Image from "next/image";
import {
  HERO_CAROUSEL_DESKTOP_SIZES,
  HERO_CAROUSEL_MOBILE_SIZES,
} from "@/components/storefront/hero-carousel-image-sizes";

export type HeroCarouselSlideImagesProps = {
  mobileSrc: string;
  desktopSrc: string;
  heroAlt: string;
  priority: boolean;
};

/** Plain Images — no Framer Motion (LCP path). */
export function HeroCarouselSlideImages({
  mobileSrc,
  desktopSrc,
  heroAlt,
  priority,
}: HeroCarouselSlideImagesProps) {
  const isPriority = priority;
  /** Aspect is enforced by Hero carousel column / slide viewport — avoid nested ratio + fill reflows. */
  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden">
      <div className="absolute inset-0 md:hidden">
        <Image
          src={mobileSrc}
          alt={heroAlt}
          fill
          priority={isPriority}
          fetchPriority={isPriority ? "high" : "auto"}
          loading={isPriority ? "eager" : "lazy"}
          decoding={isPriority ? "sync" : "async"}
          quality={60}
          className="object-contain object-center"
          sizes={HERO_CAROUSEL_MOBILE_SIZES}
        />
      </div>
      <div className="absolute inset-0 hidden md:block">
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
          sizes={HERO_CAROUSEL_DESKTOP_SIZES}
        />
      </div>
    </div>
  );
}
