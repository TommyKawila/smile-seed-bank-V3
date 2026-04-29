"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  PRODUCT_SELECT_WITH_BREEDER,
  PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS,
  type ProductVariantRow,
  type ProductWithBreeder,
} from "@/lib/supabase/types";
import {
  computeStartingPrice,
  computeTotalStock,
  getClearancePercentOff,
  getEffectiveListingPrice,
  getEffectiveVariantPrice,
  isLowStock,
} from "@/lib/product-utils";
import type { ProductFull } from "@/types/supabase";
import {
  ProductSchema,
  VariantSchema,
  type ProductFormData,
} from "@/lib/validations/product";
import { FLOWERING_DB_PHOTO_3N, FLOWERING_DB_PHOTO_PLAIN } from "@/lib/constants";

export type CategoryFilterMode = "fk" | "photo_3n" | "plain_photo";

// Re-export so existing component imports keep working
export { ProductSchema, VariantSchema, type ProductFormData };

export type ProductListItem = ProductWithBreeder & {
  product_variants?: ProductVariantRow[];
};

// ─── Types ────────────────────────────────────────────────────────────────────

type StrainDominance = "Mostly Indica" | "Mostly Sativa" | "Hybrid 50/50";

interface UseProductsOptions {
  category?: string;
  breeder_id?: number;
  categoryId?: string | number;
  /** Admin product list: plain Photo / Photoperiod category vs FK-only vs Photo 3N sentinel */
  categoryFilterMode?: CategoryFilterMode;
  strain_dominance?: StrainDominance | null;
  /** Admin: homepage carousel — only `is_featured` rows, ordered by priority */
  featuredOnly?: boolean;
  limit?: number;
  autoFetch?: boolean;
  includeVariants?: boolean;
  /** Admin: list inactive (off-catalog) products too */
  includeInactive?: boolean;
  sort?: "mixed_breeder" | "smart_deal";
}

interface UseProductsReturn {
  products: ProductListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  fetchProductFull: (idOrSlug: number | string) => Promise<ProductFull | null>;
  createProduct: (data: ProductFormData) => Promise<{ productId: number } | null>;
  validationErrors: z.ZodError | null;
  isSubmitting: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProducts(opts: UseProductsOptions = {}): UseProductsReturn {
  const {
    category,
    breeder_id,
    categoryId,
    categoryFilterMode,
    strain_dominance,
    featuredOnly,
    limit,
    autoFetch = true,
    includeVariants = false,
    includeInactive = false,
    sort,
  } = opts;

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<z.ZodError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!includeInactive && sort === "mixed_breeder") {
        const params = new URLSearchParams({
          sort: "mixed_breeder",
          limit: String(limit ?? 100),
        });
        const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
        const json = (await res.json()) as { products?: ProductListItem[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed to load products");
        setProducts(Array.isArray(json.products) ? json.products : []);
        return;
      }
      const supabase = createClient();
      // Branch select literals so PostgREST result types parse (no dynamic select string).
      let query = includeVariants
        ? supabase.from("products").select(PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS)
        : supabase.from("products").select(PRODUCT_SELECT_WITH_BREEDER);

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      if (featuredOnly) {
        query = query.eq("is_featured", true);
      }

      if (category) query = query.eq("category", category);
      if (breeder_id) query = query.eq("breeder_id", breeder_id);
      if (categoryId != null && categoryId !== "") {
        const cid = String(categoryId);
        if (cid === FLOWERING_DB_PHOTO_3N) {
          query = query.eq("flowering_type", FLOWERING_DB_PHOTO_3N);
        } else if (categoryFilterMode === "plain_photo") {
          const photoCatId = Number(cid);
          if (!Number.isNaN(photoCatId)) {
            const inList = FLOWERING_DB_PHOTO_PLAIN.join(",");
            query = query.or(
              `flowering_type.in.(${inList}),and(flowering_type.is.null,category_id.eq.${photoCatId})`
            );
          }
        } else {
          query = query.eq("category_id", Number(categoryId));
        }
      }
      if (strain_dominance) query = query.eq("strain_dominance", strain_dominance);

      if (featuredOnly) {
        query = query
          .order("featured_priority", { ascending: true, nullsFirst: false })
          .order("id", { ascending: false });
      } else {
        query = query.order("id", { ascending: false });
      }

      if (limit) query = query.limit(limit);

      const { data, error: sbError } = await query;
      if (sbError) throw new Error(sbError.message);
      setProducts((data ?? []) as ProductListItem[]);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [
    category,
    breeder_id,
    categoryId,
    categoryFilterMode,
    strain_dominance,
    featuredOnly,
    limit,
    includeVariants,
    includeInactive,
    sort,
  ]);

  useEffect(() => {
    if (autoFetch) fetchProducts();
  }, [autoFetch, fetchProducts]);

  // ── Fetch single product with variants (for product detail page) ──────────
  const fetchProductFull = useCallback(
    async (idOrSlug: number | string): Promise<ProductFull | null> => {
      try {
        const supabase = createClient();
        const isNumeric =
          typeof idOrSlug === "number" ||
          (typeof idOrSlug === "string" && /^\d+$/.test(String(idOrSlug).trim()));

        let q = supabase
          .from("products")
          .select(PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS)
          .eq("is_active", true);

        if (typeof idOrSlug === "number") {
          q = q.eq("id", idOrSlug);
        } else if (isNumeric) {
          q = q.eq("id", parseInt(String(idOrSlug).trim(), 10));
        } else {
          q = q.eq("slug", String(idOrSlug).trim());
        }

        const { data, error: sbError } = await q.single();

        if (sbError || !data) return null;

        const product = data as ProductFull;
        const variants = product.product_variants ?? [];
        product.product_variants = variants.filter((v) => v.is_active);
        return product;
      } catch {
        return null;
      }
    },
    []
  );

  // ── Create product — Zod validates BEFORE hitting the API ────────────────
  const createProduct = useCallback(
    async (formData: ProductFormData): Promise<{ productId: number } | null> => {
      setValidationErrors(null);
      setIsSubmitting(true);

      // Zod validation — ตรวจสอบข้อมูลก่อน submit ทุกครั้ง
      const parsed = ProductSchema.safeParse(formData);
      if (!parsed.success) {
        setValidationErrors(parsed.error);
        setIsSubmitting(false);
        return null;
      }

      try {
        // Call server-side API route (to be built in Phase 4)
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "สร้างสินค้าไม่สำเร็จ");
        }

        const result = await res.json();
        await fetchProducts(); // Refresh list after create
        return { productId: result.productId };
      } catch (err) {
        setError(String(err));
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchProducts]
  );

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
    fetchProductFull,
    createProduct,
    validationErrors,
    isSubmitting,
  };
}

// ─── Derived helpers (re-exported for components) ─────────────────────────────
export {
  computeStartingPrice,
  computeTotalStock,
  getClearancePercentOff,
  getEffectiveListingPrice,
  getEffectiveVariantPrice,
  isLowStock,
};
