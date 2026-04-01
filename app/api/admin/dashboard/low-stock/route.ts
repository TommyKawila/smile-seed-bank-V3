import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createAdminClient();
  const { data: rows, error } = await supabase
    .from("product_variants")
    .select(`
      id,
      stock,
      sku,
      unit_label,
      product_id,
      products!inner ( id, name, master_sku, breeder_id, breeders ( name ) )
    `)
    .eq("is_active", true)
    .lte("stock", 5)
    .order("stock", { ascending: true })
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (rows ?? []).map((r) => ({
    stock: r.stock ?? 0,
    sku: r.sku ?? "—",
    unit_label: r.unit_label,
    product_name: r.products?.name ?? "—",
    master_sku: (r.products as { master_sku?: string | null })?.master_sku ?? "—",
    brand: (r.products as { breeders?: { name: string } | null })?.breeders?.name ?? "—",
  }));

  return NextResponse.json(items);
}
