import type { HeroBanner } from "@/lib/hero-banners";
import { firstBannerThSources } from "@/lib/hero-carousel-banners";
import {
  heroCarouselDesktopUrl,
  heroCarouselMobileUrl,
} from "@/lib/storefront-image-urls";

/**
 * Emits preload hints for the first hero slide (Supabase render URLs, not `/_next/image`).
 */
export function HomeHeroLcpPreload({ banner }: { banner: HeroBanner | undefined }) {
  if (!banner) return null;
  const { mobile, desktop } = firstBannerThSources(banner);
  if (!mobile || !desktop) return null;

  const mobileHref = heroCarouselMobileUrl(mobile, true);
  const desktopHref = heroCarouselDesktopUrl(desktop, true);

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
