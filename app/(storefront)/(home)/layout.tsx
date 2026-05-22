import type { ReactNode } from "react";
import { HomeHeroLcpPreload } from "@/components/storefront/HomeHeroLcpPreload";
import { STOREFRONT_HOME_CRITICAL_CSS } from "@/lib/storefront-home-critical-css";
import { getHeroCarouselBannersCached } from "@/services/hero-banner-service";
import type { HeroBanner } from "@/lib/hero-banners";

/** Home-only layout — LCP preload links hoist to `<head>` before page body streams. */
export default async function HomeRouteLayout({ children }: { children: ReactNode }) {
  const banners = await getHeroCarouselBannersCached().catch((): HeroBanner[] => []);

  return (
    <>
      <style id="home-critical-css" dangerouslySetInnerHTML={{ __html: STOREFRONT_HOME_CRITICAL_CSS }} />
      <HomeHeroLcpPreload banner={banners[0]} />
      {children}
    </>
  );
}
