import { Suspense } from "react";
import { ShopSkeleton } from "@/components/skeletons/ShopSkeleton";
import { ShopPageClient } from "@/app/(storefront)/shop/ShopPageClient";
import { getActiveProducts } from "@/services/product-service";
import { bigintToJson } from "@/lib/bigint-json";
import { prisma } from "@/lib/prisma";
import { breederSlugFromName } from "@/lib/breeder-slug";
import type { ProductListItem } from "@/services/storefront-product-service";

const SHOP_INITIAL_PRODUCTS = 30;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveBreederIdFromSlug(slug: string | undefined): Promise<number | undefined> {
  const normalizedSlug = decodeURIComponent(slug ?? "").trim().toLowerCase();
  if (!normalizedSlug) return undefined;

  const breeders = await prisma.breeders.findMany({
    where: { is_active: true },
    select: { id: true, name: true },
  });
  const match = breeders.find(
    (breeder) => breederSlugFromName(breeder.name).toLowerCase() === normalizedSlug
  );
  return match ? Number(match.id) : undefined;
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params?: { breederSlug?: string | string[] };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const breederSlug = firstParam(params?.breederSlug);
  const breederId = await resolveBreederIdFromSlug(breederSlug);
  const category = firstParam(searchParams?.category)?.trim() || "";
  const search = firstParam(searchParams?.q)?.trim() || "";
  const ft = firstParam(searchParams?.ft)?.trim() || "";
  const catalog = await getActiveProducts({
    category: category || undefined,
    breeder_id: breederId,
    search: search || undefined,
    catalog_ft: ft || undefined,
    includeVariants: true,
    limit: SHOP_INITIAL_PRODUCTS,
    page: 1,
  }).catch(() => ({
    data: [] as ProductListItem[],
    error: "catalog_fetch_failed",
    catalogHasMore: false,
  }));
  const initialProducts = catalog.error
    ? []
    : (bigintToJson(catalog.data ?? []) as ProductListItem[]);

  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopPageClient initialProducts={initialProducts} />
    </Suspense>
  );
}
