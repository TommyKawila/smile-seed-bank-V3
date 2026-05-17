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
  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden">
      <div className="relative mx-auto h-full w-full max-h-full overflow-hidden aspect-[390/429] md:aspect-[16/7]">
        <div className="absolute inset-0 md:hidden">
          <div className="relative h-full w-full min-h-0 overflow-hidden">
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
        </div>
        <div className="absolute inset-0 hidden md:block">
          <div className="relative h-full w-full min-h-0 overflow-hidden">
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
      </div>
    </div>
  );
}
