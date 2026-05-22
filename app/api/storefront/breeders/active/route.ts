import { NextResponse } from "next/server";
import { listActiveBreedersForStorefront } from "@/services/storefront-breeder-catalog-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public: active breeders for navbar catalog (no Supabase JS on storefront). */
export async function GET() {
  try {
    const breeders = await listActiveBreedersForStorefront();
    return NextResponse.json(
      { breeders },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
        },
      },
    );
  } catch (e) {
    console.error("GET /api/storefront/breeders/active", e);
    return NextResponse.json(
      { breeders: [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  }
}
