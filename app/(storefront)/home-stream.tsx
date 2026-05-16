import "server-only";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { HomeHeroCarousel } from "@/components/storefront/HomeHeroCarousel";
import { HomeHeroLcpPreload } from "@/components/storefront/HomeHeroLcpPreload";
import { HomeHeroCarouselSkeleton, HomeHeroSkeleton } from "@/components/storefront/HomeHeroSkeleton";
import { EMPTY_STOREFRONT_HOME_PAYLOAD } from "@/services/storefront-home-service";
import { getHeroCarouselBannersCached } from "@/services/hero-banner-service";
import {
  DEFAULT_HOME_SECTION_KEYS,
  DEFAULT_SECTION_FALLBACK_LABELS,
  type HomePageSectionPayload,
} from "@/lib/homepage-sections";
import type { HeroBanner } from "@/lib/hero-banners";

const HomePageClient = dynamic(
  () =>
    import("@/components/storefront/HomePageClient").then((m) => ({ default: m.HomePageClient })),
  { loading: () => <HomeHeroSkeleton /> }
);

const getSectionsCached = unstable_cache(
  async (): Promise<HomePageSectionPayload[]> => {
    const count = await prisma.homepage_sections.count();
    if (count === 0) {
      return DEFAULT_HOME_SECTION_KEYS.map((key) => {
        const fb = DEFAULT_SECTION_FALLBACK_LABELS[key];
        return {
          key,
          label_th: fb?.label_th ?? "—",
          label_en: fb?.label_en ?? "—",
        };
      });
    }
    const rows = await prisma.homepage_sections.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { key: "asc" }],
      select: { key: true, label_th: true, label_en: true },
    });
    return rows.map((r) => ({
      key: r.key,
      label_th: r.label_th,
      label_en: r.label_en,
    }));
  },
  ["storefront-homepage-sections"],
  { tags: ["home-layout"] }
);

async function getSections(): Promise<HomePageSectionPayload[]> {
  return getSectionsCached();
}

/** Parallel stream: LCP preload hints (same cached banner query as carousel body). */
export async function HomeHeroLcpHints() {
  const banners = await getHeroCarouselBannersCached().catch((): HeroBanner[] => []);
  return <HomeHeroLcpPreload banner={banners[0]} />;
}

async function HeroBannersBody() {
  const banners = await getHeroCarouselBannersCached().catch((): HeroBanner[] => []);
  return <HomeHeroCarousel banners={banners} />;
}

/** Sections first → shell streams; carousel resolves in its own Suspense. */
export async function HomeMainStream() {
  const sections = await getSections();
  return (
    <HomePageClient
      sections={sections}
      initialData={EMPTY_STOREFRONT_HOME_PAYLOAD /* literal-empty — storefront-home-service */}
      heroCarousel={
        <Suspense fallback={<HomeHeroCarouselSkeleton />}>
          <HeroBannersBody />
        </Suspense>
      }
    />
  );
}
