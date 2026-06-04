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

/** Filter sidebar counts — attribute fields + pack labels only. */
export const PRODUCT_SELECT_FILTER_COUNT =
  "id, strain_dominance, sativa_ratio, indica_ratio, genetic_ratio, genetics, growing_difficulty, thc_percent, cbd_percent, seed_type, flowering_type, category, product_categories(id, name), product_variants(unit_label, is_active)";

/** Shop grid: slim variants (no full `*`) — faster catalog / filter scans. */
export const PRODUCT_SELECT_CATALOG_LIST =
  "id, slug, name, price, stock, is_active, sale_price, is_clearance, is_featured, created_at, is_pinned_new_arrival, new_arrival_priority, strain_dominance, genetic_ratio, genetics, thc_percent, cbd_percent, indica_ratio, sativa_ratio, breeder_id, image_urls, image_url, category, flowering_type, seed_type, growing_difficulty, yield_info, pack_buckets, description_th, description_en, breeders(id, name, logo_url), product_categories(id, name), product_variants(id, unit_label, price, stock, is_active, discount_percent, discount_ends_at, clearance_price)";
