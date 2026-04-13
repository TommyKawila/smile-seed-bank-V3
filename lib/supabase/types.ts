import type { Database } from "@/types/database.types";

export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type ProductRow = TableRow<"products">;
export type ProductVariantRow = TableRow<"product_variants">;
export type BreederRow = TableRow<"breeders">;
export type ProductCategoryRow = TableRow<"product_categories">;

/** Shape returned by `.select('product_categories(id, name)')` */
export type ProductCategoryEmbed = Pick<ProductCategoryRow, "id" | "name">;

/** Shape returned by `.select('breeders(id, name, logo_url)')` */
export type BreederListEmbed = Pick<BreederRow, "id" | "name" | "logo_url">;

/** `.select('*, breeders(...), product_categories(...)')` */
export type ProductWithBreeder = ProductRow & {
  breeders: BreederListEmbed | null;
  product_categories: ProductCategoryEmbed | null;
  product_images?: ProductImageRow[] | null;
};

/** Embedded `product_images` from PostgREST */
export type ProductImageRow = {
  id: number;
  url: string;
  variant_id: number | null;
  is_main: boolean;
  sort_order: number;
};

/** `.select('*, breeders(...), product_categories(...), product_variants(*)')` */
export type ProductWithBreederAndVariants = ProductWithBreeder & {
  product_variants: ProductVariantRow[] | null;
  product_images?: ProductImageRow[] | null;
};

/** Keep as plain `string` so PostgREST `.select()` infers fields (avoids ParserError with `as const`). */
export const PRODUCT_SELECT_WITH_BREEDER =
  "*, breeders(id, name, logo_url), product_categories(id, name), product_images(id,url,variant_id,is_main,sort_order)";

export const PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS =
  "*, breeders(id, name, logo_url), product_categories(id, name), product_variants(*), product_images(id,url,variant_id,is_main,sort_order)";
