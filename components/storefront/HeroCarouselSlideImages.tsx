"use client";

import { useEffect, useState } from "react";
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
  priority: boolean;
  /** Server UA hint — avoids eager mobile fetch on desktop PSI. */
  initialIsDesktop?: boolean;
};

function useLcpViewportIsDesktop(initialIsDesktop: boolean): boolean {
  const [isDesktop, setIsDesktop] = useState(initialIsDesktop);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isDesktop;
}

export function HeroCarouselSlideImages({
  mobileSrc,
  desktopSrc,
  heroAlt,
  priority,
  initialIsDesktop = false,
}: HeroCarouselSlideImagesProps) {
  const alt = heroAlt.trim() || "Smile Seed Bank Campaign";
  const isDesktop = useLcpViewportIsDesktop(initialIsDesktop);
  const mobilePriority = priority && !isDesktop;
  const desktopPriority = priority && isDesktop;
  const mobileImageSrc = heroCarouselMobileUrl(mobileSrc, mobilePriority);
  const desktopImageSrc = heroCarouselDesktopUrl(desktopSrc, desktopPriority);

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden">
      <div className="absolute inset-0 md:hidden">
        <Image
          src={mobileImageSrc}
          alt={alt}
          width={HERO_MOBILE_ASPECT_W}
          height={HERO_MOBILE_ASPECT_H}
          priority={mobilePriority}
          fetchPriority={mobilePriority ? "high" : "auto"}
          loading={mobilePriority ? "eager" : "lazy"}
          decoding={mobilePriority ? "sync" : "async"}
          quality={mobilePriority ? HERO_IMAGE_QUALITY_MOBILE_LCP : HERO_IMAGE_QUALITY_MOBILE}
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
          priority={desktopPriority}
          fetchPriority={desktopPriority ? "high" : "auto"}
          loading={desktopPriority ? "eager" : "lazy"}
          decoding={desktopPriority ? "async" : "async"}
          quality={desktopPriority ? HERO_IMAGE_QUALITY_DESKTOP_LCP : HERO_IMAGE_QUALITY_DESKTOP}
          sizes={HERO_CAROUSEL_DESKTOP_SIZES}
          unoptimized={shouldOffloadImageOptimization(desktopImageSrc)}
          className="object-cover object-center"
        />
      </div>
    </div>
  );
}
