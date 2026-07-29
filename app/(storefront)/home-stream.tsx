import "server-only";

import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { HomeHeroCarousel } from "@/components/storefront/HomeHeroCarousel";
import { HomePageHeroClient } from "@/components/storefront/HomePageHeroClient";
import { HomePageBelowFoldHost } from "@/components/storefront/HomePageBelowFoldHost";
import { resolveHeroCarouselBanners } from "@/lib/hero-carousel-banners";
import { EMPTY_STOREFRONT_HOME_PAYLOAD } from "@/services/storefront-home-service";
import { getHeroCarouselBannersCached } from "@/services/hero-banner-service";
import {
  DEFAULT_HOME_SECTION_KEYS,
  DEFAULT_SECTION_FALLBACK_LABELS,
  normalizeBelowFoldSections,
  type HomePageSectionPayload,
} from "@/lib/homepage-sections";
import { listHeroCtaButtons } from "@/services/homepage-hero-cta-service";
import { normalizeHeroCtaHref } from "@/lib/homepage-hero-cta";
import { VIEWPORT_HINT_COOKIE } from "@/lib/viewport-hint-cookie";

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

const getHeroCtaCached = unstable_cache(
  () => listHeroCtaButtons(true),
  ["storefront-home-hero-cta", "new-seeds-landing-v1"],
  { tags: ["home-layout"] }
);

const HERO_SECTION_FALLBACK: HomePageSectionPayload = {
  key: "hero",
  label_th: DEFAULT_SECTION_FALLBACK_LABELS.hero.label_th,
  label_en: DEFAULT_SECTION_FALLBACK_LABELS.hero.label_en,
};

/** LCP path only — banners + CTA; never waits on homepage_sections. */
export async function HomeHeroStream() {
  const [bannersRaw, heroCtaButtons, cookieStore] = await Promise.all([
    getHeroCarouselBannersCached().catch(() => null),
    getHeroCtaCached(),
    cookies(),
  ]);
  const banners = resolveHeroCarouselBanners(bannersRaw);
  const heroCtaPayload = heroCtaButtons.map(({ id, labelTh, labelEn, href, color }) => ({
    id,
    labelTh,
    labelEn,
    href: normalizeHeroCtaHref(href, id),
    color,
  }));
  const initialLcpDesktop = cookieStore.get(VIEWPORT_HINT_COOKIE)?.value === "d";
  const heroCarousel = (
    <HomeHeroCarousel banners={banners} initialLcpDesktop={initialLcpDesktop} />
  );
  return (
    <HomePageHeroClient
      sections={[HERO_SECTION_FALLBACK]}
      heroCarousel={heroCarousel}
      heroCtaButtons={heroCtaPayload}
    />
  );
}

async function HomeBelowFoldStream() {
  const sections = await getSectionsCached();
  const belowSections = normalizeBelowFoldSections(sections.filter((s) => s.key !== "hero"));
  return (
    <div className="w-full [content-visibility:auto] [contain-intrinsic-size:0_600px] overflow-hidden">
      <HomePageBelowFoldHost
        belowSections={belowSections}
        initialData={EMPTY_STOREFRONT_HOME_PAYLOAD /* literal-empty — storefront-home-service */}
      />
    </div>
  );
}

/** Hero first (no Suspense), below-fold streams after sections resolve. */
export async function HomeMainStream() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeHeroStream />
      <Suspense fallback={null}>
        <HomeBelowFoldStream />
      </Suspense>
    </div>
  );
}
