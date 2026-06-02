import { createAdminClient } from "@/lib/supabase/server";
import { deriveClearanceSalePrice } from "@/lib/product-utils";
import { prisma } from "@/lib/prisma";
import { adminProductListInclude, serializeAdminProductForList } from "@/lib/serialize-admin-product-list";
import type { ProductFull } from "@/types/supabase";

export type ClearanceVariantPriceInput = {
  unit_label: string;
  clearance_price: number | null;
};

export async function listAdminClearanceProducts(): Promise<ProductFull[]> {
  const rows = await prisma.products.findMany({
    where: { is_clearance: true },
    orderBy: [{ id: "desc" }],
    include: adminProductListInclude,
  });
  return rows.map((p) => serializeAdminProductForList(p) as unknown as ProductFull);
}

export async function addProductToClearance(productId: number): Promise<{ error: string | null }> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ is_clearance: true })
    .eq("id", productId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function removeProductFromClearance(
  productId: number
): Promise<{ error: string | null }> {
  const supabase = await createAdminClient();
  const { error: productError } = await supabase
    .from("products")
    .update({ is_clearance: false, sale_price: null })
    .eq("id", productId);
  if (productError) return { error: productError.message };

  const { error: variantError } = await supabase
    .from("product_variants")
    .update({ clearance_price: null })
    .eq("product_id", productId);
  if (variantError) return { error: variantError.message };

  return { error: null };
}

export async function updateClearanceVariantPrices(
  productId: number,
  variants: ClearanceVariantPriceInput[]
): Promise<{ error: string | null }> {
  const supabase = await createAdminClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("product_variants")
    .select("id, unit_label, price")
    .eq("product_id", productId);
  if (fetchErr) return { error: fetchErr.message };

  const byLabel = new Map(
    (existing ?? []).map((v) => [String(v.unit_label).trim().toLowerCase(), v])
  );

  for (const row of variants) {
    const key = row.unit_label.trim().toLowerCase();
    const match = byLabel.get(key);
    if (!match) continue;
    const cp = row.clearance_price;
    const list = Number(match.price ?? 0);
    if (cp != null && cp > 0 && list > 0 && cp > list) {
      return { error: `ราคาเซลแพ็ก ${row.unit_label} ต้องไม่เกินราคาขาย` };
    }
    const { error } = await supabase
      .from("product_variants")
      .update({ clearance_price: cp != null && cp > 0 ? cp : null })
      .eq("id", match.id);
    if (error) return { error: error.message };
  }

  const { data: priced, error: pricedErr } = await supabase
    .from("product_variants")
    .select("clearance_price")
    .eq("product_id", productId);
  if (pricedErr) return { error: pricedErr.message };

  const salePrice = deriveClearanceSalePrice(
    true,
    (priced ?? []).map((v) => ({ clearance_price: v.clearance_price })),
    null
  );

  const { error: syncErr } = await supabase
    .from("products")
    .update({ is_clearance: true, sale_price: salePrice })
    .eq("id", productId);
  if (syncErr) return { error: syncErr.message };

  return { error: null };
}
