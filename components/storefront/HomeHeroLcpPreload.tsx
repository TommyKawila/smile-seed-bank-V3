import { getImageProps } from "next/image";
import type { HeroBanner } from "@/lib/hero-banners";
import {
  HERO_CAROUSEL_DESKTOP_SIZES,
  HERO_CAROUSEL_MOBILE_SIZES,
} from "@/components/storefront/hero-carousel-image-sizes";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

/**
 * Moto G Power–style logical width (~412 CSS px); height matches hero slide aspect **390:429**.
 * Aligns with `HeroCarouselSlideImages` + `deviceSizes` bucket **412** in next.config.
 */
const MOBILE_W = 412;
const MOBILE_H = Math.round((MOBILE_W * 429) / 390);
const DESKTOP_W = 640;
/** Desktop hero frame uses **16:7** (see `HeroCarouselSlideImages`). */
const DESKTOP_H = Math.round((DESKTOP_W * 7) / 16);

const MOBILE_IMAGE_SIZES_HINT = "(max-width: 767px) 100vw";

/** Thai-default assets for LCP (matches server-first paint before client locale hydrates). */
function firstBannerSources(b: HeroBanner): { mobile: string; desktop: string } {
  const desktop = b.desktopSrc.trim();
  const mobile = (b.mobileSrc?.trim() ? b.mobileSrc : b.desktopSrc).trim();
  return { mobile, desktop };
}

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
      width: MOBILE_W,
      height: MOBILE_H,
      quality: 60,
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
          imageSizes={MOBILE_IMAGE_SIZES_HINT}
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
      width: DESKTOP_W,
      height: DESKTOP_H,
      quality: 65,
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
  const { mobile, desktop } = firstBannerSources(banner);
  if (!mobile || !desktop) return null;

  return (
    <>
      <PreloadOptimizedMobile src={mobile} />
      <PreloadOptimizedDesktop src={desktop} />
    </>
  );
}
