import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { computeStartingPrice, computeTotalStock } from "@/lib/product-utils";
import { toMasterSku, toVariantSku } from "@/lib/sku-utils";
import type { ProductVariant } from "@/types/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const productId = body.product_id != null ? Number(body.product_id) : null;
  const unitLabel = body.unit_label ?? "1 Seed";
  const costPrice = Number(body.cost_price) ?? 0;
  const price = Number(body.price) ?? 0;
  const stock = Number(body.stock) ?? 0;

  if (!productId || isNaN(productId)) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id, name, breeders(name)")
    .eq("id", productId)
    .single();

  if (prodErr || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const brandName = (product as { breeders?: { name: string } | null }).breeders?.name ?? "SSB";
  const productName = (product as { name: string }).name;
  const generatedSku = toVariantSku(toMasterSku(brandName, productName), unitLabel);

  const insertRow = {
    product_id: productId,
    unit_label: unitLabel,
    cost_price: costPrice,
    price,
    stock,
    is_active: true,
    sku: generatedSku,
  };

  const { data: inserted, error: insErr } = await supabase
    .from("product_variants")
    .insert(insertRow)
    .select()
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const { data: allVariants } = await supabase
    .from("product_variants")
    .select("id, price, stock, is_active")
    .eq("product_id", productId);

  if (allVariants?.length) {
    const startingPrice = computeStartingPrice(allVariants as ProductVariant[]);
    const totalStock = computeTotalStock(allVariants as ProductVariant[]);
    await supabase.from("products").update({ price: startingPrice, stock: totalStock }).eq("id", productId);
  }

  return NextResponse.json({ ...inserted, generated_sku: generatedSku });
}
