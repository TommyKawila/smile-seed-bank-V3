"use client";

import type { ReactNode } from "react";
import Hero from "@/components/storefront/Hero";
import type { SectionTitle } from "@/lib/homepage-section-title";
import type { HomePageSectionPayload } from "@/lib/homepage-sections";
import type { HeroCtaButtonPayload } from "@/lib/homepage-hero-cta";

export type HomePageHeroClientProps = {
  sections: HomePageSectionPayload[];
  heroCarousel?: ReactNode;
  heroCtaButtons?: HeroCtaButtonPayload[];
};

export function HomePageHeroClient({ sections, heroCarousel, heroCtaButtons }: HomePageHeroClientProps) {
  const heroSection = sections.find((s) => s.key === "hero");

  const sectionTitle = (s: HomePageSectionPayload): SectionTitle => ({
    th: s.label_th,
    en: s.label_en,
  });

  if (!heroSection) return null;

  const st = sectionTitle(heroSection);
  return (
    <div className="bg-white pb-6 sm:pb-8">
      <div className="w-full px-0 pt-0 lg:mx-auto lg:max-w-7xl lg:px-6 lg:pt-6">
        <div className="overflow-hidden lg:rounded-3xl lg:border lg:border-zinc-200 lg:shadow-[0_24px_64px_-18px_rgba(21,128,61,0.12)] lg:ring-1 lg:ring-zinc-200/80">
          <Hero sectionTitle={st} heroCarousel={heroCarousel} heroCtaButtons={heroCtaButtons} />
        </div>
      </div>
    </div>
  );
}
