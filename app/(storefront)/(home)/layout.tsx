import type { ReactNode } from "react";
import { HomeHeroLcpPreload } from "@/components/storefront/HomeHeroLcpPreload";
import { resolveHeroCarouselBanners } from "@/lib/hero-carousel-banners";
import { getHeroCarouselBannersCached } from "@/services/hero-banner-service";

/** Home-only layout — LCP preload links hoist to `<head>` before page body streams. */
export default async function HomeRouteLayout({ children }: { children: ReactNode }) {
  const banners = resolveHeroCarouselBanners(
    await getHeroCarouselBannersCached().catch(() => null),
  );

  return (
    <>
      <HomeHeroLcpPreload banner={banners[0]} />
      {children}
    </>
  );
}
