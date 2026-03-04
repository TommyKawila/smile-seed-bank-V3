import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? ""; // Photo | Auto
  const typeFilter = searchParams.get("type") ?? "";   // Indica | Sativa | Hybrid
  const brandId = searchParams.get("brand") ?? "";     // breeder_id
  const stockLevel = searchParams.get("stock") ?? "";  // all | low | out

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
      is_active,
      products!inner (
        id,
        name,
        flowering_type,
        category,
        indica_ratio,
        sativa_ratio,
        thc_percent,
        breeder_id,
        breeders ( id, name )
      )
    `)
    .eq("is_active", true)
    .order("product_id")
    .order("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = (typeof rows)[number] & { products: { breeders: { name: string } | null } };
  let list = (rows ?? []) as Row[];

  if (brandId) {
    list = list.filter((r) => String((r.products as { breeder_id?: number }).breeder_id) === brandId);
  }
  if (category) {
    list = list.filter((r) => (r.products as { flowering_type?: string }).flowering_type === category);
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
    list = list.filter((r) => r.stock > 0 && r.stock <= 5);
  } else if (stockLevel === "out") {
    list = list.filter((r) => r.stock === 0);
  }

  const items = list.map((r) => {
    const p = r.products as {
      name: string;
      flowering_type?: string;
      breeders: { name: string } | null;
      indica_ratio?: number;
      sativa_ratio?: number;
      thc_percent?: number | null;
    };
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
      brand: p.breeders?.name ?? "",
      breeder_id: (r.products as { breeder_id?: number }).breeder_id,
      unit_label: r.unit_label,
      sku: r.sku ?? null,
      stock: r.stock,
      cost_price: r.cost_price,
      price: r.price,
      margin: r.cost_price > 0 ? Math.round(((r.price - r.cost_price) / r.price) * 100) : 0,
      is_active: r.is_active,
      category: p.flowering_type === "AUTO" ? "Auto" : p.flowering_type === "PHOTO" ? "Photo" : p.flowering_type ?? "—",
      type: typeLabel,
      thc_level: p.thc_percent != null ? `${p.thc_percent}%` : "—",
    };
  });

  return NextResponse.json(items);
}
