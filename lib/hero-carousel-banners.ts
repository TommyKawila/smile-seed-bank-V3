import {
  DEFAULT_HERO_BANNERS_FALLBACK,
  type HeroBanner,
} from "@/lib/hero-banners";

/** Ensures carousel + LCP preload always have at least one slide. */
export function resolveHeroCarouselBanners(
  banners: HeroBanner[] | null | undefined,
): HeroBanner[] {
  if (banners && banners.length > 0) return banners;
  return DEFAULT_HERO_BANNERS_FALLBACK;
}

/** Thai-default assets (matches server-first paint before client locale hydrates). */
export function firstBannerThSources(b: HeroBanner): { mobile: string; desktop: string } {
  const desktop = b.desktopSrc.trim();
  const mobile = (b.mobileSrc?.trim() ? b.mobileSrc : b.desktopSrc).trim();
  return { mobile, desktop };
}
