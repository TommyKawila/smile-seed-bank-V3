import { createAdminClient } from "@/lib/supabase/server";
import { PRODUCT_KIND_MERCH, seedCatalogProductWhere } from "@/lib/product-kind";
import {
  CLEARANCE_DISCOUNT_PERCENT,
  clearancePriceFromList,
  normalizeClearanceDiscountPercent,
  type ClearanceBreederSummary,
  type ClearanceDiscountPercent,
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

export type ClearancePackSelection = {
  productId: number;
  variantIds: number[];
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

async function syncProductClearanceFlags(
  productId: number,
  percent: ClearanceDiscountPercent | null
): Promise<{ error: string | null; salePrice: number | null; isClearance: boolean }> {
  const supabase = await createAdminClient();
  const { data: variants, error: fetchErr } = await supabase
    .from("product_variants")
    .select("id, clearance_price")
    .eq("product_id", productId);
  if (fetchErr) return { error: fetchErr.message, salePrice: null, isClearance: false };

  const priced = (variants ?? []).map((v) => ({
    clearance_price:
      v.clearance_price != null && Number(v.clearance_price) > 0
        ? Number(v.clearance_price)
        : null,
  }));
  const hasAny = priced.some((v) => v.clearance_price != null && v.clearance_price > 0);
  const salePrice = deriveClearanceSalePrice(hasAny, priced, null);

  const { error: syncErr } = await supabase
    .from("products")
    .update(
      hasAny
        ? {
            is_clearance: true,
            sale_price: salePrice,
            clearance_discount_percent: normalizeClearanceDiscountPercent(
              percent ?? CLEARANCE_DISCOUNT_PERCENT
            ),
          }
        : {
            is_clearance: false,
            sale_price: null,
            clearance_discount_percent: null,
          }
    )
    .eq("id", productId);
  if (syncErr) return { error: syncErr.message, salePrice: null, isClearance: false };
  return { error: null, salePrice, isClearance: hasAny };
}

/**
 * Write clearance_price from list using `percent`.
 * - With `variantIds`: price only those packs (leave others untouched).
 * - Without: reprice only packs that already have clearance_price > 0 (resync / change %).
 */
async function applyFixedClearancePrices(
  productId: number,
  percent: ClearanceDiscountPercent,
  variantIds?: number[]
): Promise<{ error: string | null; salePrice: number | null }> {
  const pct = normalizeClearanceDiscountPercent(percent);
  const supabase = await createAdminClient();
  const { data: variants, error: fetchErr } = await supabase
    .from("product_variants")
    .select("id, price, clearance_price")
    .eq("product_id", productId);
  if (fetchErr) return { error: fetchErr.message, salePrice: null };

  const idFilter =
    variantIds != null
      ? new Set(variantIds.filter((id) => Number.isFinite(id) && id > 0))
      : null;

  if (idFilter && idFilter.size === 0) {
    return { error: "เลือกแพ็กอย่างน้อย 1 รายการ", salePrice: null };
  }

  for (const v of variants ?? []) {
    const vid = Number(v.id);
    const alreadyOn = Number(v.clearance_price ?? 0) > 0;
    const shouldWrite = idFilter ? idFilter.has(vid) : alreadyOn;
    if (!shouldWrite) continue;

    const cp = clearancePriceFromList(Number(v.price ?? 0), pct);
    const clearance_price = cp > 0 ? cp : null;
    const { error } = await supabase
      .from("product_variants")
      .update({ clearance_price })
      .eq("id", v.id);
    if (error) return { error: error.message, salePrice: null };
  }

  const synced = await syncProductClearanceFlags(productId, pct);
  return { error: synced.error, salePrice: synced.salePrice };
}

export async function addProductToClearance(
  productId: number,
  discountPercent: ClearanceDiscountPercent = CLEARANCE_DISCOUNT_PERCENT,
  variantIds?: number[]
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

  const pct = normalizeClearanceDiscountPercent(discountPercent);

  let ids = variantIds?.filter((id) => Number.isFinite(id) && id > 0) ?? [];
  if (ids.length === 0) {
    const all = await prisma.product_variants.findMany({
      where: { product_id: BigInt(productId), is_active: { not: false } },
      select: { id: true },
    });
    if (all.length === 0) {
      return { error: "สินค้านี้ไม่มีแพ็กให้เพิ่มใน Clearance" };
    }
    if (all.length > 1) {
      return { error: "สินค้ามีหลายแพ็ก — เลือกแพ็กที่ต้องการใส่ Clearance" };
    }
    ids = [Number(all[0]!.id)];
  }

  const applied = await applyFixedClearancePrices(productId, pct, ids);
  return { error: applied.error };
}

export async function addProductsToClearance(
  productIds: number[],
  discountPercent: ClearanceDiscountPercent = CLEARANCE_DISCOUNT_PERCENT
): Promise<{ error: string | null; added: number }> {
  const unique = [...new Set(productIds.filter((id) => Number.isFinite(id) && id > 0))];
  const pct = normalizeClearanceDiscountPercent(discountPercent);
  let added = 0;
  for (const id of unique) {
    const { error } = await addProductToClearance(id, pct);
    if (error) return { error, added };
    added += 1;
  }
  return { error: null, added };
}

export async function addClearanceSelections(
  selections: ClearancePackSelection[],
  discountPercent: ClearanceDiscountPercent = CLEARANCE_DISCOUNT_PERCENT
): Promise<{ error: string | null; added: number }> {
  const pct = normalizeClearanceDiscountPercent(discountPercent);
  const byProduct = new Map<number, Set<number>>();
  for (const sel of selections) {
    const pid = Number(sel.productId);
    if (!Number.isFinite(pid) || pid <= 0) continue;
    const set = byProduct.get(pid) ?? new Set<number>();
    for (const vid of sel.variantIds ?? []) {
      if (Number.isFinite(vid) && vid > 0) set.add(Number(vid));
    }
    if (set.size > 0) byProduct.set(pid, set);
  }
  if (byProduct.size === 0) {
    return { error: "เลือกแพ็กอย่างน้อย 1 รายการ", added: 0 };
  }

  let added = 0;
  for (const [productId, vids] of byProduct) {
    const { error } = await addProductToClearance(productId, pct, [...vids]);
    if (error) return { error, added };
    added += vids.size;
  }
  return { error: null, added };
}

/** Rewrite clearance_price for packs already on Clearance (same product %). */
export async function setClearanceProductDiscountPercent(
  productId: number,
  discountPercent: ClearanceDiscountPercent
): Promise<{ error: string | null }> {
  const pct = normalizeClearanceDiscountPercent(discountPercent);
  const row = await prisma.products.findUnique({
    where: { id: BigInt(productId) },
    select: { is_clearance: true },
  });
  if (row?.is_clearance !== true) {
    return { error: "สินค้านี้ไม่อยู่ใน Clearance" };
  }
  const applied = await applyFixedClearancePrices(productId, pct);
  return { error: applied.error };
}

export async function removeProductFromClearance(
  productId: number
): Promise<{ error: string | null }> {
  try {
    await prisma.$transaction([
      prisma.products.update({
        where: { id: BigInt(productId) },
        data: {
          is_clearance: false,
          sale_price: null,
          clearance_discount_percent: null,
        },
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

export async function removeVariantsFromClearance(
  variantIds: number[]
): Promise<{ error: string | null; removed: number }> {
  const unique = [...new Set(variantIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (unique.length === 0) return { error: "เลือกแพ็กที่ต้องการนำออกก่อน", removed: 0 };

  try {
    const rows = await prisma.product_variants.findMany({
      where: { id: { in: unique.map((id) => BigInt(id)) } },
      select: { id: true, product_id: true },
    });
    if (rows.length === 0) return { error: null, removed: 0 };

    await prisma.product_variants.updateMany({
      where: { id: { in: rows.map((r) => r.id) } },
      data: { clearance_price: null },
    });

    const productIds = [...new Set(rows.map((r) => Number(r.product_id)))];
    for (const productId of productIds) {
      const pctRow = await prisma.products.findUnique({
        where: { id: BigInt(productId) },
        select: { clearance_discount_percent: true },
      });
      const synced = await syncProductClearanceFlags(
        productId,
        pctRow?.clearance_discount_percent != null
          ? normalizeClearanceDiscountPercent(pctRow.clearance_discount_percent)
          : null
      );
      if (synced.error) return { error: synced.error, removed: 0 };
    }
    return { error: null, removed: rows.length };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err), removed: 0 };
  }
}

/**
 * Re-sync clearance prices using each product's stored clearance_discount_percent.
 * Only packs that already have clearance_price are rewritten.
 */
export async function resyncAllClearancePrices(): Promise<{
  error: string | null;
  synced: number;
}> {
  const rows = await prisma.products.findMany({
    where: { is_clearance: true, ...seedCatalogProductWhere },
    select: { id: true, clearance_discount_percent: true },
  });
  let synced = 0;
  for (const row of rows) {
    const pct = normalizeClearanceDiscountPercent(row.clearance_discount_percent);
    const { error } = await applyFixedClearancePrices(Number(row.id), pct);
    if (error) return { error, synced };
    synced += 1;
  }
  return { error: null, synced };
}

/** Re-sync one product using its stored percent (or explicit override). */
export async function updateClearanceVariantPrices(
  productId: number,
  variants: ClearanceVariantPriceInput[],
  discountPercent?: ClearanceDiscountPercent
): Promise<{ error: string | null }> {
  void variants;
  const pct =
    discountPercent != null
      ? normalizeClearanceDiscountPercent(discountPercent)
      : normalizeClearanceDiscountPercent(
          (
            await prisma.products.findUnique({
              where: { id: BigInt(productId) },
              select: { clearance_discount_percent: true },
            })
          )?.clearance_discount_percent
        );
  const applied = await applyFixedClearancePrices(productId, pct);
  return { error: applied.error };
}

export { CLEARANCE_DISCOUNT_PERCENT };
