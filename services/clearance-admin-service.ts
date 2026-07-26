import { createAdminClient } from "@/lib/supabase/server";
import { PRODUCT_KIND_MERCH, seedCatalogProductWhere } from "@/lib/product-kind";
import {
  CLEARANCE_DISCOUNT_PERCENT,
  clearancePriceFromList,
  type ClearanceBreederSummary,
} from "@/lib/clearance";
import { deriveClearanceSalePrice, computeTotalStock } from "@/lib/product-utils";
import { prisma } from "@/lib/prisma";
import {
  adminProductListInclude,
  serializeAdminProductForList,
} from "@/lib/serialize-admin-product-list";
import type { ProductFull } from "@/types/supabase";

export type { ClearanceBreederSummary };

export type ClearanceVariantPriceInput = {
  unit_label: string;
  clearance_price: number | null;
};

export async function listAdminClearanceProducts(): Promise<ProductFull[]> {
  const rows = await prisma.products.findMany({
    where: { is_clearance: true, ...seedCatalogProductWhere },
    orderBy: [{ id: "desc" }],
    include: adminProductListInclude,
  });
  return rows.map((p) => serializeAdminProductForList(p) as unknown as ProductFull);
}

export async function listClearanceBreederSummary(): Promise<ClearanceBreederSummary[]> {
  const products = await prisma.products.findMany({
    where: { is_clearance: true, ...seedCatalogProductWhere },
    select: {
      id: true,
      breeder_id: true,
      breeders: { select: { id: true, name: true, logo_url: true } },
    },
  });

  const counts = new Map<
    number,
    { name: string; logoUrl: string | null; productCount: number }
  >();

  for (const p of products) {
    const bid = p.breeder_id != null ? Number(p.breeder_id) : null;
    if (bid == null || !p.breeders) continue;
    const prev = counts.get(bid);
    if (prev) {
      prev.productCount += 1;
    } else {
      counts.set(bid, {
        name: p.breeders.name,
        logoUrl: p.breeders.logo_url,
        productCount: 1,
      });
    }
  }

  const banners = await prisma.clearance_breeder_banners.findMany({
    where: { breeder_id: { in: [...counts.keys()].map((id) => BigInt(id)) } },
  });
  const bannerByBreeder = new Map(
    banners.map((b) => [
      Number(b.breeder_id),
      {
        id: Number(b.id),
        imageUrl: b.image_url,
        titleTh: b.title_th,
        titleEn: b.title_en,
        sortOrder: b.sort_order,
        isActive: b.is_active,
      },
    ])
  );

  return [...counts.entries()]
    .map(([breederId, row]) => ({
      breederId,
      name: row.name,
      logoUrl: row.logoUrl,
      productCount: row.productCount,
      banner: bannerByBreeder.get(breederId) ?? null,
    }))
    .sort((a, b) => {
      const ao = a.banner?.sortOrder ?? 9999;
      const bo = b.banner?.sortOrder ?? 9999;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    });
}

async function productHasAvailableStock(productId: number): Promise<boolean> {
  const row = await prisma.products.findUnique({
    where: { id: BigInt(productId) },
    select: {
      stock: true,
      product_variants: {
        where: { is_active: { not: false } },
        select: { stock: true, is_active: true },
      },
    },
  });
  if (!row) return false;
  if (row.product_variants.length > 0) {
    return computeTotalStock(row.product_variants) > 0;
  }
  const legacy = Number(row.stock ?? 0);
  return Number.isFinite(legacy) && legacy > 0;
}

async function applyFixedClearancePrices(
  productId: number
): Promise<{ error: string | null; salePrice: number | null }> {
  const supabase = await createAdminClient();
  const { data: variants, error: fetchErr } = await supabase
    .from("product_variants")
    .select("id, price")
    .eq("product_id", productId);
  if (fetchErr) return { error: fetchErr.message, salePrice: null };

  const priced: { clearance_price: number | null }[] = [];
  for (const v of variants ?? []) {
    const cp = clearancePriceFromList(Number(v.price ?? 0));
    const clearance_price = cp > 0 ? cp : null;
    priced.push({ clearance_price });
    const { error } = await supabase
      .from("product_variants")
      .update({ clearance_price })
      .eq("id", v.id);
    if (error) return { error: error.message, salePrice: null };
  }

  const salePrice = deriveClearanceSalePrice(true, priced, null);
  const { error: syncErr } = await supabase
    .from("products")
    .update({
      is_clearance: true,
      sale_price: salePrice,
    })
    .eq("id", productId);
  if (syncErr) return { error: syncErr.message, salePrice: null };
  return { error: null, salePrice };
}

export async function addProductToClearance(
  productId: number
): Promise<{ error: string | null }> {
  const kindRow = await prisma.products.findUnique({
    where: { id: BigInt(productId) },
    select: { product_kind: true },
  });
  if (kindRow?.product_kind === PRODUCT_KIND_MERCH) {
    return { error: "สินค้า Merch ไม่สามารถเพิ่มใน Clearance ได้" };
  }
  if (!(await productHasAvailableStock(productId))) {
    return { error: "สินค้านี้หมดสต็อก — ไม่สามารถเพิ่มใน Clearance ได้" };
  }
  const applied = await applyFixedClearancePrices(productId);
  return { error: applied.error };
}

export async function addProductsToClearance(
  productIds: number[]
): Promise<{ error: string | null; added: number }> {
  const unique = [...new Set(productIds.filter((id) => Number.isFinite(id) && id > 0))];
  let added = 0;
  for (const id of unique) {
    const { error } = await addProductToClearance(id);
    if (error) return { error, added };
    added += 1;
  }
  return { error: null, added };
}

export async function removeProductFromClearance(
  productId: number
): Promise<{ error: string | null }> {
  try {
    await prisma.$transaction([
      prisma.products.update({
        where: { id: BigInt(productId) },
        data: { is_clearance: false, sale_price: null },
      }),
      prisma.product_variants.updateMany({
        where: { product_id: BigInt(productId) },
        data: { clearance_price: null },
      }),
    ]);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function removeProductsFromClearance(
  productIds: number[]
): Promise<{ error: string | null; removed: number }> {
  const unique = [...new Set(productIds.filter((id) => Number.isFinite(id) && id > 0))];
  let removed = 0;
  for (const id of unique) {
    const { error } = await removeProductFromClearance(id);
    if (error) return { error, removed };
    removed += 1;
  }
  return { error: null, removed };
}

/** Re-sync all clearance members to fixed % (e.g. after list price edits). */
export async function resyncAllClearancePrices(): Promise<{
  error: string | null;
  synced: number;
}> {
  const rows = await prisma.products.findMany({
    where: { is_clearance: true, ...seedCatalogProductWhere },
    select: { id: true },
  });
  let synced = 0;
  for (const row of rows) {
    const { error } = await applyFixedClearancePrices(Number(row.id));
    if (error) return { error, synced };
    synced += 1;
  }
  return { error: null, synced };
}

export async function updateClearanceVariantPrices(
  productId: number,
  variants: ClearanceVariantPriceInput[]
): Promise<{ error: string | null }> {
  void variants;
  const applied = await applyFixedClearancePrices(productId);
  return { error: applied.error };
}

export { CLEARANCE_DISCOUNT_PERCENT };
