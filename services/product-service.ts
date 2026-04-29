import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  PRODUCT_SELECT_WITH_BREEDER,
  PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS,
  type ProductWithBreederAndVariants,
} from "@/lib/supabase/types";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  computeStartingPrice,
  computeTotalStock,
  generateSlug,
  getEffectiveListingPrice,
  getStartingVariant,
  getStartingVariantLabel,
  isLowStock,
  resolveProductSlugFromName,
} from "@/lib/product-utils";
import { parseListParam, productMatchesSeedsPackFilter } from "@/lib/shop-attribute-filters";
import { resolveBreederFromShopParam } from "@/lib/breeder-slug";
import { stripEmbeddedColorMarkup } from "@/lib/sanitize-product-text";
import type {
  Product,
  ProductVariant,
  ProductFull,
  ProductWithBreeder,
} from "@/types/supabase";

export {
  computeStartingPrice,
  computeTotalStock,
  getStartingVariant,
  getStartingVariantLabel,
  isLowStock,
};

type ServiceResult<T> = { data: T | null; error: string | null };

const DEFAULT_ACTIVE_PRODUCTS_LIMIT = 50;
const MAX_ACTIVE_PRODUCTS_LIMIT = 100;

function postgrestSearchTerm(value: string): string {
  return `%${value.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ")}%`;
}

function parseNumericProductIdParam(s: string): number | null {
  const t = s.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isSafeInteger(n) || n < 1) return null;
  return n;
}

const TEXT_FIELDS_WITH_POSSIBLE_HTML: (keyof Product)[] = [
  "description_th",
  "description_en",
  "genetic_ratio",
  "lineage",
  "genetics",
  "yield_info",
  "growing_difficulty",
];

function sanitizeProductTextFields<T>(row: T): T {
  const record = row as Record<string, unknown>;
  for (const key of TEXT_FIELDS_WITH_POSSIBLE_HTML) {
    const v = record[key];
    if (typeof v === "string" && v.length > 0) {
      record[key] = stripEmbeddedColorMarkup(v);
    }
  }
  return row;
}

function normalizeProductFullRow(data: ProductFull): ProductFull {
  sanitizeProductTextFields(data);
  const variants = data.product_variants ?? [];
  data.product_variants = variants.filter((v) => v.is_active);
  return data;
}

// ─── Storefront Queries ───────────────────────────────────────────────────────

/** Resolve `?breeder=` slug or legacy numeric id to breeder id (for server filters). */
export async function getBreederIdFromShopParam(
  param: string
): Promise<number | null> {
  const trimmed = param.trim();
  if (!trimmed) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("breeders").select("id, name").eq("is_active", true);
  const row = resolveBreederFromShopParam(
    (data ?? []) as { id: number; name: string }[],
    trimmed
  );
  return row ? Number(row.id) : null;
}

export async function getActiveProducts(opts?: {
  category?: string;
  breeder_id?: number;
  /** Prefer slug in URLs; resolves to `breeder_id` (empty list if unknown slug) */
  breeder_shop_param?: string;
  limit?: number;
  page?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  includeVariants?: boolean;
  /** Comma-separated pack buckets: 1,2,3,5,10,gt10,other — requires variant rows (filtered in memory). */
  seeds_param?: string | null;
}): Promise<ServiceResult<ProductWithBreeder[]>> {
  try {
    const supabase = await createClient();
    const seedsSel = parseListParam(opts?.seeds_param ?? null);
    const selectShape =
      seedsSel.length > 0 || opts?.includeVariants
        ? PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS
        : PRODUCT_SELECT_WITH_BREEDER;

    let query = supabase
      .from("products")
      .select(selectShape)
      .eq("is_active", true)
      .order("id", { ascending: false });

    if (opts?.category) query = query.eq("category", opts.category);
    const search = opts?.search?.trim();
    if (search) {
      const term = postgrestSearchTerm(search);
      query = query.or(
        `name.ilike.${term},category.ilike.${term},description_th.ilike.${term},description_en.ilike.${term}`
      );
    }
    if (opts?.minPrice != null && Number.isFinite(opts.minPrice)) {
      query = query.gte("price", opts.minPrice);
    }
    if (opts?.maxPrice != null && Number.isFinite(opts.maxPrice)) {
      query = query.lte("price", opts.maxPrice);
    }
    let breederId: number | undefined = opts?.breeder_id;
    if (opts?.breeder_shop_param?.trim()) {
      const id = await getBreederIdFromShopParam(opts.breeder_shop_param);
      if (id == null) return { data: [], error: null };
      breederId = id;
    }
    if (breederId != null) query = query.eq("breeder_id", breederId);
    const limit = Math.min(
      MAX_ACTIVE_PRODUCTS_LIMIT,
      Math.max(1, opts?.limit ?? DEFAULT_ACTIVE_PRODUCTS_LIMIT)
    );
    const page = Math.max(1, opts?.page ?? 1);
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error } = await query;

    if (error) return { data: null, error: error.message };
    let rows = data as unknown as (ProductWithBreeder & {
      product_variants?: { unit_label: string; is_active?: boolean | null }[];
    })[];
    if (seedsSel.length > 0) {
      rows = rows.filter((p) =>
        productMatchesSeedsPackFilter(p.product_variants ?? null, seedsSel)
      );
    }
    for (const row of rows) sanitizeProductTextFields(row);
    return { data: rows as ProductWithBreeder[], error: null };
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

/** Homepage carousel: active + flagged featured, lowest priority first. */
/** Homepage clearance rail: active, flagged clearance, in stock, sorted by discount depth then id. */
export async function getClearanceStorefrontProducts(
  limit = 24
): Promise<ServiceResult<ProductWithBreederAndVariants[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS)
      .eq("is_active", true)
      .eq("is_clearance", true)
      .order("id", { ascending: false })
      .limit(Math.min(80, limit * 3));

    if (error) return { data: null, error: error.message };
    const rows = (data ?? []) as ProductWithBreederAndVariants[];
    const filtered = rows.filter((p) => {
      const stock = computeTotalStock(p.product_variants ?? []);
      return stock > 0 && getEffectiveListingPrice(p) > 0;
    });
    filtered.sort((a, b) => {
      const pa = getEffectiveListingPrice(a);
      const pb = getEffectiveListingPrice(b);
      const ra = computeStartingPrice(a.product_variants);
      const rb = computeStartingPrice(b.product_variants);
      const pctA = ra > pa ? (ra - pa) / ra : 0;
      const pctB = rb > pb ? (rb - pb) / rb : 0;
      if (pctB !== pctA) return pctB - pctA;
      return Number(b.id) - Number(a.id);
    });
    const out = filtered.slice(0, limit);
    for (const row of out) sanitizeProductTextFields(row);
    return { data: out, error: null };
  } catch (err) {
    logger.error("product-service.getClearanceStorefrontProducts failed", { cause: err });
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getFeaturedProducts(
  limit = 12
): Promise<ServiceResult<ProductWithBreeder[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT_WITH_BREEDER)
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("featured_priority", { ascending: true })
      .order("id", { ascending: false })
      .limit(limit);

    if (error) return { data: null, error: error.message };
    const rows = data as ProductWithBreeder[];
    for (const row of rows) sanitizeProductTextFields(row);
    return { data: rows, error: null };
  } catch (err) {
    logger.error("product-service.getFeaturedProducts failed", {
      cause: err,
      context: { limit },
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
): Promise<ServiceResult<{ productId: number; variants: ProductVariant[] }>> {
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

    // Step 2: Insert child variants (optional — draft products may have none)
    const variantRows = variants.map((v) => ({ ...v, product_id: productId }));
    let insertedVariants: ProductVariant[] = [];
    if (variantRows.length > 0) {
      const { data: ins, error: variantError } = await db
        .from("product_variants")
        .insert(variantRows)
        .select();

      if (variantError) return { data: null, error: variantError.message };
      insertedVariants = (ins ?? []) as ProductVariant[];
    }

    // Step 3: Recalculate and sync price & stock onto parent product
    const startingPrice = computeStartingPrice(insertedVariants);
    const totalStock = computeTotalStock(insertedVariants);

    await db
      .from("products")
      .update({ price: startingPrice, stock: totalStock })
      .eq("id", productId);

    return { data: { productId, variants: insertedVariants }, error: null };
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
