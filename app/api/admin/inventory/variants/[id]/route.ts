import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { computeStartingPrice, computeTotalStock } from "@/lib/product-utils";
import type { ProductVariant } from "@/types/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid variant ID" }, { status: 400 });

  const body = await req.json();
  const updates: { stock?: number; cost_price?: number; price?: number } = {};
  if (typeof body.stock === "number") updates.stock = body.stock;
  if (typeof body.cost_price === "number") updates.cost_price = body.cost_price;
  if (typeof body.price === "number") updates.price = body.price;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data: variant, error: updErr } = await supabase
    .from("product_variants")
    .update(updates)
    .eq("id", id)
    .select("product_id")
    .single();

  if (updErr || !variant) {
    return NextResponse.json({ error: updErr?.message ?? "Variant not found" }, { status: 500 });
  }
  if (variant.product_id == null) {
    return NextResponse.json({ id });
  }

  const { data: allVariants, error: listErr } = await supabase
    .from("product_variants")
    .select("id, price, stock, is_active")
    .eq("product_id", variant.product_id);

  if (listErr || !allVariants?.length) {
    return NextResponse.json({ id });
  }

  const normalizedVariants: ProductVariant[] = allVariants.map((v) => ({
    id: v.id,
    product_id: variant.product_id,
    unit_label: "",
    price: Number(v.price ?? 0),
    cost_price: null,
    stock: v.stock ?? 0,
    is_active: v.is_active ?? true,
  }));
  const startingPrice = computeStartingPrice(normalizedVariants);
  const totalStock = computeTotalStock(normalizedVariants);
  await supabase
    .from("products")
    .update({ price: startingPrice, stock: totalStock })
    .eq("id", variant.product_id);

  return NextResponse.json({ id });
}
