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
import {
  heroCarouselDesktopUrl,
  heroCarouselMobileUrl,
} from "@/lib/storefront-image-urls";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

export type HeroCarouselSlideImagesProps = {
  mobileSrc: string;
  desktopSrc: string;
  heroAlt: string;
  /** Slide 0 only — both breakpoints get eager/high (CSS hides the non-LCP img). */
  priority: boolean;
};

export function HeroCarouselSlideImages({
  mobileSrc,
  desktopSrc,
  heroAlt,
  priority,
}: HeroCarouselSlideImagesProps) {
  const alt = heroAlt.trim() || "Smile Seed Bank Campaign";
  const mobileImageSrc = heroCarouselMobileUrl(mobileSrc, priority);
  const desktopImageSrc = heroCarouselDesktopUrl(desktopSrc, priority);

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden">
      <div className="absolute inset-0 md:hidden">
        <Image
          src={mobileImageSrc}
          alt={alt}
          width={HERO_MOBILE_ASPECT_W}
          height={HERO_MOBILE_ASPECT_H}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          quality={priority ? HERO_IMAGE_QUALITY_MOBILE_LCP : HERO_IMAGE_QUALITY_MOBILE}
          sizes={HERO_CAROUSEL_MOBILE_SIZES}
          unoptimized={shouldOffloadImageOptimization(mobileImageSrc)}
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 hidden min-h-0 md:block">
        <Image
          src={desktopImageSrc}
          alt={alt}
          fill
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          quality={priority ? HERO_IMAGE_QUALITY_DESKTOP_LCP : HERO_IMAGE_QUALITY_DESKTOP}
          sizes={HERO_CAROUSEL_DESKTOP_SIZES}
          unoptimized={shouldOffloadImageOptimization(desktopImageSrc)}
          className="object-cover object-center"
        />
      </div>
    </div>
  );
}
