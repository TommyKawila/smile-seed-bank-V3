import { NextResponse } from "next/server";
import {
  getActiveProducts,
  getClearanceStorefrontProducts,
  getFeaturedProducts,
} from "@/services/product-service";
import { getRecentPublishedPosts } from "@/lib/blog-service";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const FEATURED_POOL = 10;
const FEATURED_SHOW = 5;
const CLEARANCE_LIMIT = 24;
const NEW_ARRIVALS_LIMIT = 10;
const INSIGHTS_LIMIT = 4;

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

function productCardReadyProducts(
  products: ProductWithBreederAndVariants[] | null
): ProductWithBreederAndVariants[] {
  return (products ?? []).map((product) => {
    const productId = Number(product.id);
    const flatImages = [product.image_url, product.image_url_2, product.image_url_3]
      .filter((url): url is string => Boolean(url?.trim()))
      .map((url, index) => ({
        id: productId * 10 + index,
        url,
        variant_id: null,
        is_main: index === 0,
        sort_order: index,
      }));
    const productImages =
      Array.isArray(product.product_images) && product.product_images.length > 0
        ? product.product_images
        : flatImages;
    const productVariants =
      Array.isArray(product.product_variants) && product.product_variants.length > 0
        ? product.product_variants
        : ([
            {
              id: productId,
              product_id: productId,
              unit_label: "1 Seed",
              cost_price: null,
              price: Number(product.price ?? 0),
              stock: Number(product.stock ?? 0),
              is_active: true,
              low_stock_threshold: 5,
              sku: product.master_sku ?? null,
              created_at: product.created_at ?? null,
            },
          ] as ProductWithBreederAndVariants["product_variants"]);

    return {
      ...product,
      product_variants: productVariants,
      product_images: productImages,
    };
  });
}

export async function GET() {
  try {
    let [newArrivals, featured, clearance, insights] = await Promise.all([
      getActiveProducts({
        limit: NEW_ARRIVALS_LIMIT,
        includeVariants: true,
        sort: "newest",
      }),
      getFeaturedProducts(FEATURED_POOL),
      getClearanceStorefrontProducts(CLEARANCE_LIMIT),
      getRecentPublishedPosts(INSIGHTS_LIMIT),
    ]);

    if (newArrivals.error || (newArrivals.data ?? []).length === 0) {
      console.warn("[api/storefront/home] newArrivals empty/error; falling back", {
        error: newArrivals.error,
      });
      newArrivals = await getActiveProducts({
        limit: NEW_ARRIVALS_LIMIT,
        includeVariants: true,
      });
    }

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
      {
        newArrivals: productCardReadyProducts(
          (newArrivals.data ?? []) as ProductWithBreederAndVariants[]
        ),
        featured: featuredPool.slice(0, FEATURED_SHOW),
        clearance: clearance.data ?? [],
        magazine: insights,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
