import type { ReactNode } from "react";
import { HomeHeroLcpPreload } from "@/components/storefront/HomeHeroLcpPreload";
import { getHeroCarouselBannersCached } from "@/services/hero-banner-service";
import type { HeroBanner } from "@/lib/hero-banners";

/** Home-only layout — LCP preload links hoist to `<head>` before page body streams. */
export default async function HomeRouteLayout({ children }: { children: ReactNode }) {
  const banners = await getHeroCarouselBannersCached().catch((): HeroBanner[] => []);

  return (
    <>
      <HomeHeroLcpPreload banner={banners[0]} />
      {children}
    </>
  );
}
