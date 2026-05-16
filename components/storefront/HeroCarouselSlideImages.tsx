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
  const eager = priority;
  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden">
      <div className="relative mx-auto h-full w-full max-h-full overflow-hidden aspect-[390/429] md:aspect-[16/7]">
        <Image
          src={mobileSrc}
          alt={heroAlt}
          fill
          priority={priority}
          fetchPriority={eager ? "high" : "auto"}
          loading={eager ? "eager" : "lazy"}
          quality={60}
          className="object-contain object-center md:hidden"
          sizes={HERO_CAROUSEL_MOBILE_SIZES}
        />
        <Image
          src={desktopSrc}
          alt={heroAlt}
          fill
          priority={priority}
          fetchPriority={eager ? "high" : "auto"}
          loading={eager ? "eager" : "lazy"}
          quality={65}
          className="hidden object-cover object-center md:block"
          sizes={HERO_CAROUSEL_DESKTOP_SIZES}
        />
      </div>
    </div>
  );
}
