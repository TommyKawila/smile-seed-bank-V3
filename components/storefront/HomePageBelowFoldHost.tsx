"use client";

import { useEffect, useRef, useState } from "react";
import { HomePageBelowFold } from "@/components/storefront/HomePageBelowFold";
import { signalFramerMotionNeeded } from "@/lib/framer-motion-events";
import type { ProductWithBreeder, ProductWithBreederAndVariants } from "@/lib/supabase/types";
import { HOME_NEW_ARRIVALS_LIMIT } from "@/lib/constants";
import type { MagazinePostPublic } from "@/lib/blog-service";
import type { HomePageSectionPayload } from "@/lib/homepage-sections";
import { fetchWithTimeout } from "@/lib/timeout";
import type { StorefrontHomePayload } from "@/services/storefront-home-service";

type RawHomePayload = Partial<StorefrontHomePayload> & {
  data?: ProductWithBreederAndVariants[];
};

export type HomePageBelowFoldHostProps = {
  belowSections: HomePageSectionPayload[];
  initialData: StorefrontHomePayload;
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

export function HomePageBelowFoldHost({ belowSections, initialData }: HomePageBelowFoldHostProps) {
  const hasInitialData = hasHomePayload(initialData);
  const [newArrivals, setNewArrivals] = useState<ProductWithBreederAndVariants[]>(initialData.newArrivals);
  const [newArrivalsLoading, setNewArrivalsLoading] = useState(!hasInitialData);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithBreeder[]>(initialData.featured);
  const [featuredLoading, setFeaturedLoading] = useState(!hasInitialData);
  const [insights, setInsights] = useState<MagazinePostPublic[]>(initialData.magazine);
  const [insightsLoading, setInsightsLoading] = useState(!hasInitialData);
  const [clearanceProducts, setClearanceProducts] = useState<ProductWithBreederAndVariants[]>(
    initialData.clearance
  );
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
        console.error("[HomePageBelowFoldHost] storefront/home fetch failed:", err);
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

  const belowFoldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = belowFoldRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          signalFramerMotionNeeded();
          io.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={belowFoldRef}>
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
    </div>
  );
}
