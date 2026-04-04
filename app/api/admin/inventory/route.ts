import { NextRequest, NextResponse } from "next/server";
import { isAutofloweringDb, isPhotoFfDb, isPhotoperiodDb } from "@/lib/cannabis-attributes";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") ?? searchParams.get("category") ?? "";
  const typeFilter = searchParams.get("type") ?? "";
  const brandId = searchParams.get("brand") ?? "";
  const stockLevel = searchParams.get("stock") ?? "";

  const supabase = await createAdminClient();
  const { data: rows, error } = await supabase
    .from("product_variants")
    .select(`
      id,
      product_id,
      unit_label,
      sku,
      cost_price,
      price,
      stock,
      low_stock_threshold,
      is_active,
      products!inner (
        id,
        name,
        master_sku,
        image_url,
        image_urls,
        flowering_type,
        category,
        category_id,
        indica_ratio,
        sativa_ratio,
        thc_percent,
        breeder_id,
        breeders ( id, name )
      )
    `)
    .order("product_id", { ascending: true })
    .order("is_active", { ascending: false })
    .order("id", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = (typeof rows)[number] & { products: { breeders: { name: string } | null } };
  let list = (rows ?? []) as Row[];

  if (brandId) {
    list = list.filter((r) => String((r.products as { breeder_id?: number }).breeder_id) === brandId);
  }
  if (categoryId && categoryId !== "all") {
    const cid = categoryId;
    if (/^\d+$/.test(cid)) {
      list = list.filter((r) => String((r.products as { category_id?: number | null }).category_id) === cid);
    } else {
      list = list.filter((r) => (r.products as { flowering_type?: string }).flowering_type === cid);
    }
  }
  if (typeFilter) {
    list = list.filter((r) => {
      const p = r.products as { indica_ratio?: number; sativa_ratio?: number };
      const ind = p.indica_ratio ?? 0;
      const sat = p.sativa_ratio ?? 0;
      if (typeFilter === "Indica") return ind >= 60;
      if (typeFilter === "Sativa") return sat >= 60;
      if (typeFilter === "Hybrid") return ind > 0 && sat > 0 && ind < 60 && sat < 60;
      return true;
    });
  }
  if (stockLevel === "low") {
    list = list.filter((r) => {
      const th = (r as { low_stock_threshold?: number | null }).low_stock_threshold ?? 5;
      const s = r.stock ?? 0;
      return s > 0 && s <= th;
    });
  } else if (stockLevel === "out") {
    list = list.filter((r) => r.stock === 0);
  }

  const items = list.map((r) => {
    const p = r.products as {
      name: string;
      master_sku?: string | null;
      image_url?: string | null;
      image_urls?: unknown;
      flowering_type?: string;
      category?: string | null;
      breeders: { name: string } | null;
      indica_ratio?: number;
      sativa_ratio?: number;
      thc_percent?: number | null;
    };
    const primaryImg = Array.isArray(p.image_urls) && (p.image_urls as string[]).length > 0
      ? (p.image_urls as string[])[0]
      : p.image_url ?? null;
    const ind = p.indica_ratio ?? 0;
    const sat = p.sativa_ratio ?? 0;
    let typeLabel = "—";
    if (ind >= 60) typeLabel = "Indica";
    else if (sat >= 60) typeLabel = "Sativa";
    else if (ind > 0 || sat > 0) typeLabel = "Hybrid";
    return {
      id: r.id,
      product_id: r.product_id,
      product_name: p.name,
      image_url: primaryImg,
      master_sku: p.master_sku ?? null,
      brand: p.breeders?.name ?? "",
      breeder_id: (r.products as { breeder_id?: number }).breeder_id,
      unit_label: r.unit_label,
      sku: r.sku ?? null,
      stock: r.stock,
      low_stock_threshold: (r as { low_stock_threshold?: number | null }).low_stock_threshold ?? 5,
      cost_price: r.cost_price,
      price: r.price,
      margin: r.cost_price > 0 ? Math.round(((r.price - r.cost_price) / r.price) * 100) : 0,
      is_active: r.is_active,
      category:
        p.category ??
        (isAutofloweringDb(p.flowering_type)
          ? "Auto"
          : isPhotoFfDb(p.flowering_type)
            ? "Photo FF"
            : isPhotoperiodDb(p.flowering_type)
              ? "Photo"
              : p.flowering_type ?? "—"),
      type: typeLabel,
      thc_level: p.thc_percent != null ? `${p.thc_percent}%` : "—",
    };
  });

  return NextResponse.json(items);
}
