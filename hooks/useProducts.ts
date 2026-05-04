"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
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
import {
  createAdminProduct,
  fetchProductFull as fetchProductFullService,
  fetchProductsForCatalog,
  type CategoryFilterMode,
  type ProductListItem,
  type StrainDominance,
} from "@/services/storefront-product-service";

// Re-export so existing component imports keep working
export { ProductSchema, VariantSchema, type ProductFormData };
export type { CategoryFilterMode, ProductListItem };

// ─── Types ────────────────────────────────────────────────────────────────────

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
      const data = await fetchProductsForCatalog({
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
      });
      setProducts(data);
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
        return await fetchProductFullService(idOrSlug);
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

      try {
        const result = await createAdminProduct(formData);
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors);
          return null;
        }
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
