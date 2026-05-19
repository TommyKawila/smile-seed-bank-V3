import "server-only";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { HomePageHeroClient } from "@/components/storefront/HomePageHeroClient";
import { EMPTY_STOREFRONT_HOME_PAYLOAD } from "@/services/storefront-home-service";
import { getHeroCarouselBannersCached } from "@/services/hero-banner-service";
import {
  DEFAULT_HOME_SECTION_KEYS,
  DEFAULT_SECTION_FALLBACK_LABELS,
  type HomePageSectionPayload,
} from "@/lib/homepage-sections";
import type { HeroBanner } from "@/lib/hero-banners";

const HomePageBelowFoldHost = dynamic(
  () =>
    import("@/components/storefront/HomePageBelowFoldHost").then((m) => ({
      default: m.HomePageBelowFoldHost,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[50vh] w-full animate-pulse bg-zinc-50" aria-hidden />
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

/** Sections first → hero SSR; below-fold client-only chunk (`ssr: false`) skips head CSS links. */
export async function HomeMainStream() {
  const sections = await getSections();
  const belowSections = sections.filter((s) => s.key !== "hero");
  const heroCarousel = (
    <Suspense fallback={<HeroCarouselSuspenseFallback />}>
      <HeroCarouselStream />
    </Suspense>
  );

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <HomePageHeroClient sections={sections} heroCarousel={heroCarousel} />
      <HomePageBelowFoldHost
        belowSections={belowSections}
        initialData={EMPTY_STOREFRONT_HOME_PAYLOAD /* literal-empty — storefront-home-service */}
      />
    </div>
  );
}
