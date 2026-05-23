import "server-only";

import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { HomeHeroCarousel } from "@/components/storefront/HomeHeroCarousel";
import { HomePageHeroClient } from "@/components/storefront/HomePageHeroClient";
import { HomePageBelowFoldHost } from "@/components/storefront/HomePageBelowFoldHost";
import { resolveHeroCarouselBanners } from "@/lib/hero-carousel-banners";
import { isLikelyDesktopUserAgent } from "@/lib/user-agent-viewport";
import { EMPTY_STOREFRONT_HOME_PAYLOAD } from "@/services/storefront-home-service";
import { getHeroCarouselBannersCached } from "@/services/hero-banner-service";
import {
  DEFAULT_HOME_SECTION_KEYS,
  DEFAULT_SECTION_FALLBACK_LABELS,
  type HomePageSectionPayload,
} from "@/lib/homepage-sections";
import { listHeroCtaButtons } from "@/services/homepage-hero-cta-service";

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

const getHeroCtaCached = unstable_cache(
  () => listHeroCtaButtons(true),
  ["storefront-home-hero-cta"],
  { tags: ["home-layout"] }
);

/** Hero SSR + below-fold static client tree (`content-visibility` off-screen paint skip). */
export async function HomeMainStream() {
  const [sections, heroCtaButtons, bannersRaw] = await Promise.all([
    getSections(),
    getHeroCtaCached(),
    getHeroCarouselBannersCached().catch(() => null),
  ]);
  const banners = resolveHeroCarouselBanners(bannersRaw);
  const heroCtaPayload = heroCtaButtons.map(({ id, labelTh, labelEn, href, color }) => ({
    id,
    labelTh,
    labelEn,
    href,
    color,
  }));
  const belowSections = sections.filter((s) => s.key !== "hero");
  const headerStore = await headers();
  const initialIsDesktop = isLikelyDesktopUserAgent(headerStore.get("user-agent") ?? "");
  const heroCarousel = <HomeHeroCarousel banners={banners} initialIsDesktop={initialIsDesktop} />;

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <HomePageHeroClient sections={sections} heroCarousel={heroCarousel} heroCtaButtons={heroCtaPayload} />
      <div className="w-full [content-visibility:auto] [contain-intrinsic-size:0_600px] overflow-hidden">
        <HomePageBelowFoldHost
          belowSections={belowSections}
          initialData={EMPTY_STOREFRONT_HOME_PAYLOAD /* literal-empty — storefront-home-service */}
        />
      </div>
    </div>
  );
}
