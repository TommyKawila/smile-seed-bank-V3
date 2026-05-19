"use client";

import type { ReactNode } from "react";
import Hero from "@/components/storefront/Hero";
import type { SectionTitle } from "@/lib/homepage-section-title";
import type { HomePageSectionPayload } from "@/lib/homepage-sections";

export type HomePageHeroClientProps = {
  sections: HomePageSectionPayload[];
  heroCarousel?: ReactNode;
};

export function HomePageHeroClient({ sections, heroCarousel }: HomePageHeroClientProps) {
  const heroSection = sections.find((s) => s.key === "hero");

  const sectionTitle = (s: HomePageSectionPayload): SectionTitle => ({
    th: s.label_th,
    en: s.label_en,
  });

  if (!heroSection) return null;

  const st = sectionTitle(heroSection);
  return (
    <div className="bg-white pb-6 sm:pb-8">
      <div className="mx-auto max-w-7xl max-lg:px-0 max-lg:pt-0 px-4 pt-5 sm:px-6 sm:pt-6">
        <div className="overflow-hidden rounded-3xl border border-zinc-200 shadow-[0_24px_64px_-18px_rgba(21,128,61,0.12)] ring-1 ring-zinc-200/80 max-lg:rounded-none max-lg:border-0 max-lg:shadow-none max-lg:ring-0">
          <Hero sectionTitle={st} heroCarousel={heroCarousel} />
        </div>
      </div>
    </div>
  );
}
