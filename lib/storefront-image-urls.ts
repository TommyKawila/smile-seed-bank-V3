import {
  HERO_IMAGE_QUALITY_DESKTOP,
  HERO_IMAGE_QUALITY_DESKTOP_LCP,
  HERO_IMAGE_QUALITY_MOBILE,
  HERO_IMAGE_QUALITY_MOBILE_LCP,
} from "@/components/storefront/hero-carousel-image-sizes";
import { resolveOptimizedAssetUrl, resolvePublicAssetUrl } from "@/lib/public-storage-url";

/** PSI mobile LCP bucket — matches `HERO_CAROUSEL_MOBILE_SIZES`. */
export const HERO_MOBILE_RENDER_W = 412;
export const HERO_DESKTOP_RENDER_W = 640;

export const PRODUCT_GALLERY_MAIN_W = 828;
export const PRODUCT_GALLERY_THUMB_W = 160;
export const PRODUCT_GALLERY_LIGHTBOX_W = 1200;
export const PRODUCT_LISTING_THUMB_W = 384;
/** 32px display @2x — card / nav breeder badges. */
export const BREEDER_LOGO_W = 64;

function withFallback(src: string, optimized: string | null): string {
  return optimized ?? resolvePublicAssetUrl(src) ?? src;
}

export function heroCarouselMobileUrl(src: string, lcp: boolean): string {
  return withFallback(
    src,
    resolveOptimizedAssetUrl(src, {
      width: HERO_MOBILE_RENDER_W,
      quality: lcp ? HERO_IMAGE_QUALITY_MOBILE_LCP : HERO_IMAGE_QUALITY_MOBILE,
      resize: "contain",
      format: "webp",
    })
  );
}

export function heroCarouselDesktopUrl(src: string, lcp: boolean): string {
  return withFallback(
    src,
    resolveOptimizedAssetUrl(src, {
      width: HERO_DESKTOP_RENDER_W,
      quality: lcp ? HERO_IMAGE_QUALITY_DESKTOP_LCP : HERO_IMAGE_QUALITY_DESKTOP,
      resize: "contain",
      format: "webp",
    })
  );
}

export function productGalleryMainUrl(src: string): string {
  return withFallback(
    src,
    resolveOptimizedAssetUrl(src, {
      width: PRODUCT_GALLERY_MAIN_W,
      quality: 75,
      resize: "contain",
      format: "webp",
    })
  );
}

export function productGalleryThumbUrl(src: string): string {
  return withFallback(
    src,
    resolveOptimizedAssetUrl(src, {
      width: PRODUCT_GALLERY_THUMB_W,
      quality: 70,
      resize: "contain",
      format: "webp",
    })
  );
}

export function productGalleryLightboxUrl(src: string): string {
  return withFallback(
    src,
    resolveOptimizedAssetUrl(src, {
      width: PRODUCT_GALLERY_LIGHTBOX_W,
      quality: 80,
      resize: "contain",
      format: "webp",
    })
  );
}

export function productListingThumbUrl(src: string | null | undefined): string | null {
  const s = src == null ? "" : String(src).trim();
  if (!s) return null;
  return (
    resolveOptimizedAssetUrl(s, {
      width: PRODUCT_LISTING_THUMB_W,
      quality: 60,
      resize: "contain",
      format: "webp",
    }) ?? resolvePublicAssetUrl(s)
  );
}

export function breederLogoUrl(
  src: string | null | undefined,
  displayWidth = BREEDER_LOGO_W / 2
): string | null {
  const s = src == null ? "" : String(src).trim();
  if (!s) return null;
  const w = Math.max(BREEDER_LOGO_W, Math.round(displayWidth) * 2);
  return (
    resolveOptimizedAssetUrl(s, {
      width: w,
      quality: 70,
      resize: "contain",
      format: "webp",
    }) ?? resolvePublicAssetUrl(s)
  );
}
