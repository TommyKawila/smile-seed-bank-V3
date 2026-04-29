import { NextResponse } from "next/server";
import { bigintToJson } from "@/lib/bigint-json";
import {
  getClearanceStorefrontProducts,
  getFeaturedProducts,
  getNewArrivals,
} from "@/services/product-service";
import { getRecentPublishedPosts } from "@/lib/blog-service";

export const dynamic = "force-dynamic";

const FEATURED_POOL = 10;
const FEATURED_SHOW = 5;
const CLEARANCE_LIMIT = 24;
const NEW_ARRIVALS_LIMIT = 8;
const INSIGHTS_LIMIT = 4;
const MAGAZINE_TIMEOUT_MS = 2000;

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

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET() {
  try {
    const [newArrivals, featured, clearance, insights] = await Promise.all([
      getNewArrivals(NEW_ARRIVALS_LIMIT),
      getFeaturedProducts(FEATURED_POOL),
      getClearanceStorefrontProducts(CLEARANCE_LIMIT),
      withTimeout(getRecentPublishedPosts(INSIGHTS_LIMIT), MAGAZINE_TIMEOUT_MS, []),
    ]);

    if (newArrivals.error || featured.error || clearance.error) {
      return NextResponse.json(
        {
          error:
            newArrivals.error ??
            featured.error ??
            clearance.error ??
            "Unable to load home data",
        },
        { status: 500 }
      );
    }

    const featuredPool = [...(featured.data ?? [])];
    shuffleInPlace(featuredPool);

    return NextResponse.json(
      bigintToJson({
        newArrivals: newArrivals.data ?? [],
        featured: featuredPool.slice(0, FEATURED_SHOW),
        clearance: clearance.data ?? [],
        magazine: insights,
      }),
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
