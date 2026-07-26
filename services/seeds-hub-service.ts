import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { breederSlugFromName } from "@/lib/breeder-slug";
import { seedsHubFacetFallback, type SeedsHubPayload } from "@/lib/seeds-hub";
import { listActiveBreedersForStorefront } from "@/services/storefront-breeder-catalog-service";

async function safeCount(where: Prisma.productsWhereInput): Promise<number | null> {
  try {
    return await prisma.products.count({ where });
  } catch {
    return null;
  }
}

async function loadBreederBoxes(): Promise<SeedsHubPayload["breeders"]> {
  const [breeders, grouped] = await Promise.all([
    listActiveBreedersForStorefront(),
    prisma.products
      .groupBy({
        by: ["breeder_id"],
        where: { is_active: true, breeder_id: { not: null } },
        _count: { id: true },
      })
      .catch(() => [] as { breeder_id: bigint | null; _count: { id: number } }[]),
  ]);

  const countByBreeder = new Map<number, number>();
  for (const g of grouped) {
    if (g.breeder_id == null) continue;
    countByBreeder.set(Number(g.breeder_id), g._count.id);
  }

  const withCounts = breeders
    .map((b) => ({
      breederId: Number(b.id),
      name: b.name,
      slug: breederSlugFromName(b.name),
      logoUrl: b.logo_url,
      productCount: countByBreeder.get(Number(b.id)) ?? 0,
    }))
    .filter((b) => b.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name));

  if (withCounts.length > 0) return withCounts;

  // Fallback: show active breeders even if counts failed / all zero
  return breeders
    .map((b) => ({
      breederId: Number(b.id),
      name: b.name,
      slug: breederSlugFromName(b.name),
      logoUrl: b.logo_url,
      productCount: countByBreeder.get(Number(b.id)) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function loadFacetCounts(): Promise<
  Pick<SeedsHubPayload, "flowering" | "genetics">
> {
  const base = seedsHubFacetFallback();
  const active = { is_active: true as const };

  const [autoCount, photoCount, sativaCount, indicaCount, hybridCount] =
    await Promise.all([
      safeCount({ ...active, flowering_type: "autoflower" }),
      safeCount({
        ...active,
        flowering_type: { in: ["photoperiod", "photo"] },
      }),
      safeCount({ ...active, strain_dominance: "Mostly Sativa" }),
      safeCount({ ...active, strain_dominance: "Mostly Indica" }),
      safeCount({
        ...active,
        OR: [
          { strain_dominance: { contains: "Hybrid", mode: "insensitive" } },
          { genetics: { contains: "hybrid", mode: "insensitive" } },
        ],
      }),
    ]);

  return {
    flowering: base.flowering.map((box) => ({
      ...box,
      productCount:
        box.id === "auto" ? autoCount : box.id === "photo" ? photoCount : null,
    })),
    genetics: base.genetics.map((box) => ({
      ...box,
      productCount:
        box.id === "sativa"
          ? sativaCount
          : box.id === "indica"
            ? indicaCount
            : box.id === "hybrid"
              ? hybridCount
              : null,
    })),
  };
}

/** Active breeders with product counts + flowering/genetics facet counts for Seeds Hub. */
export async function getSeedsHubPayload(): Promise<SeedsHubPayload> {
  const facets = seedsHubFacetFallback();
  try {
    const [breeders, facetCounts] = await Promise.all([
      loadBreederBoxes(),
      loadFacetCounts().catch(() => facets),
    ]);
    return {
      breeders,
      flowering: facetCounts.flowering,
      genetics: facetCounts.genetics,
    };
  } catch {
    try {
      const breeders = await loadBreederBoxes();
      return { breeders, flowering: facets.flowering, genetics: facets.genetics };
    } catch {
      return { breeders: [], flowering: facets.flowering, genetics: facets.genetics };
    }
  }
}

/** Lightweight path for hub timeout — breeders only. */
export async function getSeedsHubBreedersOnly(): Promise<SeedsHubPayload["breeders"]> {
  try {
    return await loadBreederBoxes();
  } catch {
    return [];
  }
}
