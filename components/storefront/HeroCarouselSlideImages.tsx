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
import {
  readViewportHintDesktopFromCookie,
  subscribeDesktopViewport,
} from "@/lib/viewport-hint-cookie";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

const MQ_DESKTOP = "(min-width: 768px)";

export type HeroCarouselSlideImagesProps = {
  mobileSrc: string;
  desktopSrc: string;
  heroAlt: string;
  priority: boolean;
  /** From middleware `ssb_vp` cookie — SSR renders one LCP candidate only. */
  initialLcpDesktop?: boolean;
};

function useLcpViewportIsDesktop(initialLcpDesktop: boolean): boolean {
  const [isDesktop, setIsDesktop] = useState(initialLcpDesktop);

  useEffect(() => {
    const hint = readViewportHintDesktopFromCookie();
    if (hint !== null) setIsDesktop(hint);
    return subscribeDesktopViewport(() => {
      setIsDesktop(window.matchMedia(MQ_DESKTOP).matches);
    });
  }, []);

  return isDesktop;
}

export function HeroCarouselSlideImages({
  mobileSrc,
  desktopSrc,
  heroAlt,
  priority,
  initialLcpDesktop = false,
}: HeroCarouselSlideImagesProps) {
  const alt = heroAlt.trim() || "Smile Seed Bank Campaign";
  const isDesktop = useLcpViewportIsDesktop(initialLcpDesktop);
  const lcpPriority = priority;
  const mobileImageSrc = heroCarouselMobileUrl(mobileSrc, lcpPriority && !isDesktop);
  const desktopImageSrc = heroCarouselDesktopUrl(desktopSrc, lcpPriority && isDesktop);

  if (!isDesktop) {
    return (
      <div className="relative h-full w-full min-h-0 overflow-hidden">
        <Image
          src={mobileImageSrc}
          alt={alt}
          width={HERO_MOBILE_ASPECT_W}
          height={HERO_MOBILE_ASPECT_H}
          priority={lcpPriority}
          fetchPriority={lcpPriority ? "high" : "auto"}
          loading={lcpPriority ? "eager" : "lazy"}
          decoding={lcpPriority ? "sync" : "async"}
          quality={lcpPriority ? HERO_IMAGE_QUALITY_MOBILE_LCP : HERO_IMAGE_QUALITY_MOBILE}
          sizes={HERO_CAROUSEL_MOBILE_SIZES}
          unoptimized={shouldOffloadImageOptimization(mobileImageSrc)}
          className="h-full w-full object-cover object-center"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden">
      <Image
        src={desktopImageSrc}
        alt={alt}
        fill
        priority={lcpPriority}
        fetchPriority={lcpPriority ? "high" : "auto"}
        loading={lcpPriority ? "eager" : "lazy"}
        decoding="async"
        quality={lcpPriority ? HERO_IMAGE_QUALITY_DESKTOP_LCP : HERO_IMAGE_QUALITY_DESKTOP}
        sizes={HERO_CAROUSEL_DESKTOP_SIZES}
        unoptimized={shouldOffloadImageOptimization(desktopImageSrc)}
        className="object-cover object-center"
      />
    </div>
  );
}
