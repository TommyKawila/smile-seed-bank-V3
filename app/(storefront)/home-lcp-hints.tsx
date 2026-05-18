import "server-only";

import { HomeHeroLcpPreload } from "@/components/storefront/HomeHeroLcpPreload";
import { getHeroCarouselBannersCached } from "@/services/hero-banner-service";
import type { HeroBanner } from "@/lib/hero-banners";

export async function HomeHeroLcpHints() {
  const banners = await getHeroCarouselBannersCached().catch((): HeroBanner[] => []);
  return <HomeHeroLcpPreload banner={banners[0]} />;
}
