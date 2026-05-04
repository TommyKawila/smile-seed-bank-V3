import { prisma } from "@/lib/prisma";
import { adminOrderLineItemSeedTypeLabel } from "@/lib/seed-type-filter";

function breederNameFromRelation(breeders: unknown): string | null {
  if (breeders == null) return null;
  if (Array.isArray(breeders)) {
    const n = breeders[0] as { name?: string } | undefined;
    const s = n?.name?.trim();
    return s && s.length > 0 ? s : null;
  }
  if (typeof breeders === "object" && "name" in (breeders as object)) {
    const s = String((breeders as { name: string }).name ?? "").trim();
    return s.length > 0 ? s : null;
  }
  return null;
}

export type AdminOrderDetailPayload = {
  id: number;
  orderNumber: string;
  sourceQuotationNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  shippingAddress: string | null;
  customerNote: string | null;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  status: string;
  paymentStatus: string;
  voidReason: string | null;
  trackingNumber: string | null;
  shippingProvider: string | null;
  paymentMethod: string | null;
  createdAt: Date;
  lineUserId: string | null;
  claimToken: string | null;
  items: {
    id: number;
    productName: string;
    unitLabel: string;
    breederName: string | null;
    seedTypeLabel: string;
    imageUrl: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
};

export async function loadAdminOrderDetail(orderId: number): Promise<AdminOrderDetailPayload | null> {
  const order = await prisma.orders.findUnique({
    where: { id: BigInt(orderId) },
    include: {
      order_items: true,
      customers: {
        select: { full_name: true, email: true, phone: true, address: true, line_user_id: true },
      },
      customer_profile: { select: { line_id: true } },
    },
  });

  if (!order) return null;

  const variantIds = [...new Set(order.order_items.map((i) => i.variant_id).filter(Boolean))] as bigint[];
  const variants =
    variantIds.length > 0
      ? await prisma.product_variants.findMany({
          where: { id: { in: variantIds } },
          select: {
            id: true,
            unit_label: true,
            product_id: true,
            products: {
              select: {
                flowering_type: true,
                category: true,
                product_categories: { select: { name: true } },
                breeders: { select: { name: true } },
              },
            },
          },
        })
      : [];
  const variantRowById = new Map(variants.map((v) => [v.id, v]));

  const productIdSet = new Set<bigint>();
  for (const i of order.order_items) {
    if (i.product_id) productIdSet.add(i.product_id);
    else if (i.variant_id) {
      const v = variantRowById.get(i.variant_id);
      if (v?.product_id) productIdSet.add(v.product_id);
    }
  }
  const productIds = [...productIdSet];

  const products =
    productIds.length > 0
      ? await prisma.products.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            image_url: true,
            image_urls: true,
            flowering_type: true,
            category: true,
            product_categories: { select: { name: true } },
            breeders: { select: { name: true } },
          },
        })
      : [];
  const breederByProductId = new Map(
    products.map((p) => [p.id, breederNameFromRelation((p as { breeders?: unknown }).breeders)])
  );
  const productById = new Map(products.map((p) => [p.id, p]));
  const imageByProductId = new Map(
    products.map((p) => {
      const img =
        Array.isArray((p as { image_urls?: unknown }).image_urls) &&
        ((p as { image_urls: string[] }).image_urls).length > 0
          ? (p as { image_urls: string[] }).image_urls[0]
          : (p as { image_url?: string | null }).image_url ?? null;
      return [p.id, img];
    })
  );

  const customerName = order.customer_name ?? order.customers?.full_name ?? null;
  const customerPhone = order.customer_phone ?? order.customers?.phone ?? null;
  const customerEmail =
    order.customers?.email?.trim() ||
    order.shipping_email?.trim() ||
    null;
  const shippingAddress = order.shipping_address ?? order.customers?.address ?? null;

  const items = order.order_items.map((i) => {
    const vid = i.variant_id ?? null;
    const vrow = vid ? variantRowById.get(vid) : undefined;
    const resolvedProductId = i.product_id ?? vrow?.product_id ?? null;
    const breederFromProduct =
      resolvedProductId != null ? breederByProductId.get(resolvedProductId) ?? null : null;
    const breederFromVariant = vrow ? breederNameFromRelation(vrow.products?.breeders) : null;
    const breederName = breederFromProduct ?? breederFromVariant;
    const prodRow = resolvedProductId != null ? productById.get(resolvedProductId) : undefined;
    const vprod = vrow?.products;
    const floweringType = prodRow?.flowering_type ?? vprod?.flowering_type ?? null;
    const category = prodRow?.category ?? vprod?.category ?? null;
    const productCategoryName =
      prodRow?.product_categories?.name ?? vprod?.product_categories?.name ?? null;
    const seedTypeLabel = adminOrderLineItemSeedTypeLabel({
      product_name: i.product_name,
      flowering_type: floweringType,
      category,
      product_category_name: productCategoryName,
    });
    const unitLabel =
      (i.unit_label?.trim() && i.unit_label.trim().length > 0
        ? i.unit_label.trim()
        : vrow?.unit_label?.trim()) || "—";
    return {
      id: Number(i.id),
      productName: i.product_name,
      unitLabel,
      breederName,
      seedTypeLabel,
      imageUrl: resolvedProductId ? imageByProductId.get(resolvedProductId) ?? null : null,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      totalPrice: Number(i.total_price ?? 0) || Number(i.unit_price) * i.quantity,
    };
  });

  return {
    id: Number(order.id),
    orderNumber: order.order_number,
    sourceQuotationNumber: order.source_quotation_number ?? null,
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
    customerNote: order.customer_note ?? null,
    totalAmount: Number(order.total_amount),
    shippingFee: Number(order.shipping_fee ?? 0),
    discountAmount:
      Number(order.discount_amount ?? 0) +
      Number(order.promotion_discount_amount ?? 0) +
      Number(order.points_discount_amount ?? 0),
    status: order.status ?? "PENDING",
    paymentStatus: order.payment_status ?? "unpaid",
    voidReason: order.void_reason,
    trackingNumber: order.tracking_number,
    shippingProvider: order.shipping_provider,
    paymentMethod: order.payment_method ?? "TRANSFER",
    createdAt: order.created_at ?? new Date(0),
    lineUserId: (() => {
      const o = order.line_user_id?.trim();
      const c = order.customers?.line_user_id?.trim();
      const p = order.customer_profile?.line_id?.trim();
      return o || c || p || null;
    })(),
    claimToken: order.claim_token?.trim() ? order.claim_token.trim() : null,
    items,
  };
}
