import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { computeStartingPrice, computeTotalStock } from "@/lib/product-utils";
import { toMasterSku, toVariantSku } from "@/lib/sku-utils";
import type { TablesInsert } from "@/lib/supabase/types";
import type { ProductVariant } from "@/types/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const breederId = body.breeder_id != null ? Number(body.breeder_id) : null;
  const categoryId = body.category_id != null && body.category_id !== "" ? Number(body.category_id) : null;
  const packs = Array.isArray(body.packs)
    ? body.packs
        .filter((p: { unit_label?: string }) => p?.unit_label)
        .map((p: { unit_label: string; cost_price?: number; price?: number; stock?: number }) => ({
          unit_label: String(p.unit_label).trim(),
          cost_price: Number(p.cost_price) || 0,
          price: Number(p.price) || 0,
          stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
        }))
    : [];

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "ชื่อสินค้าต้องมีอย่างน้อย 2 ตัวอักษร" }, { status: 400 });
  }
  if (breederId == null || isNaN(breederId)) {
    return NextResponse.json({ error: "กรุณาเลือกแบรนด์" }, { status: 400 });
  }
  if (categoryId == null || isNaN(categoryId)) {
    return NextResponse.json({ error: "กรุณาเลือก Category" }, { status: 400 });
  }

  let categoryName: string | null = null;
  try {
    const cat = await prisma.product_categories.findUnique({
      where: { id: BigInt(categoryId) },
      select: { name: true },
    });
    categoryName = cat?.name ?? null;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
  if (packs.length === 0) {
    return NextResponse.json({ error: "ต้องมีอย่างน้อย 1 แพ็กเกจ" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  const { data: breeder } = await supabase
    .from("breeders")
    .select("name")
    .eq("id", breederId)
    .single();

  const brandName = (breeder as { name?: string } | null)?.name ?? "SSB";
  const masterSku = toMasterSku(brandName, name);

  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("breeder_id", breederId)
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "มีสินค้าชื่อนี้ของแบรนด์นี้แล้ว (Master SKU ซ้ำ)" },
      { status: 409 }
    );
  }

  const productInsert: TablesInsert<"products"> = {
    breeder_id: breederId,
    name,
    master_sku: masterSku,
    category: categoryName,
    category_id: categoryId,
    is_active: true,
    price: 0,
    stock: 0,
    description_th: null,
    description_en: null,
    image_url: null,
    image_url_2: null,
    image_url_3: null,
    image_url_4: null,
    image_url_5: null,
    image_urls: null,
    video_url: null,
    thc_percent: null,
    cbd_percent: null,
    genetics: null,
    indica_ratio: null,
    sativa_ratio: null,
    seed_type: null,
    yield_info: null,
    growing_difficulty: null,
    effects: null,
    flavors: null,
    medical_benefits: null,
    genetic_ratio: null,
    sex_type: null,
    lineage: null,
    terpenes: null,
  };

  const { data: newProduct, error: productError } = await supabase
    .from("products")
    .insert(productInsert)
    .select("id")
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const productId = (newProduct as { id: number }).id;
  const variantRows = packs.map((p: { unit_label: string; cost_price: number; price: number; stock: number }) => ({
    product_id: productId,
    unit_label: p.unit_label,
    cost_price: p.cost_price,
    price: p.price,
    stock: p.stock,
    is_active: true,
    sku: toVariantSku(masterSku, p.unit_label),
  }));

  const { data: insertedVariants, error: variantError } = await supabase
    .from("product_variants")
    .insert(variantRows)
    .select();

  if (variantError) {
    await supabase.from("products").delete().eq("id", productId);
    return NextResponse.json({ error: variantError.message }, { status: 500 });
  }

  const startingPrice = computeStartingPrice((insertedVariants ?? []) as ProductVariant[]);
  const totalStock = computeTotalStock((insertedVariants ?? []) as ProductVariant[]);
  await supabase
    .from("products")
    .update({ price: startingPrice, stock: totalStock })
    .eq("id", productId);

  return NextResponse.json({
    productId,
    master_sku: masterSku,
    variant_count: variantRows.length,
  });
}
