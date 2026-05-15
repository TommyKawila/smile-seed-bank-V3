import type { ProductWithBreeder, ProductWithBreederAndVariants } from "@/lib/supabase/types";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { getRecentPublishedPosts } from "@/lib/blog-service";
import { withTimeout } from "@/lib/timeout";
import {
  HOME_FEATURED_POOL,
  HOME_FEATURED_SHOW,
  HOME_STOREFRONT_HOME_API_SECTION_LIMIT,
} from "@/lib/constants";
import {
  getClearanceStorefrontProducts,
  getFeaturedProducts,
  getNewArrivals,
} from "@/services/product-service";

/**
 * Homepage JSON payload — magazine via `getRecentPublishedPosts` → Prisma
 * `MAGAZINE_PUBLIC_POST_SELECT` (excludes `content`, `content_en`, `raw_input`, AI columns).
 * Products via `product-service` slim selects (no descriptions).
 */
export type StorefrontHomePayload = {
  newArrivals: ProductWithBreederAndVariants[];
  featured: ProductWithBreeder[];
  clearance: ProductWithBreederAndVariants[];
  magazine: MagazinePostPublic[];
};

type RawHomePayload = Partial<StorefrontHomePayload> & {
  data?: ProductWithBreederAndVariants[];
};

/** SSR/home shell only: four empty arrays — no strings/objects (client fills via `/api/storefront/home`). */
export const EMPTY_STOREFRONT_HOME_PAYLOAD: StorefrontHomePayload = {
  newArrivals: [],
  featured: [],
  clearance: [],
  magazine: [],
};

const HOME_API_LIMIT = HOME_STOREFRONT_HOME_API_SECTION_LIMIT;
const HOME_DATA_TIMEOUT_MS = 8000;

/** Drop redundant `image_urls` JSON when `product_images` is populated (smaller wire payload). */
function omitImageUrlsWhenGalleryPresent<
  T extends { product_images?: unknown; image_urls?: unknown },
>(row: T): T {
  const imgs = row.product_images;
  if (Array.isArray(imgs) && imgs.length > 0 && row.image_urls != null) {
    const { image_urls: _omit, ...rest } = row;
    return rest as T;
  }
  return row;
}

function compactHomeProducts<T extends { product_images?: unknown; image_urls?: unknown }>(
  rows: T[]
): T[] {
  return rows.map(omitImageUrlsWhenGalleryPresent);
}

function compactHomePayload(payload: StorefrontHomePayload): StorefrontHomePayload {
  return {
    newArrivals: compactHomeProducts(payload.newArrivals),
    featured: compactHomeProducts(payload.featured),
    clearance: compactHomeProducts(payload.clearance),
    magazine: payload.magazine,
  };
}

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

  return compactHomePayload({
    newArrivals: Array.isArray(newArrivals) ? newArrivals.slice(0, HOME_API_LIMIT) : [],
    featured: !Array.isArray(result) && Array.isArray(result.featured) ? result.featured : [],
    clearance: !Array.isArray(result) && Array.isArray(result.clearance) ? result.clearance : [],
    magazine: !Array.isArray(result) && Array.isArray(result.magazine) ? result.magazine : [],
  });
}

export async function getStorefrontHomePayload(
  timeoutMs = HOME_DATA_TIMEOUT_MS
): Promise<StorefrontHomePayload> {
  const [newArrivals, featured, clearance, insights] = await Promise.all([
    withTimeout(getNewArrivals(HOME_API_LIMIT), timeoutMs, { data: [], error: null }),
    withTimeout(getFeaturedProducts(HOME_FEATURED_POOL), timeoutMs, { data: [], error: null }),
    withTimeout(getClearanceStorefrontProducts(HOME_API_LIMIT), timeoutMs, { data: [], error: null }),
    withTimeout(getRecentPublishedPosts(HOME_API_LIMIT), timeoutMs, []),
  ]);

  const featuredPool = [...(featured.data ?? [])];
  shuffleInPlace(featuredPool);

  return compactHomePayload({
    newArrivals: (newArrivals.data ?? []).slice(0, HOME_API_LIMIT),
    featured: featuredPool.slice(0, Math.min(HOME_FEATURED_SHOW, HOME_API_LIMIT)),
    clearance: (clearance.data ?? []).slice(0, HOME_API_LIMIT),
    magazine: insights.slice(0, HOME_API_LIMIT),
  });
}
