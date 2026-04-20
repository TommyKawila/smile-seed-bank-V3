import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { productDetailHref } from "@/lib/product-utils";
import { seedsBreederHref } from "@/lib/breeder-slug";

export const dynamic = "force-dynamic";

function shortStrainType(strainDominance: string | null | undefined): string | null {
  const sd = (strainDominance ?? "").trim();
  if (!sd) return null;
  const l = sd.toLowerCase();
  if (l.includes("hybrid") || l.includes("50/50")) return "Hybrid";
  if (l.includes("mostly sativa") || l === "sativa") return "Sativa";
  if (l.includes("mostly indica") || l === "indica") return "Indica";
  return null;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  /** Strip ILIKE wildcards so user input cannot broaden the pattern. */
  const q = raw.replace(/[%_\\]/g, " ").trim();
  if (q.length < 2) {
    return NextResponse.json({ products: [], breeders: [] });
  }
  if (q.length > 120) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const pattern = `%${q}%`;

  try {
    const supabase = await createClient();

    const [prodRes, breedRes] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, slug, thc_percent, strain_dominance, image_url, image_urls, product_images(id, url, variant_id, is_main, sort_order)"
        )
        .eq("is_active", true)
        .ilike("name", pattern)
        .order("name", { ascending: true })
        .limit(8),
      supabase
        .from("breeders")
        .select("id, name, logo_url")
        .eq("is_active", true)
        .ilike("name", pattern)
        .order("name", { ascending: true })
        .limit(8),
    ]);

    if (prodRes.error) {
      console.error("[search-suggest] products", prodRes.error);
    }
    if (breedRes.error) {
      console.error("[search-suggest] breeders", breedRes.error);
    }

    const productRows = prodRes.data ?? [];
    const breederRows = breedRes.data ?? [];

    const products = productRows.map((row) => {
      const thumb = getListingThumbnailUrl({
        image_url: row.image_url,
        image_urls: row.image_urls as unknown,
        product_images: row.product_images as unknown,
      });
      const thc =
        row.thc_percent != null && Number.isFinite(Number(row.thc_percent))
          ? Math.round(Number(row.thc_percent))
          : null;
      const st = shortStrainType(row.strain_dominance);
      return {
        id: row.id,
        name: row.name,
        href: productDetailHref({
          id: Number(row.id),
          slug: row.slug,
        }),
        thumb,
        thcPercent: thc,
        strainType: st,
      };
    });

    const breeders = breederRows.map((row) => ({
      id: row.id,
      name: row.name,
      href: seedsBreederHref({ name: row.name }),
      logoUrl: row.logo_url,
    }));

    return NextResponse.json({ products, breeders });
  } catch (e) {
    console.error("[search-suggest]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
