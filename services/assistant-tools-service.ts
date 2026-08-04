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
  | "get_low_stock";

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

export async function getProductDetail(productId: number): Promise<unknown> {
  if (!Number.isFinite(productId) || productId <= 0) {
    return { error: "Invalid productId" };
  }

  const p = await prisma.products.findFirst({
    where: { id: BigInt(productId), is_active: true },
    select: {
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
        orderBy: { id: "asc" },
      },
    },
  });

  if (!p) return { error: "Product not found", productId };

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
    case "get_product_detail":
      return getProductDetail(Number(args.productId ?? args.product_id ?? 0));
    case "get_sales_summary":
      return getSalesSummary({
        from: args.from != null ? String(args.from) : undefined,
        to: args.to != null ? String(args.to) : undefined,
      });
    case "get_low_stock":
      return getLowStock();
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
