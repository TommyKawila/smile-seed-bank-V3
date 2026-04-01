import type { Database } from "@/types/database.types";

export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type ProductRow = TableRow<"products">;
export type ProductVariantRow = TableRow<"product_variants">;
export type BreederRow = TableRow<"breeders">;

/** Shape returned by `.select('breeders(id, name, logo_url)')` */
export type BreederListEmbed = Pick<BreederRow, "id" | "name" | "logo_url">;

/** `.select('*, breeders(id, name, logo_url)')` */
export type ProductWithBreeder = ProductRow & {
  breeders: BreederListEmbed | null;
};

/** `.select('*, breeders(id, name, logo_url), product_variants(*)')` */
export type ProductWithBreederAndVariants = ProductWithBreeder & {
  product_variants: ProductVariantRow[] | null;
};

/** Keep as plain `string` so PostgREST `.select()` infers fields (avoids ParserError with `as const`). */
export const PRODUCT_SELECT_WITH_BREEDER = "*, breeders(id, name, logo_url)";

export const PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS =
  "*, breeders(id, name, logo_url), product_variants(*)";
