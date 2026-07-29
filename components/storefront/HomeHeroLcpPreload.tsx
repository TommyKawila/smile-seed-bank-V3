import type { HeroBanner } from "@/lib/hero-banners";
import { firstBannerThSources } from "@/lib/hero-carousel-banners";
import {
  heroCarouselDesktopUrl,
  heroCarouselMobileUrl,
} from "@/lib/storefront-image-urls";

/**
 * Emits preload for the first hero slide (Supabase render URLs).
 * Single side when `initialLcpDesktop` is set (matches `ssb_vp` SSR).
 */
export function HomeHeroLcpPreload({
  banner,
  initialLcpDesktop,
}: {
  banner: HeroBanner | undefined;
  /** When set, emit only that viewport side — matches SSR LCP `<Image>`. */
  initialLcpDesktop?: boolean;
}) {
  if (!banner) return null;
  const { mobile, desktop } = firstBannerThSources(banner);
  if (!mobile || !desktop) return null;

  const mobileHref = heroCarouselMobileUrl(mobile, true);
  const desktopHref = heroCarouselDesktopUrl(desktop, true);

  if (initialLcpDesktop === true) {
    return (
      <link rel="preload" as="image" href={desktopHref} fetchPriority="high" />
    );
  }
  if (initialLcpDesktop === false) {
    return (
      <link rel="preload" as="image" href={mobileHref} fetchPriority="high" />
    );
  }

  return (
    <>
      <link
        rel="preload"
        as="image"
        href={mobileHref}
        fetchPriority="high"
        media="(max-width: 767px)"
      />
      <link
        rel="preload"
        as="image"
        href={desktopHref}
        fetchPriority="high"
        media="(min-width: 768px)"
      />
    </>
  );
}
