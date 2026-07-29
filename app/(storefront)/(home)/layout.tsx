import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { HomeHeroLcpPreload } from "@/components/storefront/HomeHeroLcpPreload";
import { resolveHeroCarouselBanners } from "@/lib/hero-carousel-banners";
import { VIEWPORT_HINT_COOKIE } from "@/lib/viewport-hint-cookie";
import { getHeroCarouselBannersCached } from "@/services/hero-banner-service";

/** Home-only layout — LCP preload links hoist to `<head>` before page body streams. */
export default async function HomeRouteLayout({ children }: { children: ReactNode }) {
  const [bannersRaw, cookieStore] = await Promise.all([
    getHeroCarouselBannersCached().catch(() => null),
    cookies(),
  ]);
  const banners = resolveHeroCarouselBanners(bannersRaw);
  const initialLcpDesktop = cookieStore.get(VIEWPORT_HINT_COOKIE)?.value === "d";

  return (
    <>
      <HomeHeroLcpPreload banner={banners[0]} initialLcpDesktop={initialLcpDesktop} />
      {children}
    </>
  );
}
