"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { computeStartingPrice, computeTotalStock, isLowStock } from "@/lib/product-utils";
import type { ProductVariant, ProductWithBreeder, ProductFull } from "@/types/supabase";
import {
  ProductSchema,
  VariantSchema,
  type ProductFormData,
} from "@/lib/validations/product";

// Re-export so existing component imports keep working
export { ProductSchema, VariantSchema, type ProductFormData };

type ProductListItem = ProductWithBreeder & { product_variants?: ProductVariant[] };

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseProductsOptions {
  category?: string;
  breeder_id?: number;
  limit?: number;
  autoFetch?: boolean;
  includeVariants?: boolean;
}

interface UseProductsReturn {
  products: ProductListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  fetchProductFull: (id: number) => Promise<ProductFull | null>;
  createProduct: (data: ProductFormData) => Promise<{ productId: number } | null>;
  validationErrors: z.ZodError | null;
  isSubmitting: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProducts(opts: UseProductsOptions = {}): UseProductsReturn {
  const { category, breeder_id, limit, autoFetch = true, includeVariants = false } = opts;

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
      const selectFields = includeVariants
        ? "*, breeders(id, name, logo_url), product_variants(*)"
        : "*, breeders(id, name, logo_url)";

      let query = supabase
        .from("products")
        .select(selectFields)
        .eq("is_active", true)
        .order("id", { ascending: false });

      if (category) query = query.eq("category", category);
      if (breeder_id) query = query.eq("breeder_id", breeder_id);
      if (limit) query = query.limit(limit);

      const { data, error: sbError } = await query;
      if (sbError) throw new Error(sbError.message);
      setProducts((data as ProductListItem[]) ?? []);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [category, breeder_id, limit, includeVariants]);

  useEffect(() => {
    if (autoFetch) fetchProducts();
  }, [autoFetch, fetchProducts]);

  // ── Fetch single product with variants (for product detail page) ──────────
  const fetchProductFull = useCallback(
    async (id: number): Promise<ProductFull | null> => {
      try {
        const supabase = createClient();
        const { data, error: sbError } = await supabase
          .from("products")
          .select("*, breeders(id, name, logo_url), product_variants(*)")
          .eq("id", id)
          .eq("is_active", true)
          .single();

        if (sbError || !data) return null;

        const product = data as ProductFull;
        // Show only active variants to storefront
        product.product_variants = product.product_variants.filter(
          (v) => v.is_active
        );
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
