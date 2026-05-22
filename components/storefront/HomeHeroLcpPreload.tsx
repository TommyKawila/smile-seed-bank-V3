import { getImageProps } from "next/image";
import type { HeroBanner } from "@/lib/hero-banners";
import { firstBannerThSources } from "@/lib/hero-carousel-banners";
import {
  HERO_CAROUSEL_DESKTOP_SIZES,
  HERO_CAROUSEL_MOBILE_SIZES,
  HERO_IMAGE_QUALITY_DESKTOP_LCP,
  HERO_IMAGE_QUALITY_MOBILE_LCP,
  HERO_MOBILE_ASPECT_H,
  HERO_MOBILE_ASPECT_W,
} from "@/components/storefront/hero-carousel-image-sizes";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

function PreloadOptimizedMobile({ src }: { src: string }) {
  if (shouldOffloadImageOptimization(src)) {
    return (
      <link rel="preload" as="image" href={src.trim()} fetchPriority="high" media="(max-width: 767px)" />
    );
  }
  try {
    const { props } = getImageProps({
      src: src.trim(),
      alt: "",
      width: HERO_MOBILE_ASPECT_W,
      height: HERO_MOBILE_ASPECT_H,
      quality: HERO_IMAGE_QUALITY_MOBILE_LCP,
      sizes: HERO_CAROUSEL_MOBILE_SIZES,
    });
    const srcSet = typeof props.srcSet === "string" && props.srcSet.trim() ? props.srcSet.trim() : "";
    const href = typeof props.src === "string" ? props.src : "";
    if (srcSet) {
      return (
        <link
          rel="preload"
          as="image"
          imageSrcSet={srcSet}
          imageSizes={HERO_CAROUSEL_MOBILE_SIZES}
          fetchPriority="high"
          media="(max-width: 767px)"
        />
      );
    }
    if (href) {
      return <link rel="preload" as="image" href={href} fetchPriority="high" media="(max-width: 767px)" />;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function PreloadOptimizedDesktop({ src }: { src: string }) {
  if (shouldOffloadImageOptimization(src)) {
    return (
      <link rel="preload" as="image" href={src.trim()} fetchPriority="high" media="(min-width: 768px)" />
    );
  }
  try {
    const { props } = getImageProps({
      src: src.trim(),
      alt: "",
      fill: true,
      quality: HERO_IMAGE_QUALITY_DESKTOP_LCP,
      sizes: HERO_CAROUSEL_DESKTOP_SIZES,
    });
    const srcSet = typeof props.srcSet === "string" && props.srcSet.trim() ? props.srcSet.trim() : "";
    const href = typeof props.src === "string" ? props.src : "";
    if (srcSet) {
      return (
        <link
          rel="preload"
          as="image"
          imageSrcSet={srcSet}
          imageSizes={HERO_CAROUSEL_DESKTOP_SIZES}
          fetchPriority="high"
          media="(min-width: 768px)"
        />
      );
    }
    if (href) {
      return <link rel="preload" as="image" href={href} fetchPriority="high" media="(min-width: 768px)" />;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Emits responsive preload hints for the first hero slide so the preload scanner
 * can start `/_next/image` (or raw URL) before the client carousel hydrates.
 */
export function HomeHeroLcpPreload({ banner }: { banner: HeroBanner | undefined }) {
  if (!banner) return null;
  const { mobile, desktop } = firstBannerThSources(banner);
  if (!mobile || !desktop) return null;

  return (
    <>
      <PreloadOptimizedMobile src={mobile} />
      <PreloadOptimizedDesktop src={desktop} />
    </>
  );
}
