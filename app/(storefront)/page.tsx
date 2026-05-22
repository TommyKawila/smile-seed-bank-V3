import { Suspense } from "react";
import { HomeHeroLcpPreload } from "@/components/storefront/HomeHeroLcpPreload";
import { HomeMainStream } from "@/app/(storefront)/home-stream";
import { getHeroCarouselBannersCached } from "@/services/hero-banner-service";
import type { HeroBanner } from "@/lib/hero-banners";

function HomeMainStreamFallback() {
  return <div className="min-h-[100svh] bg-zinc-50" aria-hidden />;
}

/** Preload LCP hero in first HTML chunk — no Suspense gate before `<link rel="preload">`. */
export default async function HomePage() {
  const banners = await getHeroCarouselBannersCached().catch((): HeroBanner[] => []);

  return (
    <>
      <HomeHeroLcpPreload banner={banners[0]} />
      <Suspense fallback={<HomeMainStreamFallback />}>
        <HomeMainStream />
      </Suspense>
    </>
  );
}
