import "server-only";

import { PRODUCT_KIND_MERCH, seedCatalogProductWhere } from "@/lib/product-kind";
import { computeTotalStock } from "@/lib/product-utils";
import { prisma } from "@/lib/prisma";
import {
  adminProductListInclude,
  serializeAdminProductForList,
} from "@/lib/serialize-admin-product-list";
import type { NewSeedsBreederSummary } from "@/lib/new-seeds";
import type { ProductFull } from "@/types/supabase";

export type { NewSeedsBreederSummary };

export async function listAdminNewSeedsProducts(): Promise<ProductFull[]> {
  const rows = await prisma.products.findMany({
    where: { is_pinned_new_arrival: true, ...seedCatalogProductWhere },
    orderBy: [
      { new_arrival_priority: "desc" },
      { created_at: "desc" },
      { id: "desc" },
    ],
    include: adminProductListInclude,
  });
  return rows.map((p) => serializeAdminProductForList(p) as unknown as ProductFull);
}

export async function listNewSeedsBreederSummary(): Promise<NewSeedsBreederSummary[]> {
  const products = await prisma.products.findMany({
    where: { is_pinned_new_arrival: true, ...seedCatalogProductWhere },
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

  const banners = await prisma.new_seeds_breeder_banners.findMany({
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

export async function addProductToNewSeeds(
  productId: number
): Promise<{ error: string | null }> {
  const kindRow = await prisma.products.findUnique({
    where: { id: BigInt(productId) },
    select: { product_kind: true },
  });
  if (kindRow?.product_kind === PRODUCT_KIND_MERCH) {
    return { error: "สินค้า Merch ไม่สามารถเพิ่มใน New Seeds ได้" };
  }
  if (!(await productHasAvailableStock(productId))) {
    return { error: "สินค้านี้หมดสต็อก — ไม่สามารถเพิ่มใน New Seeds ได้" };
  }
  try {
    const max = await prisma.products.aggregate({
      where: { is_pinned_new_arrival: true, ...seedCatalogProductWhere },
      _max: { new_arrival_priority: true },
    });
    const nextPriority = (max._max.new_arrival_priority ?? 0) + 1;
    await prisma.products.update({
      where: { id: BigInt(productId) },
      data: {
        is_pinned_new_arrival: true,
        new_arrival_priority: nextPriority,
      },
    });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function addProductsToNewSeeds(
  productIds: number[]
): Promise<{ error: string | null; added: number }> {
  const unique = [...new Set(productIds.filter((id) => Number.isFinite(id) && id > 0))];
  let added = 0;
  for (const id of unique) {
    const existing = await prisma.products.findUnique({
      where: { id: BigInt(id) },
      select: { is_pinned_new_arrival: true },
    });
    if (existing?.is_pinned_new_arrival) {
      added += 1;
      continue;
    }
    const { error } = await addProductToNewSeeds(id);
    if (error) return { error, added };
    added += 1;
  }
  return { error: null, added };
}

export async function removeProductFromNewSeeds(
  productId: number
): Promise<{ error: string | null }> {
  try {
    await prisma.products.update({
      where: { id: BigInt(productId) },
      data: { is_pinned_new_arrival: false, new_arrival_priority: 0 },
    });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function removeProductsFromNewSeeds(
  productIds: number[]
): Promise<{ error: string | null; removed: number }> {
  const unique = [...new Set(productIds.filter((id) => Number.isFinite(id) && id > 0))];
  let removed = 0;
  for (const id of unique) {
    const { error } = await removeProductFromNewSeeds(id);
    if (error) return { error, removed };
    removed += 1;
  }
  return { error: null, removed };
}

/** Reorder pinned list: first id = highest priority. */
export async function reorderNewSeedsProducts(
  orderedProductIds: number[]
): Promise<{ error: string | null }> {
  const ids = orderedProductIds.filter((id) => Number.isFinite(id) && id > 0);
  if (ids.length === 0) return { error: null };
  try {
    const n = ids.length;
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.products.update({
          where: { id: BigInt(id) },
          data: {
            is_pinned_new_arrival: true,
            new_arrival_priority: n - index,
          },
        })
      )
    );
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function setNewSeedsPriority(
  productId: number,
  priority: number
): Promise<{ error: string | null }> {
  const p = Math.max(0, Math.min(9999, Math.floor(priority)));
  try {
    await prisma.products.update({
      where: { id: BigInt(productId) },
      data: {
        is_pinned_new_arrival: true,
        new_arrival_priority: p,
      },
    });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
