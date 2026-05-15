import { Suspense } from "react";
import { HomeHeroCarousel } from "@/components/storefront/HomeHeroCarousel";
import { getHeroCarouselBannersCached } from "@/services/hero-banner-service";

async function HomeHeroCarouselData() {
  const banners = await getHeroCarouselBannersCached().catch(() => []);
  return <HomeHeroCarousel banners={banners} />;
}

/** Server slot: banner fetch streams inside Suspense — not blocked by `getSections()` in `page.tsx`. */
export function HomeHeroCarouselSlot() {
  return (
    <Suspense
      fallback={
        <div
          className="relative h-full min-h-[280px] w-full bg-zinc-100 md:min-h-[420px]"
          aria-hidden
        />
      }
    >
      <HomeHeroCarouselData />
    </Suspense>
  );
}
