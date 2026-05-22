/** SSOT — hero carousel `sizes`, intrinsic W/H, and LCP preload buckets. */

/** Admin mobile banner aspect (391:429). */
export const HERO_MOBILE_ASPECT_W = 392;
export const HERO_MOBILE_ASPECT_H = 429;

/** Admin desktop banner aspect (617:890). */
export const HERO_DESKTOP_ASPECT_W = 617;
export const HERO_DESKTOP_ASPECT_H = 890;

/** Mobile slide only (`md:hidden`). */
export const HERO_CAROUSEL_MOBILE_SIZES = "(max-width: 767px) 100vw, 1px";

/** Desktop slide only (`md:block`). */
export const HERO_CAROUSEL_DESKTOP_SIZES = "(min-width: 768px) min(50vw, 640px), 800px";

/** LCP preload — Moto G–class logical width; matches planned `deviceSizes` **412**. */
export const HERO_LCP_PRELOAD_MOBILE_W = 412;
export const HERO_LCP_PRELOAD_MOBILE_H = Math.round(
  (HERO_LCP_PRELOAD_MOBILE_W * HERO_MOBILE_ASPECT_H) / HERO_MOBILE_ASPECT_W,
);

export const HERO_LCP_PRELOAD_DESKTOP_W = 640;
export const HERO_LCP_PRELOAD_DESKTOP_H = Math.round(
  (HERO_LCP_PRELOAD_DESKTOP_W * HERO_DESKTOP_ASPECT_H) / HERO_DESKTOP_ASPECT_W,
);

/** Phase C — JPEG/WebP/AVIF quality by slot (LCP slide 0 only gets eager + high fetch). */
export const HERO_IMAGE_QUALITY_MOBILE_LCP = 50;
export const HERO_IMAGE_QUALITY_MOBILE = 55;
export const HERO_IMAGE_QUALITY_DESKTOP_LCP = 60;
export const HERO_IMAGE_QUALITY_DESKTOP = 55;
