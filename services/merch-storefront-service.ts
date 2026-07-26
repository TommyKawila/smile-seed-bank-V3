import "server-only";

import { prisma } from "@/lib/prisma";
import { breederSlugFromName } from "@/lib/breeder-slug";
import { PRODUCT_KIND_MERCH } from "@/lib/product-kind";
import {
  getMerchCategory,
  isMerchCategoryId,
  merchAccentForBreederId,
  type MerchBreederBox,
  type MerchCategoryId,
  type MerchStorefrontProduct,
} from "@/lib/merch-catalog";
import { resolveBreederBySlugFromCache } from "@/services/breeder-slug-resolve-service";

const merchProductSelect = {
  id: true,
  slug: true,
  name: true,
  description_th: true,
  description_en: true,
  image_url: true,
  merch_category: true,
  breeder_id: true,
  breeders: {
    select: {
      id: true,
      name: true,
      logo_url: true,
      summary_th: true,
      summary_en: true,
      specialty_th: true,
      specialty_en: true,
    },
  },
  product_variants: {
    where: { is_active: { not: false } },
    orderBy: { price: "asc" as const },
    select: { price: true, stock: true },
  },
} as const;

function minPriceFromVariants(
  variants: { price: { toNumber: () => number }; stock: number | null }[]
): number {
  const priced = variants.filter((v) => Number(v.stock ?? 0) >= 0);
  if (!priced.length) return 0;
  return Math.min(...priced.map((v) => v.price.toNumber()));
}

function mapStorefrontProduct(
  row: Awaited<ReturnType<typeof fetchMerchProducts>>[number]
): MerchStorefrontProduct | null {
  if (!row.breeders || !row.merch_category || !isMerchCategoryId(row.merch_category)) {
    return null;
  }
  const breederSlug = breederSlugFromName(row.breeders.name);
  const priceBaht = minPriceFromVariants(row.product_variants);
  return {
    id: String(row.id),
    slug: row.slug,
    breederSlug,
    categoryId: row.merch_category,
    nameTh: row.name,
    nameEn: row.name,
    priceBaht,
    blurbTh: row.description_th?.trim() || row.name,
    blurbEn: row.description_en?.trim() || row.name,
    accent: merchAccentForBreederId(Number(row.breeders.id)),
    imageUrl: row.image_url,
  };
}

async function fetchMerchProducts(where: {
  breeder_id?: bigint;
  merch_category?: string;
  is_active?: boolean;
}) {
  return prisma.products.findMany({
    where: {
      product_kind: PRODUCT_KIND_MERCH,
      is_active: where.is_active ?? true,
      ...(where.breeder_id != null ? { breeder_id: where.breeder_id } : {}),
      ...(where.merch_category != null
        ? { merch_category: where.merch_category }
        : {}),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    select: merchProductSelect,
  });
}

export async function getMerchBreederBoxes(): Promise<MerchBreederBox[]> {
  const rows = await prisma.products.findMany({
    where: { product_kind: PRODUCT_KIND_MERCH, is_active: true },
    select: {
      id: true,
      breeder_id: true,
      breeders: {
        select: {
          id: true,
          name: true,
          logo_url: true,
          summary_th: true,
          summary_en: true,
          specialty_th: true,
          specialty_en: true,
          is_active: true,
        },
      },
    },
  });

  const counts = new Map<
    number,
    {
      breederId: number;
      name: string;
      logoUrl: string | null;
      taglineTh: string;
      taglineEn: string;
      productCount: number;
    }
  >();

  for (const row of rows) {
    const b = row.breeders;
    if (!b || b.is_active === false || row.breeder_id == null) continue;
    const breederId = Number(b.id);
    const prev = counts.get(breederId);
    if (prev) {
      prev.productCount += 1;
    } else {
      counts.set(breederId, {
        breederId,
        name: b.name,
        logoUrl: b.logo_url,
        taglineTh: b.specialty_th?.trim() || b.summary_th?.trim() || b.name,
        taglineEn: b.specialty_en?.trim() || b.summary_en?.trim() || b.name,
        productCount: 1,
      });
    }
  }

  return [...counts.values()]
    .map((b) => ({
      breederId: b.breederId,
      slug: breederSlugFromName(b.name),
      name: b.name,
      taglineTh: b.taglineTh,
      taglineEn: b.taglineEn,
      accent: merchAccentForBreederId(b.breederId),
      logoUrl: b.logoUrl,
      productCount: b.productCount,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

export async function getMerchBreederBoxBySlug(
  slug: string | null
): Promise<MerchBreederBox | null> {
  if (!slug?.trim()) return null;
  const breeder = await resolveBreederBySlugFromCache(slug);
  if (!breeder) return null;
  const boxes = await getMerchBreederBoxes();
  return boxes.find((b) => b.breederId === breeder.id) ?? null;
}

export async function getMerchCategoryCountsForBreeder(
  breederId: number
): Promise<Record<MerchCategoryId, number>> {
  const rows = await prisma.products.groupBy({
    by: ["merch_category"],
    where: {
      product_kind: PRODUCT_KIND_MERCH,
      is_active: true,
      breeder_id: BigInt(breederId),
      merch_category: { not: null },
    },
    _count: { id: true },
  });

  const out: Record<MerchCategoryId, number> = {
    tees: 0,
    caps: 0,
    pins: 0,
    stickers: 0,
  };
  for (const row of rows) {
    if (row.merch_category && isMerchCategoryId(row.merch_category)) {
      out[row.merch_category] = row._count.id;
    }
  }
  return out;
}

export async function listMerchStorefrontProducts(
  breederId: number,
  categoryId: string
): Promise<MerchStorefrontProduct[]> {
  const category = getMerchCategory(categoryId);
  if (!category) return [];

  const rows = await fetchMerchProducts({
    breeder_id: BigInt(breederId),
    merch_category: category.id,
  });

  return rows
    .map(mapStorefrontProduct)
    .filter((p): p is MerchStorefrontProduct => p != null);
}

export { getMerchCategory, isMerchCategoryId };
