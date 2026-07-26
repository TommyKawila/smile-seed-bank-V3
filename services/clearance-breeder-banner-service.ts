import "server-only";

import { prisma } from "@/lib/prisma";
import { breederSlugFromName } from "@/lib/breeder-slug";
import { getListableClearanceCountsByBreeder } from "@/services/product-service";
import {
  CLEARANCE_DISCOUNT_PERCENT,
  type StorefrontClearanceBreederBox,
} from "@/lib/clearance";

export type { StorefrontClearanceBreederBox };

export type ClearanceBreederBannerAdmin = {
  id: number;
  breederId: number;
  breederName: string;
  logoUrl: string | null;
  imageUrl: string | null;
  titleTh: string;
  titleEn: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
};

export type ClearanceBreederBannerInput = {
  breederId: number;
  imageUrl?: string | null;
  titleTh?: string;
  titleEn?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

async function clearanceCountsByBreeder(): Promise<Map<number, number>> {
  return getListableClearanceCountsByBreeder();
}

export async function upsertClearanceBreederBanner(
  input: ClearanceBreederBannerInput
): Promise<ClearanceBreederBannerAdmin> {
  const breederId = BigInt(input.breederId);
  const breeder = await prisma.breeders.findUnique({
    where: { id: breederId },
    select: { id: true, name: true, logo_url: true },
  });
  if (!breeder) throw new Error("Breeder not found");

  const existing = await prisma.clearance_breeder_banners.findUnique({
    where: { breeder_id: breederId },
  });

  const maxSort = existing
    ? null
    : await prisma.clearance_breeder_banners.aggregate({ _max: { sort_order: true } });

  const row = await prisma.clearance_breeder_banners.upsert({
    where: { breeder_id: breederId },
    create: {
      breeder_id: breederId,
      image_url: input.imageUrl?.trim() ? input.imageUrl.trim() : null,
      title_th: input.titleTh?.trim() || breeder.name,
      title_en: input.titleEn?.trim() || null,
      sort_order: input.sortOrder ?? (maxSort?._max.sort_order ?? 0) + 1,
      is_active: input.isActive ?? true,
    },
    update: {
      ...(input.imageUrl !== undefined
        ? { image_url: input.imageUrl?.trim() ? input.imageUrl.trim() : null }
        : {}),
      ...(input.titleTh !== undefined ? { title_th: input.titleTh.trim() } : {}),
      ...(input.titleEn !== undefined
        ? { title_en: input.titleEn?.trim() || null }
        : {}),
      ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
    },
  });

  const counts = await clearanceCountsByBreeder();
  return {
    id: Number(row.id),
    breederId: Number(row.breeder_id),
    breederName: breeder.name,
    logoUrl: breeder.logo_url,
    imageUrl: row.image_url,
    titleTh: row.title_th,
    titleEn: row.title_en,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    productCount: counts.get(Number(row.breeder_id)) ?? 0,
  };
}

export async function reorderClearanceBreederBanners(
  orderedBreederIds: number[]
): Promise<void> {
  await prisma.$transaction(
    orderedBreederIds.map((breederId, index) =>
      prisma.clearance_breeder_banners.updateMany({
        where: { breeder_id: BigInt(breederId) },
        data: { sort_order: index },
      })
    )
  );
}

/** Active boxes for storefront: breeders with clearance SKUs, banner image or logo fallback. */
export async function getStorefrontClearanceBreederBoxes(): Promise<
  StorefrontClearanceBreederBox[]
> {
  const counts = await clearanceCountsByBreeder();
  if (counts.size === 0) return [];

  const breederIds = [...counts.keys()];
  const breeders = await prisma.breeders.findMany({
    where: { id: { in: breederIds.map((id) => BigInt(id)) } },
    select: { id: true, name: true, logo_url: true },
  });
  const breederMap = new Map(breeders.map((b) => [Number(b.id), b]));

  const banners = await prisma.clearance_breeder_banners.findMany({
    where: { breeder_id: { in: breederIds.map((id) => BigInt(id)) } },
  });
  const bannerMap = new Map(banners.map((b) => [Number(b.breeder_id), b]));

  const boxes: StorefrontClearanceBreederBox[] = [];
  for (const breederId of breederIds) {
    const breeder = breederMap.get(breederId);
    if (!breeder) continue;
    const banner = bannerMap.get(breederId);
    if (banner && !banner.is_active) continue;
    const imageUrl = banner?.image_url?.trim() || breeder.logo_url;
    boxes.push({
      breederId,
      name: breeder.name,
      slug: breederSlugFromName(breeder.name),
      logoUrl: breeder.logo_url,
      imageUrl: imageUrl ?? null,
      titleTh: banner?.title_th?.trim() || breeder.name,
      titleEn: banner?.title_en?.trim() || null,
      productCount: counts.get(breederId) ?? 0,
      discountPercent: CLEARANCE_DISCOUNT_PERCENT,
    });
  }

  boxes.sort((a, b) => {
    const ao = bannerMap.get(a.breederId)?.sort_order ?? 9999;
    const bo = bannerMap.get(b.breederId)?.sort_order ?? 9999;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  });

  return boxes;
}
