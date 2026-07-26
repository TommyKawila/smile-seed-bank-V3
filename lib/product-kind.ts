import type { Prisma } from "@prisma/client";

export const PRODUCT_KIND_SEED = "seed" as const;
export const PRODUCT_KIND_MERCH = "merch" as const;

export type ProductKind = typeof PRODUCT_KIND_SEED | typeof PRODUCT_KIND_MERCH;

export const seedCatalogProductWhere = {
  NOT: { product_kind: PRODUCT_KIND_MERCH },
} satisfies Prisma.productsWhereInput;

export function isMerchProduct(row: { product_kind?: string | null }): boolean {
  return row.product_kind === PRODUCT_KIND_MERCH;
}
