import type { HeroBanner } from "@/lib/hero-banners";
import { firstBannerThSources } from "@/lib/hero-carousel-banners";
import {
  HERO_DESKTOP_ASPECT_H,
  HERO_DESKTOP_ASPECT_W,
  HERO_MOBILE_ASPECT_H,
  HERO_MOBILE_ASPECT_W,
} from "@/components/storefront/hero-carousel-image-sizes";
import {
  heroCarouselDesktopUrl,
  heroCarouselMobileUrl,
} from "@/lib/storefront-image-urls";

/**
 * SSR native LCP `<img>` — same URL as `HomeHeroLcpPreload` / slide 0.
 * One viewport side via `ssb_vp` (`initialLcpDesktop`).
 */
export function HomeHeroLcpImg({
  banner,
  initialLcpDesktop = false,
  decorative = false,
}: {
  banner: HeroBanner | undefined;
  initialLcpDesktop?: boolean;
  /** When wrapped by a labeled link — empty alt to avoid duplicate announcement. */
  decorative?: boolean;
}) {
  if (!banner) return null;
  const { mobile, desktop } = firstBannerThSources(banner);
  if (!mobile || !desktop) return null;

  const isDesktop = initialLcpDesktop === true;
  const src = isDesktop
    ? heroCarouselDesktopUrl(desktop, true)
    : heroCarouselMobileUrl(mobile, true);
  const width = isDesktop ? HERO_DESKTOP_ASPECT_W : HERO_MOBILE_ASPECT_W;
  const height = isDesktop ? HERO_DESKTOP_ASPECT_H : HERO_MOBILE_ASPECT_H;
  const alt = decorative
    ? ""
    : banner.altTh.trim() || "Smile Seed Bank Campaign";

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      fetchPriority="high"
      loading="eager"
      decoding="async"
      className="h-full w-full object-cover object-center"
    />
  );
}
