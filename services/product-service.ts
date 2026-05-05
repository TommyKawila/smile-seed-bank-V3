import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  PRODUCT_SELECT_WITH_BREEDER,
  PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS,
  type ProductWithBreederAndVariants,
} from "@/lib/supabase/types";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
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
import { buildProductCatalogSearchOrFilter } from "@/lib/product-catalog-search";
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
const MIXED_BREEDER_SQL_DEBUG =
  "WITH ranked AS (SELECT p.*, ROW_NUMBER() OVER (PARTITION BY p.breeder_id ORDER BY COALESCE(p.price, 999999999)::numeric ASC, COALESCE(NULLIF(p.stock, 0), 999999999)::int ASC, p.id DESC) AS deal_rank FROM public.products p LEFT JOIN public.breeders b ON b.id = p.breeder_id WHERE p.is_active IS TRUE AND p.breeder_id IS NOT NULL AND (b.is_active IS DISTINCT FROM FALSE)) SELECT ranked.*, product_variants, product_images WHERE ranked.deal_rank <= $perBreeder LIMIT $limit";

type MixedBreederProductRow = ProductWithBreederAndVariants & {
  deal_rank: number;
};

type RawMixedBreederProductRow = Record<string, unknown> & {
  deal_rank: number;
  b_id: unknown;
  b_name: string | null;
  b_logo_url: string | null;
  pc_id: unknown;
  pc_name: string | null;
  product_variants: unknown;
  product_images: unknown;
};

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

function interleaveBreederRows(rows: MixedBreederProductRow[]): ProductWithBreederAndVariants[] {
  const byRank = new Map<number, MixedBreederProductRow[]>();
  for (const row of rows) {
    const list = byRank.get(row.deal_rank) ?? [];
    list.push(row);
    byRank.set(row.deal_rank, list);
  }
  return [...byRank.keys()]
    .sort((a, b) => a - b)
    .flatMap((rank) => byRank.get(rank) ?? [])
    .map(({ deal_rank: _dealRank, ...row }) => row);
}

function n(value: unknown): number | null {
  if (value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function arr<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function mapRawMixedBreederRow(row: RawMixedBreederProductRow): MixedBreederProductRow {
  return ({
    ...row,
    id: n(row.id) ?? 0,
    breeder_id: n(row.breeder_id),
    category_id: n(row.category_id),
    price: n(row.price) ?? 0,
    stock: n(row.stock) ?? 0,
    thc_percent: n(row.thc_percent),
    indica_ratio: n(row.indica_ratio),
    sativa_ratio: n(row.sativa_ratio),
    sale_price: n(row.sale_price),
    created_at: row.created_at as string | null,
    updated_at: row.updated_at as string | null,
    product_variants: arr(row.product_variants).map((v) => {
      const r = v as Record<string, unknown>;
      return {
        ...r,
        id: n(r.id) ?? 0,
        product_id: n(r.product_id),
        cost_price: n(r.cost_price) ?? 0,
        price: n(r.price) ?? 0,
        discount_percent: n(r.discount_percent) ?? 0,
        discount_ends_at: (r.discount_ends_at as string | null | undefined) ?? null,
        stock: n(r.stock) ?? 0,
        low_stock_threshold: n(r.low_stock_threshold) ?? 5,
      };
    }) as MixedBreederProductRow["product_variants"],
    product_images: arr(row.product_images).map((img) => {
      const r = img as Record<string, unknown>;
      return {
        id: n(r.id) ?? 0,
        url: String(r.url ?? ""),
        variant_id: n(r.variant_id),
        is_main: Boolean(r.is_main),
        sort_order: n(r.sort_order) ?? 0,
      };
    }),
    breeders:
      row.b_id == null
        ? null
        : {
            id: n(row.b_id) ?? 0,
            name: row.b_name ?? "",
            logo_url: row.b_logo_url,
          },
    product_categories:
      row.pc_id == null
        ? null
        : {
            id: n(row.pc_id) ?? 0,
            name: row.pc_name ?? "",
          },
    deal_rank: Number(row.deal_rank ?? 1),
  } as unknown) as MixedBreederProductRow;
}

async function fallbackMixedBreederProducts(
  limit: number
): Promise<ServiceResult<ProductWithBreederAndVariants[]>> {
  const fallback = await getActiveProducts({
    limit,
    includeVariants: true,
    sort: "smart_deal",
  });
  return {
    data: (fallback.data ?? []) as ProductWithBreederAndVariants[],
    error: fallback.error,
  };
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

export async function getNewArrivals(limit = 8) {
  try {
    const take = Math.min(MAX_ACTIVE_PRODUCTS_LIMIT, Math.max(1, Math.floor(limit)));
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS)
      .eq("is_active", true)
      .order("created_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .limit(take);

    if (error) return { data: null, error: error.message };
    const rows = (data ?? []) as ProductWithBreederAndVariants[];
    for (const row of rows) sanitizeProductTextFields(row);
    return { data: rows, error: null };
  } catch (err) {
    logger.error("product-service.getNewArrivals failed", { cause: err });
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function relatedGeneticsWhere(genetics?: string | null): Prisma.productsWhereInput | undefined {
  const value = genetics?.trim().toLowerCase();
  if (!value) return undefined;

  const terms = value.includes("indica")
    ? ["indica"]
    : value.includes("sativa")
      ? ["sativa"]
      : value.includes("hybrid")
        ? ["hybrid"]
        : [value];

  return {
    OR: terms.flatMap((term) => [
      { strain_dominance: { contains: term, mode: "insensitive" as const } },
      { genetic_ratio: { contains: term, mode: "insensitive" as const } },
      { genetics: { contains: term, mode: "insensitive" as const } },
    ]),
  };
}

export async function getRelatedProducts({
  productId,
  breederId,
  categoryName,
  genetics,
  limit = 4,
}: {
  productId: number;
  breederId: number | null;
  categoryName?: string | null;
  genetics?: string | null;
  limit?: number;
}) {
  try {
    const take = Math.min(8, Math.max(1, Math.floor(limit)));
    const baseWhere: Prisma.productsWhereInput = {
      is_active: true,
      id: { not: BigInt(productId) },
      ...(breederId != null ? { breeder_id: BigInt(breederId) } : {}),
      ...(categoryName?.trim() ? { category: categoryName.trim() } : {}),
    };
    const geneticsWhere = relatedGeneticsWhere(genetics);
    const data = await prisma.products.findMany({
      where: geneticsWhere ? { AND: [baseWhere, geneticsWhere] } : baseWhere,
      take,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      include: {
        breeders: true,
        product_variants: {
          where: { is_active: true },
          orderBy: { price: "asc" },
        },
        product_images: {
          orderBy: { sort_order: "asc" },
        },
      },
    });

    if (data.length >= take || !geneticsWhere) return { data, error: null };

    const fallback = await prisma.products.findMany({
      where: {
        ...baseWhere,
        id: { notIn: [BigInt(productId), ...data.map((p) => p.id)] },
      },
      take: take - data.length,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      include: {
        breeders: true,
        product_variants: {
          where: { is_active: true },
          orderBy: { price: "asc" },
        },
        product_images: {
          orderBy: { sort_order: "asc" },
        },
      },
    });

    return { data: [...data, ...fallback].slice(0, take), error: null };
  } catch (err) {
    logger.error("product-service.getRelatedProducts failed", { cause: err });
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getMixedBreederProducts(
  perBreeder = 2,
  limit = DEFAULT_ACTIVE_PRODUCTS_LIMIT
): Promise<ServiceResult<ProductWithBreederAndVariants[]>> {
  try {
    const takePerBreeder = Math.min(2, Math.max(1, Math.floor(perBreeder)));
    const takeLimit = Math.min(MAX_ACTIVE_PRODUCTS_LIMIT, Math.max(1, Math.floor(limit)));
    const rows = await prisma.$queryRaw<RawMixedBreederProductRow[]>`
      WITH ranked AS (
        SELECT
          p.*,
          b.id AS b_id,
          b.name AS b_name,
          b.logo_url AS b_logo_url,
          pc.id AS pc_id,
          pc.name AS pc_name,
          ROW_NUMBER() OVER (
            PARTITION BY p.breeder_id
            ORDER BY COALESCE(p.price, 999999999)::numeric ASC,
                     COALESCE(NULLIF(p.stock, 0), 999999999)::int ASC,
                     p.id DESC
          )::int AS deal_rank
        FROM public.products p
        LEFT JOIN public.breeders b ON b.id = p.breeder_id
        LEFT JOIN public.product_categories pc ON pc.id = p.category_id
        WHERE p.is_active IS TRUE
          AND p.breeder_id IS NOT NULL
          AND (b.is_active IS DISTINCT FROM FALSE)
      )
      SELECT
        ranked.*,
        COALESCE(
          (
            SELECT jsonb_agg(to_jsonb(pv) ORDER BY pv.id ASC)
            FROM public.product_variants pv
            WHERE pv.product_id = ranked.id
          ),
          '[]'::jsonb
        ) AS product_variants,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', pi.id,
                'url', pi.url,
                'variant_id', pi.variant_id,
                'is_main', pi.is_main,
                'sort_order', pi.sort_order
              )
              ORDER BY pi.sort_order ASC, pi.id ASC
            )
            FROM public.product_images pi
            WHERE pi.product_id = ranked.id
          ),
          '[]'::jsonb
        ) AS product_images,
        ranked.b_id,
        ranked.b_name,
        ranked.b_logo_url,
        ranked.pc_id,
        ranked.pc_name
      FROM ranked
      WHERE ranked.deal_rank <= ${takePerBreeder}
      ORDER BY ranked.deal_rank ASC,
               COALESCE(ranked.price, 999999999)::numeric ASC,
               COALESCE(NULLIF(ranked.stock, 0), 999999999)::int ASC,
               ranked.id DESC
      LIMIT ${takeLimit}
    `;

    if (rows.length === 0) {
      console.warn(
        "[product-service] getMixedBreederProducts returned 0 rows; falling back to getActiveProducts",
        { sql: MIXED_BREEDER_SQL_DEBUG, takePerBreeder, takeLimit }
      );
      return fallbackMixedBreederProducts(takeLimit);
    }

    const out = interleaveBreederRows(rows.map(mapRawMixedBreederRow));
    for (const row of out) sanitizeProductTextFields(row);
    return { data: out, error: null };
  } catch (err) {
    logger.error("product-service.getMixedBreederProducts failed", { cause: err });
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
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
  sort?: "smart_deal" | "newest" | string;
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
      .eq("is_active", true);

    if (opts?.category) query = query.eq("category", opts.category);
    const search = opts?.search?.trim();
    const catalogOr = search ? buildProductCatalogSearchOrFilter(search) : null;
    if (catalogOr) query = query.or(catalogOr);
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
    if (opts?.sort === "smart_deal") {
      query = query
        .gt("stock", 0)
        .order("price", { ascending: true, nullsFirst: false })
        .order("stock", { ascending: true, nullsFirst: false })
        .order("id", { ascending: false });
    } else if (opts?.sort === "newest") {
      query = query
        .order("created_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false });
    } else {
      query = query.order("id", { ascending: false });
    }
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
