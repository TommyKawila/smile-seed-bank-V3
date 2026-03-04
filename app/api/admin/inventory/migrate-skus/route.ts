import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { toMasterSku, toVariantSku } from "@/lib/sku-utils";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createAdminClient();

  const { data: products, error: fetchErr } = await supabase
    .from("products")
    .select("id, name, breeder_id, breeders(name), product_variants(id, unit_label)")
    .order("id");

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!products?.length) {
    return NextResponse.json({ updated_products: 0, updated_variants: 0 });
  }

  let updatedProducts = 0;
  let updatedVariants = 0;

  for (const row of products as { id: number; name: string; breeders: { name: string } | null; product_variants: { id: number; unit_label: string }[] }[]) {
    const breederName = row.breeders?.name ?? "SSB";
    const newMasterSku = toMasterSku(breederName, row.name);

    const { error: productUpd } = await supabase
      .from("products")
      .update({ master_sku: newMasterSku })
      .eq("id", row.id);

    if (productUpd) {
      return NextResponse.json(
        { error: `Product ${row.id} (${row.name}): ${productUpd.message}`, updated_products: updatedProducts, updated_variants: updatedVariants },
        { status: 500 }
      );
    }
    updatedProducts += 1;

    for (const v of row.product_variants ?? []) {
      const newSku = toVariantSku(newMasterSku, v.unit_label);
      const { error: variantUpd } = await supabase
        .from("product_variants")
        .update({ sku: newSku })
        .eq("id", v.id);

      if (variantUpd) {
        return NextResponse.json(
          { error: `Variant ${v.id}: ${variantUpd.message}`, updated_products: updatedProducts, updated_variants: updatedVariants },
          { status: 500 }
        );
      }
      updatedVariants += 1;
    }
  }

  return NextResponse.json({ updated_products: updatedProducts, updated_variants: updatedVariants });
}
