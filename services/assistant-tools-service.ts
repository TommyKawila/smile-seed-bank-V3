/**
 * Thin DB tools for SSB Telegram Assistant — live catalog / sales / stock.
 * Uses Prisma (service DB) — no RAG.
 */

import { prisma } from "@/lib/prisma";
import { getFinancialSummary } from "@/services/dashboard-service";

const SEARCH_LIMIT = 15;
const LOW_STOCK_LIMIT = 20;

export type AssistantToolName =
  | "search_products"
  | "get_product_detail"
  | "get_sales_summary"
  | "get_low_stock"
  | "get_catalog_stats";

export async function searchProducts(query: string): Promise<unknown> {
  const q = query.trim();
  if (!q) return { products: [], note: "Empty query" };

  const products = await prisma.products.findMany({
    where: {
      is_active: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { master_sku: { contains: q, mode: "insensitive" } },
        {
          product_variants: {
            some: {
              is_active: true,
              sku: { contains: q, mode: "insensitive" },
            },
          },
        },
      ],
    },
    take: SEARCH_LIMIT,
    select: {
      id: true,
      name: true,
      master_sku: true,
      slug: true,
      price: true,
      stock: true,
      sale_price: true,
      is_clearance: true,
      breeders: { select: { name: true } },
      product_variants: {
        where: { is_active: true },
        select: {
          id: true,
          unit_label: true,
          sku: true,
          price: true,
          cost_price: true,
          stock: true,
          clearance_price: true,
          low_stock_threshold: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });

  return {
    products: products.map((p) => ({
      id: Number(p.id),
      name: p.name,
      masterSku: p.master_sku,
      slug: p.slug,
      brand: p.breeders?.name ?? null,
      listPrice: p.price,
      salePrice: p.sale_price,
      isClearance: p.is_clearance,
      aggregateStock: p.stock,
      variants: p.product_variants.map((v) => ({
        id: Number(v.id),
        unitLabel: v.unit_label,
        sku: v.sku,
        price: v.price,
        costPrice: v.cost_price,
        stock: v.stock,
        clearancePrice: v.clearance_price,
        lowStockThreshold: v.low_stock_threshold ?? 5,
      })),
    })),
  };
}

const productDetailSelect = {
  id: true,
  name: true,
  master_sku: true,
  slug: true,
  description_th: true,
  description_en: true,
  price: true,
  sale_price: true,
  stock: true,
  is_clearance: true,
  product_kind: true,
  thc_percent: true,
  cbd_percent: true,
  flowering_type: true,
  genetics: true,
  breeders: { select: { name: true } },
  product_variants: {
    where: { is_active: true },
    select: {
      id: true,
      unit_label: true,
      sku: true,
      price: true,
      cost_price: true,
      stock: true,
      clearance_price: true,
      discount_percent: true,
      low_stock_threshold: true,
    },
    orderBy: { id: "asc" as const },
  },
};

function mapProductDetail(
  p: {
    id: bigint;
    name: string;
    master_sku: string | null;
    slug: string | null;
    description_th: string | null;
    description_en: string | null;
    price: unknown;
    sale_price: unknown;
    stock: number | null;
    is_clearance: boolean | null;
    product_kind: string;
    thc_percent: unknown;
    cbd_percent: string | null;
    flowering_type: string | null;
    genetics: string | null;
    breeders: { name: string } | null;
    product_variants: Array<{
      id: bigint;
      unit_label: string;
      sku: string | null;
      price: unknown;
      cost_price: unknown;
      stock: number | null;
      clearance_price: unknown;
      discount_percent: number;
      low_stock_threshold: number | null;
    }>;
  }
) {
  return {
    id: Number(p.id),
    name: p.name,
    masterSku: p.master_sku,
    slug: p.slug,
    brand: p.breeders?.name ?? null,
    descriptionTh: p.description_th,
    descriptionEn: p.description_en,
    listPrice: p.price,
    salePrice: p.sale_price,
    aggregateStock: p.stock,
    isClearance: p.is_clearance,
    productKind: p.product_kind,
    thcPercent: p.thc_percent,
    cbdPercent: p.cbd_percent,
    floweringType: p.flowering_type,
    genetics: p.genetics,
    variants: p.product_variants.map((v) => ({
      id: Number(v.id),
      unitLabel: v.unit_label,
      sku: v.sku,
      price: v.price,
      costPrice: v.cost_price,
      stock: v.stock,
      clearancePrice: v.clearance_price,
      discountPercent: v.discount_percent,
      lowStockThreshold: v.low_stock_threshold ?? 5,
    })),
  };
}

export async function getProductDetail(args: {
  productId?: number;
  query?: string;
  slug?: string;
}): Promise<unknown> {
  const productId = args.productId;
  const slug = args.slug?.trim();
  const query = args.query?.trim();

  if (productId != null && Number.isFinite(productId) && productId > 0) {
    const p = await prisma.products.findFirst({
      where: { id: BigInt(productId), is_active: true },
      select: productDetailSelect,
    });
    if (!p) return { error: "Product not found", productId };
    return mapProductDetail(p);
  }

  if (slug) {
    const p = await prisma.products.findFirst({
      where: { slug: { equals: slug, mode: "insensitive" }, is_active: true },
      select: productDetailSelect,
    });
    if (!p) return { error: "Product not found", slug };
    return mapProductDetail(p);
  }

  if (query) {
    const p = await prisma.products.findFirst({
      where: {
        is_active: true,
        OR: [
          { slug: { equals: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { master_sku: { contains: query, mode: "insensitive" } },
        ],
      },
      select: productDetailSelect,
    });
    if (!p) return { error: "Product not found", query };
    return mapProductDetail(p);
  }

  return { error: "Provide productId, slug, or query" };
}

export async function getSalesSummary(args: {
  from?: string;
  to?: string;
}): Promise<unknown> {
  const result = await getFinancialSummary({
    from: args.from?.trim() || undefined,
    to: args.to?.trim() || undefined,
  });
  if (result.error || !result.data) {
    return { error: result.error ?? "Failed to load sales summary" };
  }
  return {
    from: args.from ?? null,
    to: args.to ?? null,
    note: !args.from && !args.to ? "All-time paid orders (unless dates provided)" : null,
    ...result.data,
  };
}

export async function getCatalogStats(): Promise<unknown> {
  const [
    activeProducts,
    activeVariants,
    seedProducts,
    merchProducts,
    stockAgg,
  ] = await Promise.all([
    prisma.products.count({ where: { is_active: true } }),
    prisma.product_variants.count({ where: { is_active: true } }),
    prisma.products.count({
      where: { is_active: true, product_kind: "seed" },
    }),
    prisma.products.count({
      where: { is_active: true, product_kind: "merch" },
    }),
    prisma.product_variants.aggregate({
      where: { is_active: true },
      _sum: { stock: true },
    }),
  ]);

  return {
    activeProducts,
    activeVariants,
    totalVariantStockUnits: stockAgg._sum.stock ?? 0,
    byKind: {
      seed: seedProducts,
      merch: merchProducts,
    },
  };
}

export async function getLowStock(): Promise<unknown> {
  const variants = await prisma.product_variants.findMany({
    where: { is_active: true },
    take: 500,
    select: {
      id: true,
      unit_label: true,
      sku: true,
      stock: true,
      low_stock_threshold: true,
      price: true,
      products: {
        select: {
          name: true,
          master_sku: true,
          breeders: { select: { name: true } },
        },
      },
    },
  });

  const low = variants
    .filter((v) => (v.stock ?? 0) <= (v.low_stock_threshold ?? 5))
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
    .slice(0, LOW_STOCK_LIMIT)
    .map((v) => ({
      variantId: Number(v.id),
      productName: v.products?.name ?? "—",
      brand: v.products?.breeders?.name ?? null,
      unitLabel: v.unit_label,
      sku: v.sku,
      masterSku: v.products?.master_sku ?? null,
      stock: v.stock ?? 0,
      lowStockThreshold: v.low_stock_threshold ?? 5,
      price: v.price,
    }));

  return { count: low.length, items: low };
}

export async function executeAssistantTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name as AssistantToolName) {
    case "search_products":
      return searchProducts(String(args.query ?? args.q ?? ""));
    case "get_product_detail": {
      const rawId = args.productId ?? args.product_id;
      const productId =
        rawId != null && String(rawId).trim() !== ""
          ? Number(rawId)
          : undefined;
      return getProductDetail({
        productId:
          productId != null && Number.isFinite(productId) ? productId : undefined,
        query:
          args.query != null
            ? String(args.query)
            : args.q != null
              ? String(args.q)
              : undefined,
        slug: args.slug != null ? String(args.slug) : undefined,
      });
    }
    case "get_sales_summary":
      return getSalesSummary({
        from: args.from != null ? String(args.from) : undefined,
        to: args.to != null ? String(args.to) : undefined,
      });
    case "get_low_stock":
      return getLowStock();
    case "get_catalog_stats":
      return getCatalogStats();
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
