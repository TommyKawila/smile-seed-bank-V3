import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  PRODUCT_SELECT_WITH_BREEDER,
  PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS,
  type ProductVariantRow,
  type ProductWithBreeder,
} from "@/lib/supabase/types";
import { FLOWERING_DB_PHOTO_3N, FLOWERING_DB_PHOTO_PLAIN } from "@/lib/constants";
import { buildProductCatalogSearchOrFilter } from "@/lib/product-catalog-search";
import { ProductSchema, type ProductFormData } from "@/lib/validations/product";
import type { ProductFull } from "@/types/supabase";
import { getVariantFinalPrice, normalizeDiscountPercent } from "@/lib/product-utils";

export type CategoryFilterMode = "fk" | "photo_3n" | "plain_photo";
export type ProductListItem = ProductWithBreeder & {
  product_variants?: (ProductVariantRow & { final_price: number })[];
};
export type StrainDominance = "Mostly Indica" | "Mostly Sativa" | "Hybrid 50/50";

export interface ProductQueryOptions {
  category?: string;
  /** Case-insensitive catalog search (matches name, category, description TH/EN). */
  search?: string;
  breeder_id?: number;
  categoryId?: string | number;
  categoryFilterMode?: CategoryFilterMode;
  strain_dominance?: StrainDominance | null;
  featuredOnly?: boolean;
  limit?: number;
  includeVariants?: boolean;
  includeInactive?: boolean;
  sort?: "mixed_breeder" | "smart_deal";
}

export async function getStorefrontProducts(
  opts: ProductQueryOptions = {}
): Promise<ProductListItem[]> {
  return fetchProductsForCatalog({
    ...opts,
    includeVariants: opts.includeVariants ?? true,
  });
}

export async function fetchProductsForCatalog(opts: ProductQueryOptions): Promise<ProductListItem[]> {
  const {
    category,
    search,
    breeder_id,
    categoryId,
    categoryFilterMode,
    strain_dominance,
    featuredOnly,
    limit,
    includeVariants = false,
    includeInactive = false,
    sort,
  } = opts;

  if (!includeInactive && sort === "mixed_breeder") {
    const params = new URLSearchParams({
      sort: "mixed_breeder",
      limit: String(limit ?? 100),
    });
    const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
    const json = (await res.json()) as { products?: ProductListItem[]; error?: string };
    if (!res.ok) throw new Error(json.error ?? "Failed to load products");
    return Array.isArray(json.products) ? json.products : [];
  }

  const supabase = createClient();
  let query = includeVariants
    ? supabase.from("products").select(PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS)
    : supabase.from("products").select(PRODUCT_SELECT_WITH_BREEDER);

  if (!includeInactive) query = query.eq("is_active", true);
  if (featuredOnly) query = query.eq("is_featured", true);
  if (category) query = query.eq("category", category);
  const catalogSearchOr = search?.trim() ? buildProductCatalogSearchOrFilter(search.trim()) : null;
  if (catalogSearchOr) query = query.or(catalogSearchOr);
  if (breeder_id != null) query = query.eq("breeder_id", breeder_id);
  if (categoryId != null && categoryId !== "") {
    const cid = String(categoryId);
    if (cid === FLOWERING_DB_PHOTO_3N) {
      query = query.eq("flowering_type", FLOWERING_DB_PHOTO_3N);
    } else if (categoryFilterMode === "plain_photo") {
      const photoCatId = Number(cid);
      if (!Number.isNaN(photoCatId)) {
        query = query.or(
          `flowering_type.in.(${FLOWERING_DB_PHOTO_PLAIN.join(",")}),and(flowering_type.is.null,category_id.eq.${photoCatId})`
        );
      }
    } else {
      query = query.eq("category_id", Number(categoryId));
    }
  }
  if (strain_dominance) query = query.eq("strain_dominance", strain_dominance);

  query = featuredOnly
    ? query.order("featured_priority", { ascending: true, nullsFirst: false }).order("id", { ascending: false })
    : query.order("id", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return applyDirectDiscounts((data ?? []) as ProductListItem[]);
}

function applyDirectDiscounts(rows: ProductListItem[]): ProductListItem[] {
  return rows.map((product) => ({
    ...product,
    product_variants: product.product_variants?.map((variant) => {
      const discount_percent = normalizeDiscountPercent(variant.discount_percent);
      return {
        ...variant,
        discount_percent,
        final_price: getVariantFinalPrice({
          ...variant,
          discount_percent,
          discount_ends_at: variant.discount_ends_at ?? null,
        }),
      };
    }),
  }));
}

export async function fetchProductFull(idOrSlug: number | string): Promise<ProductFull | null> {
  const supabase = createClient();
  const isNumeric =
    typeof idOrSlug === "number" ||
    (typeof idOrSlug === "string" && /^\d+$/.test(String(idOrSlug).trim()));

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS)
    .eq("is_active", true);

  if (typeof idOrSlug === "number") query = query.eq("id", idOrSlug);
  else if (isNumeric) query = query.eq("id", parseInt(String(idOrSlug).trim(), 10));
  else query = query.eq("slug", String(idOrSlug).trim());

  const { data, error } = await query.single();
  if (error || !data) return null;

  const product = data as ProductFull;
  product.product_variants = (product.product_variants ?? []).filter((v) => v.is_active);
  product.product_variants = product.product_variants.map((variant) => {
    const discount_percent = normalizeDiscountPercent(variant.discount_percent);
    return {
      ...variant,
      discount_percent,
      final_price: getVariantFinalPrice({
        ...variant,
        discount_percent,
        discount_ends_at: variant.discount_ends_at ?? null,
      }),
    };
  });
  return product;
}

export async function createAdminProduct(
  formData: ProductFormData
): Promise<{ productId: number; validationErrors: null } | { productId: null; validationErrors: z.ZodError }> {
  const parsed = ProductSchema.safeParse(formData);
  if (!parsed.success) return { productId: null, validationErrors: parsed.error };

  const res = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "สร้างสินค้าไม่สำเร็จ");
  }
  const result = (await res.json()) as { productId: number };
  return { productId: result.productId, validationErrors: null };
}
