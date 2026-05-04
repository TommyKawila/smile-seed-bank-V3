import type { ProductWithBreeder, ProductWithBreederAndVariants } from "@/lib/supabase/types";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { getRecentPublishedPosts } from "@/lib/blog-service";
import { withTimeout } from "@/lib/timeout";
import {
  getClearanceStorefrontProducts,
  getFeaturedProducts,
  getNewArrivals,
} from "@/services/product-service";

export type StorefrontHomePayload = {
  newArrivals: ProductWithBreederAndVariants[];
  featured: ProductWithBreeder[];
  clearance: ProductWithBreederAndVariants[];
  magazine: MagazinePostPublic[];
};

type RawHomePayload = Partial<StorefrontHomePayload> & {
  data?: ProductWithBreederAndVariants[];
};

export const EMPTY_STOREFRONT_HOME_PAYLOAD: StorefrontHomePayload = {
  newArrivals: [],
  featured: [],
  clearance: [],
  magazine: [],
};

const FEATURED_POOL = 10;
const FEATURED_SHOW = 5;
const CLEARANCE_LIMIT = 24;
const NEW_ARRIVALS_LIMIT = 8;
const INSIGHTS_LIMIT = 4;
const HOME_DATA_TIMEOUT_MS = 5000;

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = arr[i];
    const b = arr[j];
    if (a === undefined || b === undefined) continue;
    arr[i] = b;
    arr[j] = a;
  }
}

export function normalizeStorefrontHomePayload(
  result: RawHomePayload | ProductWithBreederAndVariants[]
): StorefrontHomePayload {
  const newArrivals = Array.isArray(result) ? result : result.newArrivals ?? result.data ?? [];

  return {
    newArrivals: Array.isArray(newArrivals) ? newArrivals.slice(0, 8) : [],
    featured: !Array.isArray(result) && Array.isArray(result.featured) ? result.featured : [],
    clearance: !Array.isArray(result) && Array.isArray(result.clearance) ? result.clearance : [],
    magazine: !Array.isArray(result) && Array.isArray(result.magazine) ? result.magazine : [],
  };
}

export async function getStorefrontHomePayload(
  timeoutMs = HOME_DATA_TIMEOUT_MS
): Promise<StorefrontHomePayload> {
  const [newArrivals, featured, clearance, insights] = await Promise.all([
    withTimeout(getNewArrivals(NEW_ARRIVALS_LIMIT), timeoutMs, { data: [], error: null }),
    withTimeout(getFeaturedProducts(FEATURED_POOL), timeoutMs, { data: [], error: null }),
    withTimeout(getClearanceStorefrontProducts(CLEARANCE_LIMIT), timeoutMs, { data: [], error: null }),
    withTimeout(getRecentPublishedPosts(INSIGHTS_LIMIT), timeoutMs, []),
  ]);

  const featuredPool = [...(featured.data ?? [])];
  shuffleInPlace(featuredPool);

  return {
    newArrivals: newArrivals.data ?? [],
    featured: featuredPool.slice(0, FEATURED_SHOW),
    clearance: clearance.data ?? [],
    magazine: insights,
  };
}
