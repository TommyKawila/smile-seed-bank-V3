import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json([]);

  const supabase = await createAdminClient();
  const term = `%${q}%`;

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, master_sku, breeders ( id, name )")
    .or(`name.ilike.${term},master_sku.ilike.${term}`)
    .eq("is_active", true)
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!products?.length) return NextResponse.json([]);

  const productIds = products.map((p: { id: number }) => p.id);
  const { data: variants, error: vErr } = await supabase
    .from("product_variants")
    .select("id, product_id, unit_label, sku, price, cost_price, stock")
    .in("product_id", productIds)
    .eq("is_active", true);

  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });

  type ProdRow = { id: number; name: string; master_sku: string | null; breeders: { name: string } | null };
  type VarRow = { id: number; product_id: number; unit_label: string; sku: string | null; price: number; cost_price: number; stock: number };

  const map = new Map<number, { id: number; name: string; master_sku: string | null; brand: string; variants: VarRow[] }>();
  for (const p of products as ProdRow[]) {
    map.set(p.id, { id: p.id, name: p.name, master_sku: p.master_sku ?? null, brand: p.breeders?.name ?? "", variants: [] });
  }
  for (const v of (variants ?? []) as VarRow[]) {
    map.get(v.product_id)?.variants.push(v);
  }

  return NextResponse.json(Array.from(map.values()).filter((e) => e.variants.length > 0));
}
