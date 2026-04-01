import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  PRODUCT_SELECT_WITH_BREEDER,
  PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS,
} from "@/lib/supabase/types";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  computeStartingPrice,
  computeTotalStock,
  generateSlug,
  isLowStock,
  resolveProductSlugFromName,
} from "@/lib/product-utils";
import type {
  Product,
  ProductVariant,
  ProductFull,
  ProductWithBreeder,
} from "@/types/supabase";

export { computeStartingPrice, computeTotalStock, isLowStock };

type ServiceResult<T> = { data: T | null; error: string | null };

function parseNumericProductIdParam(s: string): number | null {
  const t = s.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isSafeInteger(n) || n < 1) return null;
  return n;
}

function normalizeProductFullRow(data: ProductFull): ProductFull {
  const variants = data.product_variants ?? [];
  data.product_variants = variants.filter((v) => v.is_active);
  return data;
}

// ─── Storefront Queries ───────────────────────────────────────────────────────

export async function getActiveProducts(opts?: {
  category?: string;
  breeder_id?: number;
  limit?: number;
}): Promise<ServiceResult<ProductWithBreeder[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT_WITH_BREEDER)
      .eq("is_active", true)
      .order("id", { ascending: false });

    if (opts?.category) query = query.eq("category", opts.category);
    if (opts?.breeder_id) query = query.eq("breeder_id", opts.breeder_id);
    if (opts?.limit) query = query.limit(opts.limit);

    const { data, error } = await query;

    if (error) return { data: null, error: error.message };
    return { data: data as ProductWithBreeder[], error: null };
  } catch (err) {
    logger.error("product-service.getActiveProducts failed", {
      cause: err,
      context: { opts },
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Storefront: match `slug` first, then numeric `id` for legacy `/product/123` links. */
export async function getProductBySlug(
  slug: string
): Promise<ServiceResult<ProductFull>> {
  try {
    const supabase = await createClient();
    const trimmed = slug.trim();
    if (!trimmed) {
      return { data: null, error: "Missing slug" };
    }

    const { data: bySlug, error: slugErr } = await supabase
      .from("products")
      .select(PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS)
      .eq("slug", trimmed)
      .eq("is_active", true)
      .maybeSingle();

    if (slugErr) return { data: null, error: slugErr.message };

    if (bySlug) {
      return { data: normalizeProductFullRow(bySlug as ProductFull), error: null };
    }

    const numericId = parseNumericProductIdParam(trimmed);
    if (numericId == null) {
      return { data: null, error: "Not found" };
    }

    const { data: byId, error: idErr } = await supabase
      .from("products")
      .select(PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS)
      .eq("id", numericId)
      .eq("is_active", true)
      .maybeSingle();

    if (idErr) return { data: null, error: idErr.message };
    if (!byId) {
      return { data: null, error: "Not found" };
    }

    return { data: normalizeProductFullRow(byId as ProductFull), error: null };
  } catch (err) {
    logger.error("product-service.getProductBySlug failed", {
      cause: err,
      context: { slug },
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getProductFull(
  productId: number
): Promise<ServiceResult<ProductFull>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS)
      .eq("id", productId)
      .eq("is_active", true)
      .single();

    if (error) return { data: null, error: error.message };

    return { data: normalizeProductFullRow(data as ProductFull), error: null };
  } catch (err) {
    logger.error("product-service.getProductFull failed", {
      cause: err,
      context: { productId },
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Admin Queries ────────────────────────────────────────────────────────────

export async function getAllProductsAdmin(): Promise<
  ServiceResult<ProductFull[]>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS)
      .order("id", { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data as ProductFull[], error: null };
  } catch (err) {
    logger.error("product-service.getAllProductsAdmin failed", { cause: err });
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Resolves slug collisions against `products.slug` (unique). */
export async function ensureUniqueProductSlug(
  baseSlug: string,
  excludeProductId?: number
): Promise<string> {
  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const base = baseSlug.trim().slice(0, 180) || "p";
  let candidate = base;
  for (let i = 0; i < 100; i++) {
    const { data: row } = await db
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!row) return candidate;
    if (excludeProductId != null && Number(row.id) === excludeProductId) {
      return candidate;
    }
    candidate = `${base}-${i + 2}`.slice(0, 180);
  }
  return `${base}-${Date.now()}`.slice(0, 180);
}

export async function createProductWithVariants(
  product: Omit<Product, "id" | "price" | "stock">,
  variants: Omit<ProductVariant, "id" | "product_id">[]
): Promise<ServiceResult<{ productId: number }>> {
  try {
    // Use admin client to bypass RLS — this runs in a server API route
    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { slug: incomingSlug, ...rest } = product as Omit<
      Product,
      "id" | "price" | "stock"
    > & { slug?: string | null };
    const resolvedBase = resolveProductSlugFromName(product.name, incomingSlug);
    const slug = await ensureUniqueProductSlug(resolvedBase);

    // Step 1: Insert parent product
    const { data: newProduct, error: productError } = await db
      .from("products")
      .insert({ ...rest, slug, price: 0, stock: 0 })
      .select("id")
      .single();

    if (productError) return { data: null, error: productError.message };

    const productId = (newProduct as { id: number }).id;

    // Step 2: Insert child variants
    const variantRows = variants.map((v) => ({ ...v, product_id: productId }));
    const { data: insertedVariants, error: variantError } = await db
      .from("product_variants")
      .insert(variantRows)
      .select();

    if (variantError) return { data: null, error: variantError.message };

    // Step 3: Recalculate and sync price & stock onto parent product
    const startingPrice = computeStartingPrice(insertedVariants as ProductVariant[]);
    const totalStock = computeTotalStock(insertedVariants as ProductVariant[]);

    await db
      .from("products")
      .update({ price: startingPrice, stock: totalStock })
      .eq("id", productId);

    return { data: { productId }, error: null };
  } catch (err) {
    logger.error("product-service.createProductWithVariants failed", {
      cause: err,
      context: {
        productName: product.name,
        variantCount: variants.length,
      },
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function syncProductStats(productId: number): Promise<void> {
  try {
    const supabase = await createAdminClient();

    const { data: variants } = await supabase
      .from("product_variants")
      .select("price, stock, is_active")
      .eq("product_id", productId);

    if (!variants) return;

    const startingPrice = computeStartingPrice(variants as ProductVariant[]);
    const totalStock = computeTotalStock(variants as ProductVariant[]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("products")
      .update({ price: startingPrice, stock: totalStock })
      .eq("id", productId);
  } catch (err) {
    logger.error("product-service.syncProductStats failed", {
      cause: err,
      context: { productId },
    });
  }
}

/** One-time: fill `slug` for rows missing it (admin / script). */
export async function backfillProductSlugs(): Promise<
  ServiceResult<{ updated: number }>
> {
  try {
    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: nullSlugs, error: e1 } = await db
      .from("products")
      .select("id, name, slug")
      .is("slug", null);
    const { data: emptySlugs, error: e2 } = await db
      .from("products")
      .select("id, name, slug")
      .eq("slug", "");
    const err = e1 ?? e2;
    if (err) return { data: null, error: err.message };

    const seen = new Set<number>();
    const rows: { id: number; name: string; slug: string | null }[] = [];
    for (const r of nullSlugs ?? []) {
      const id = Number((r as { id: number }).id);
      if (!seen.has(id)) {
        seen.add(id);
        rows.push(r as { id: number; name: string; slug: string | null });
      }
    }
    for (const r of emptySlugs ?? []) {
      const id = Number((r as { id: number }).id);
      if (!seen.has(id)) {
        seen.add(id);
        rows.push(r as { id: number; name: string; slug: string | null });
      }
    }

    let updated = 0;
    for (const row of rows) {
      const id = row.id;
      const name = String(row.name ?? "");

      const base = resolveProductSlugFromName(name, null);
      const slug = await ensureUniqueProductSlug(base, id);
      const { error: upErr } = await db
        .from("products")
        .update({ slug })
        .eq("id", id);
      if (!upErr) updated++;
    }
    return { data: { updated }, error: null };
  } catch (err) {
    logger.error("product-service.backfillProductSlugs failed", { cause: err });
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Prisma backfill: set `slug` from `generateSlug(name)` where `slug` is null (collision-safe). */
export async function backfillProductSlugsWithPrisma(): Promise<
  ServiceResult<{ updated: number }>
> {
  try {
    const rows = await prisma.products.findMany({
      where: { slug: null },
      select: { id: true, name: true },
    });

    let updated = 0;
    for (const row of rows) {
      let base = generateSlug(row.name);
      if (!base) base = `p-${row.id.toString()}`;
      base = base.slice(0, 180);

      let candidate = base;
      let wrote = false;
      for (let i = 0; i < 100; i++) {
        const clash = await prisma.products.findFirst({
          where: { slug: candidate, NOT: { id: row.id } },
          select: { id: true },
        });
        if (!clash) {
          await prisma.products.update({
            where: { id: row.id },
            data: { slug: candidate },
          });
          updated++;
          wrote = true;
          break;
        }
        candidate = `${base}-${i + 2}`.slice(0, 180);
      }
      if (!wrote) {
        const fallback = `p-${row.id.toString()}`.slice(0, 180);
        await prisma.products.update({
          where: { id: row.id },
          data: { slug: fallback },
        });
        updated++;
      }
    }
    return { data: { updated }, error: null };
  } catch (err) {
    logger.error("product-service.backfillProductSlugsWithPrisma failed", {
      cause: err,
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
