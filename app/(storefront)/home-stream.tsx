import "server-only";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
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
  {
    loading: () => (
      <div className="min-h-[100svh] bg-white" aria-hidden />
    ),
  }
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

function HeroCarouselSuspenseFallback() {
  return (
    <div
      className="w-full aspect-[4/5] h-[65svh] bg-zinc-100 animate-pulse rounded-lg"
      aria-hidden
    />
  );
}

async function HeroCarouselStream() {
  const [{ HomeHeroCarousel }, banners] = await Promise.all([
    import("@/components/storefront/HomeHeroCarousel"),
    getHeroCarouselBannersCached().catch((): HeroBanner[] => []),
  ]);
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
        <Suspense fallback={<HeroCarouselSuspenseFallback />}>
          <HeroCarouselStream />
        </Suspense>
      }
    />
  );
}
