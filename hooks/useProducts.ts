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
import { computeStartingPrice, computeTotalStock, isLowStock } from "@/lib/product-utils";
import type { ProductFull } from "@/types/supabase";
import {
  ProductSchema,
  VariantSchema,
  type ProductFormData,
} from "@/lib/validations/product";

// Re-export so existing component imports keep working
export { ProductSchema, VariantSchema, type ProductFormData };

type ProductListItem = ProductWithBreeder & { product_variants?: ProductVariantRow[] };

// ─── Types ────────────────────────────────────────────────────────────────────

type StrainDominance = "Mostly Indica" | "Mostly Sativa" | "Hybrid 50/50";

interface UseProductsOptions {
  category?: string;
  breeder_id?: number;
  categoryId?: string | number;
  strain_dominance?: StrainDominance | null;
  limit?: number;
  autoFetch?: boolean;
  includeVariants?: boolean;
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
  const { category, breeder_id, categoryId, strain_dominance, limit, autoFetch = true, includeVariants = false } = opts;

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<z.ZodError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      // Branch select literals so PostgREST result types parse (no dynamic select string).
      let query = includeVariants
        ? supabase
            .from("products")
            .select(PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS)
            .eq("is_active", true)
            .order("id", { ascending: false })
        : supabase
            .from("products")
            .select(PRODUCT_SELECT_WITH_BREEDER)
            .eq("is_active", true)
            .order("id", { ascending: false });

      if (category) query = query.eq("category", category);
      if (breeder_id) query = query.eq("breeder_id", breeder_id);
      if (categoryId != null && categoryId !== "") query = query.eq("category_id", Number(categoryId));
      if (strain_dominance) query = query.eq("strain_dominance", strain_dominance);
      if (limit) query = query.limit(limit);

      const { data, error: sbError } = await query;
      if (sbError) throw new Error(sbError.message);
      setProducts((data ?? []) as ProductListItem[]);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [category, breeder_id, categoryId, strain_dominance, limit, includeVariants]);

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
export { computeStartingPrice, computeTotalStock, isLowStock };
