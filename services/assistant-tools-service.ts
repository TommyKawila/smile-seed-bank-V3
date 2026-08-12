/**
 * Thin DB tools for SSB Assistant — live catalog / sales / stock / orders.
 * Read-only. Uses Prisma (service DB).
 */

import { prisma } from "@/lib/prisma";
import { getFinancialSummary } from "@/services/dashboard-service";
import { searchCustomersOmni } from "@/lib/customer-omni-search";
import { loadAdminOrderDetail } from "@/lib/load-admin-order-detail";
import { listOrderLogs } from "@/lib/order-logs";
import { getActivePartnerPriceList } from "@/services/partner-catalog-service";
import { GREEN_FUTURE_SLUG } from "@/types/partner-catalog";

const SEARCH_LIMIT = 15;
const LOW_STOCK_LIMIT = 20;
const ORDER_LIST_LIMIT = 15;
const CUSTOMER_ORDER_LIMIT = 10;

export type AssistantToolName =
  | "search_products"
  | "get_product_detail"
  | "get_sales_summary"
  | "get_low_stock"
  | "get_catalog_stats"
  | "lookup_order"
  | "search_customers"
  | "get_customer_orders"
  | "list_recent_orders"
  | "get_order_message_log"
  | "get_partner_cost_terms";

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

function mapOrderSummary(detail: NonNullable<Awaited<ReturnType<typeof loadAdminOrderDetail>>>) {
  return {
    id: detail.id,
    orderNumber: detail.orderNumber,
    status: detail.status,
    paymentStatus: detail.paymentStatus,
    customerName: detail.customerName,
    customerPhone: detail.customerPhone,
    customerEmail: detail.customerEmail,
    shippingAddress: detail.shippingAddress,
    customerNote: detail.customerNote,
    totalAmount: detail.totalAmount,
    shippingFee: detail.shippingFee,
    discountAmount: detail.discountAmount,
    trackingNumber: detail.trackingNumber,
    shippingProvider: detail.shippingProvider,
    paymentMethod: detail.paymentMethod,
    createdAt: detail.createdAt,
    paymentGraceUntil: detail.paymentGraceUntil,
    hasLineUser: Boolean(detail.lineUserId),
    items: detail.items.map((i) => ({
      productName: i.productName,
      unitLabel: i.unitLabel,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    })),
  };
}

export async function lookupOrder(args: {
  orderNumber?: string;
  orderId?: number;
}): Promise<unknown> {
  const orderId = args.orderId;
  const orderNumber = args.orderNumber?.trim();

  if (orderId != null && Number.isFinite(orderId) && orderId > 0) {
    const detail = await loadAdminOrderDetail(orderId);
    if (!detail) return { error: "Order not found", orderId };
    return mapOrderSummary(detail);
  }

  if (orderNumber) {
    const row = await prisma.orders.findFirst({
      where: {
        order_number: { equals: orderNumber, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (!row) {
      const fuzzy = await prisma.orders.findFirst({
        where: { order_number: { contains: orderNumber, mode: "insensitive" } },
        select: { id: true, order_number: true },
        orderBy: { created_at: "desc" },
      });
      if (!fuzzy) return { error: "Order not found", orderNumber };
      const detail = await loadAdminOrderDetail(Number(fuzzy.id));
      if (!detail) return { error: "Order not found", orderNumber };
      return mapOrderSummary(detail);
    }
    const detail = await loadAdminOrderDetail(Number(row.id));
    if (!detail) return { error: "Order not found", orderNumber };
    return mapOrderSummary(detail);
  }

  return { error: "Provide orderNumber or orderId" };
}

export async function searchCustomersTool(query: string): Promise<unknown> {
  const q = query.trim();
  if (!q) return { customers: [], note: "Empty query" };
  const hits = await searchCustomersOmni(q, 12);
  return {
    count: hits.length,
    customers: hits.map((h) => ({
      id: h.id,
      name: h.name,
      phone: h.phone,
      email: h.email,
      address: h.address,
      tier: h.tier,
      points: h.points,
      wholesaleDiscountPercent: h.wholesale_discount_percent,
    })),
  };
}

export async function getCustomerOrders(customerId: string): Promise<unknown> {
  const raw = customerId.trim();
  if (!raw) return { error: "customerId required" };

  /** Omni-search prefixes: `web-<uuid>`, `pos-<bigint>`, plain uuid/digits. */
  let uuid: string | null = null;
  let profileId: bigint | null = null;

  if (raw.startsWith("web-")) {
    const rest = raw.slice(4).trim();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rest)) {
      uuid = rest;
    }
  } else if (raw.startsWith("pos-")) {
    const rest = raw.slice(4).trim();
    if (/^\d+$/.test(rest)) profileId = BigInt(rest);
  } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
    uuid = raw;
  } else if (/^\d+$/.test(raw)) {
    profileId = BigInt(raw);
  }

  if (!uuid && profileId == null) {
    return {
      error:
        "Invalid customerId — use an id from search_customers (web-… / pos-…), not order-only hits",
      customerId: raw,
      orders: [],
    };
  }

  const orders = await prisma.orders.findMany({
    where: {
      OR: [
        ...(uuid ? [{ customer_id: uuid }] : []),
        ...(profileId != null ? [{ customer_profile_id: profileId }] : []),
      ],
    },
    orderBy: { created_at: "desc" },
    take: CUSTOMER_ORDER_LIMIT,
    select: {
      id: true,
      order_number: true,
      status: true,
      payment_status: true,
      total_amount: true,
      customer_name: true,
      customer_phone: true,
      created_at: true,
      tracking_number: true,
    },
  });

  return {
    customerId: raw,
    resolved: { customer_id: uuid, customer_profile_id: profileId?.toString() ?? null },
    count: orders.length,
    orders: orders.map((o) => ({
      id: Number(o.id),
      orderNumber: o.order_number,
      status: o.status,
      paymentStatus: o.payment_status,
      totalAmount: o.total_amount,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      createdAt: o.created_at,
      trackingNumber: o.tracking_number,
    })),
  };
}

export async function listRecentOrders(args: {
  status?: string;
  limit?: number;
}): Promise<unknown> {
  const limit = Math.min(
    Math.max(Number(args.limit) || ORDER_LIST_LIMIT, 1),
    30
  );
  const status = args.status?.trim();

  const orders = await prisma.orders.findMany({
    where: status
      ? { status: { equals: status, mode: "insensitive" } }
      : undefined,
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      order_number: true,
      status: true,
      payment_status: true,
      total_amount: true,
      customer_name: true,
      customer_phone: true,
      created_at: true,
      tracking_number: true,
    },
  });

  return {
    filterStatus: status || null,
    count: orders.length,
    orders: orders.map((o) => ({
      id: Number(o.id),
      orderNumber: o.order_number,
      status: o.status,
      paymentStatus: o.payment_status,
      totalAmount: o.total_amount,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      createdAt: o.created_at,
      trackingNumber: o.tracking_number,
    })),
  };
}

export async function getOrderMessageLog(args: {
  orderNumber?: string;
  orderId?: number;
}): Promise<unknown> {
  let id = args.orderId;
  if ((id == null || !Number.isFinite(id)) && args.orderNumber?.trim()) {
    const row = await prisma.orders.findFirst({
      where: {
        order_number: {
          equals: args.orderNumber.trim(),
          mode: "insensitive",
        },
      },
      select: { id: true, order_number: true },
    });
    if (!row) return { error: "Order not found", orderNumber: args.orderNumber };
    id = Number(row.id);
  }
  if (id == null || !Number.isFinite(id) || id <= 0) {
    return { error: "Provide orderNumber or orderId" };
  }

  const logs = await listOrderLogs(id);
  return {
    orderId: id,
    count: logs.length,
    logs: logs.slice(0, 40).map((l) => ({
      action: l.action,
      messageContent: l.messageContent,
      createdAt: l.createdAt,
    })),
  };
}

export async function getPartnerCostTerms(): Promise<unknown> {
  const list = await getActivePartnerPriceList(GREEN_FUTURE_SLUG);
  if (!list) return { error: "No active partner price list", confidential: true };
  return {
    confidential: true,
    note: "Supplier cost — internal only. Do not share raw cost with customers.",
    refCode: list.refCode,
    issuedAt: list.issuedAt,
    title: list.title,
    advancePaymentPct: list.advancePaymentPct,
    leadWithoutCoaDays: list.leadWithoutCoaDays,
    coaLabDays: list.coaLabDays,
    shipAfterCoaDays: list.shipAfterCoaDays,
    termsNotes: list.notes,
    tiers: list.tiers.map((t) => ({
      code: t.code,
      label: t.label,
      qtyDescription: t.qtyDescription,
      eurPerSeed: t.eurPerSeed,
      thbPerSeed: t.thbPerSeed,
      coaIncludedCount: t.coaIncludedCount,
    })),
    coaServices: list.coaServices.map((c) => ({
      code: c.code,
      label: c.label,
      usdPerStrain: c.usdPerStrain,
      thbPerStrain: c.thbPerStrain,
    })),
  };
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
    case "lookup_order": {
      const rawId = args.orderId ?? args.order_id;
      const orderId =
        rawId != null && String(rawId).trim() !== "" ? Number(rawId) : undefined;
      return lookupOrder({
        orderId:
          orderId != null && Number.isFinite(orderId) ? orderId : undefined,
        orderNumber:
          args.orderNumber != null
            ? String(args.orderNumber)
            : args.order_number != null
              ? String(args.order_number)
              : undefined,
      });
    }
    case "search_customers":
      return searchCustomersTool(String(args.query ?? args.q ?? ""));
    case "get_customer_orders":
      return getCustomerOrders(
        String(args.customerId ?? args.customer_id ?? "")
      );
    case "list_recent_orders":
      return listRecentOrders({
        status: args.status != null ? String(args.status) : undefined,
        limit: args.limit != null ? Number(args.limit) : undefined,
      });
    case "get_order_message_log": {
      const rawId = args.orderId ?? args.order_id;
      const orderId =
        rawId != null && String(rawId).trim() !== "" ? Number(rawId) : undefined;
      return getOrderMessageLog({
        orderId:
          orderId != null && Number.isFinite(orderId) ? orderId : undefined,
        orderNumber:
          args.orderNumber != null
            ? String(args.orderNumber)
            : args.order_number != null
              ? String(args.order_number)
              : undefined,
      });
    }
    case "get_partner_cost_terms":
      return getPartnerCostTerms();
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
