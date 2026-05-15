"use client";

/**
 * Storefront home — sections order from `homepage_sections` (see `app/(storefront)/page.tsx`).
 * Hero renders synchronously; below-fold loads via `dynamic` + `Suspense`. Framer Motion on home lives only in `HomePageBelowFold` (`whileInView`, no eager-run animations here).
 */

import { Suspense, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Hero from "@/components/storefront/Hero";
import type { ProductWithBreeder, ProductWithBreederAndVariants } from "@/lib/supabase/types";
import { HOME_NEW_ARRIVALS_LIMIT } from "@/lib/constants";
import type { MagazinePostPublic } from "@/lib/blog-service";
import type { SectionTitle } from "@/lib/homepage-section-title";
import type { HomePageSectionPayload } from "@/lib/homepage-sections";
import { fetchWithTimeout } from "@/lib/timeout";
import type { StorefrontHomePayload } from "@/services/storefront-home-service";

const HomePageBelowFold = dynamic(
  () => import("./HomePageBelowFold").then((m) => m.HomePageBelowFold),
  {
    ssr: false,
    loading: () => <div className="h-20 bg-white" aria-hidden />,
  }
);

type RawHomePayload = Partial<StorefrontHomePayload> & {
  data?: ProductWithBreederAndVariants[];
};

type HomePageClientProps = {
  sections: HomePageSectionPayload[];
  initialData: StorefrontHomePayload;
  heroCarousel?: ReactNode;
};

function hasHomePayload(data: StorefrontHomePayload): boolean {
  return (
    data.newArrivals.length > 0 ||
    data.featured.length > 0 ||
    data.clearance.length > 0 ||
    data.magazine.length > 0
  );
}

async function fetchStorefrontHomeClient(): Promise<StorefrontHomePayload> {
  const response = await fetchWithTimeout("/api/storefront/home", {}, 8000);
  if (!response.ok) throw new Error(`Failed to load home data (${response.status})`);
  const result = (await response.json()) as RawHomePayload | ProductWithBreederAndVariants[];
  const newArrivals = Array.isArray(result) ? result : result.newArrivals ?? result.data ?? [];
  return {
    newArrivals: Array.isArray(newArrivals) ? newArrivals.slice(0, HOME_NEW_ARRIVALS_LIMIT) : [],
    featured: !Array.isArray(result) && Array.isArray(result.featured) ? result.featured : [],
    clearance: !Array.isArray(result) && Array.isArray(result.clearance) ? result.clearance : [],
    magazine: !Array.isArray(result) && Array.isArray(result.magazine) ? result.magazine : [],
  };
}

function HomePageMain({ sections, initialData, heroCarousel }: HomePageClientProps) {
  const hasInitialData = hasHomePayload(initialData);
  const [newArrivals, setNewArrivals] = useState<ProductWithBreederAndVariants[]>(initialData.newArrivals);
  const [newArrivalsLoading, setNewArrivalsLoading] = useState(!hasInitialData);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithBreeder[]>(initialData.featured);
  const [featuredLoading, setFeaturedLoading] = useState(!hasInitialData);
  const [insights, setInsights] = useState<MagazinePostPublic[]>(initialData.magazine);
  const [insightsLoading, setInsightsLoading] = useState(!hasInitialData);
  const [clearanceProducts, setClearanceProducts] = useState<ProductWithBreederAndVariants[]>(initialData.clearance);
  const [clearanceLoading, setClearanceLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStorefrontHomeClient();
        if (!cancelled) {
          setNewArrivals(data.newArrivals);
          setFeaturedProducts(data.featured);
          setInsights(data.magazine);
          setClearanceProducts(data.clearance);
        }
      } catch (err) {
        console.error("[HomePageClient] storefront/home fetch failed:", err);
        if (!cancelled) {
          setNewArrivals([]);
          setFeaturedProducts([]);
          setInsights([]);
          setClearanceProducts([]);
        }
      } finally {
        if (!cancelled) {
          setNewArrivalsLoading(false);
          setFeaturedLoading(false);
          setInsightsLoading(false);
          setClearanceLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasInitialData]);

  const heroSection = sections.find((s) => s.key === "hero");
  const belowSections = sections.filter((s) => s.key !== "hero");

  const sectionTitle = (s: HomePageSectionPayload): SectionTitle => ({
    th: s.label_th,
    en: s.label_en,
  });

  const renderHero = (section: HomePageSectionPayload) => {
    const st = sectionTitle(section);
    return (
      <div key={section.key} className="bg-white pb-6 sm:pb-8">
        <div className="mx-auto max-w-7xl max-lg:px-0 max-lg:pt-0 px-4 pt-5 sm:px-6 sm:pt-6">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 shadow-[0_24px_64px_-18px_rgba(21,128,61,0.12)] ring-1 ring-zinc-200/80 max-lg:rounded-none max-lg:border-0 max-lg:shadow-none max-lg:ring-0">
            <Hero sectionTitle={st} heroCarousel={heroCarousel} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {heroSection ? renderHero(heroSection) : null}
      <Suspense fallback={<div className="h-20 bg-white" aria-hidden />}>
        <HomePageBelowFold
          sections={belowSections}
          newArrivals={newArrivals}
          newArrivalsLoading={newArrivalsLoading}
          featuredProducts={featuredProducts}
          featuredLoading={featuredLoading}
          insights={insights}
          insightsLoading={insightsLoading}
          clearanceProducts={clearanceProducts}
          clearanceLoading={clearanceLoading}
        />
      </Suspense>
    </div>
  );
}

export function HomePageClient({ sections, initialData, heroCarousel }: HomePageClientProps) {
  return (
    <HomePageMain sections={sections} initialData={initialData} heroCarousel={heroCarousel} />
  );
}
