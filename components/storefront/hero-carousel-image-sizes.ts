/** SSOT — hero carousel `sizes`, intrinsic W/H, and LCP preload buckets. */

/** Mobile hero frame + upload ratio (portrait). */
export const HERO_MOBILE_ASPECT_W = 392;
export const HERO_MOBILE_ASPECT_H = 429;

/** Master export @3× for admin uploads (WebP). */
export const HERO_MOBILE_EXPORT_3X_W = HERO_MOBILE_ASPECT_W * 3;
export const HERO_MOBILE_EXPORT_3X_H = HERO_MOBILE_ASPECT_H * 3;

export const HERO_MOBILE_UPLOAD_SPEC =
  "392×429 (1×) · 784×858 (2×) · 1176×1287 (3×) — ratio 392:429";

/** Desktop hero frame + upload ratio (portrait, 20% shorter than legacy 617:890). */
export const HERO_DESKTOP_ASPECT_W = 617;
export const HERO_DESKTOP_ASPECT_H = 712;

/** Master export @3× for admin uploads (WebP). */
export const HERO_DESKTOP_EXPORT_3X_W = HERO_DESKTOP_ASPECT_W * 3;
export const HERO_DESKTOP_EXPORT_3X_H = HERO_DESKTOP_ASPECT_H * 3;

export const HERO_DESKTOP_UPLOAD_SPEC =
  "617×712 (1×) · 1234×1424 (2×) · 1851×2136 (3×) — ratio 617:712";

/** Mobile slide only (`md:hidden`) — cap at 412px bucket (PSI mobile viewport). */
export const HERO_CAROUSEL_MOBILE_SIZES = "(max-width: 767px) 412px, 1px";

/** Desktop slide only (`md:block`). */
export const HERO_CAROUSEL_DESKTOP_SIZES = "(min-width: 768px) min(50vw, 640px), 800px";

/** LCP preload buckets — must match `HeroCarouselSlideImages` intrinsic W/H exactly. */
export const HERO_LCP_PRELOAD_MOBILE_W = HERO_MOBILE_ASPECT_W;
export const HERO_LCP_PRELOAD_MOBILE_H = HERO_MOBILE_ASPECT_H;
export const HERO_LCP_PRELOAD_DESKTOP_W = HERO_DESKTOP_ASPECT_W;
export const HERO_LCP_PRELOAD_DESKTOP_H = HERO_DESKTOP_ASPECT_H;

/** Phase C — JPEG/WebP/AVIF quality by slot (LCP slide 0 only gets eager + high fetch). */
export const HERO_IMAGE_QUALITY_MOBILE_LCP = 32;
export const HERO_IMAGE_QUALITY_MOBILE = 55;
export const HERO_IMAGE_QUALITY_DESKTOP_LCP = 50;
export const HERO_IMAGE_QUALITY_DESKTOP = 55;
