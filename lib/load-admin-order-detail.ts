import { prisma } from "@/lib/prisma";

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
  voidReason: string | null;
  trackingNumber: string | null;
  shippingProvider: string | null;
  paymentMethod: string | null;
  createdAt: Date;
  lineUserId: string | null;
  items: {
    id: number;
    productName: string;
    unitLabel: string;
    breederName: string | null;
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
      customers: { select: { full_name: true, email: true, phone: true, address: true } },
    },
  });

  if (!order) return null;

  const productIds = [...new Set(order.order_items.map((i) => i.product_id).filter(Boolean))] as bigint[];
  const variantIds = [...new Set(order.order_items.map((i) => i.variant_id).filter(Boolean))] as bigint[];
  const products =
    productIds.length > 0
      ? await prisma.products.findMany({
          where: { id: { in: productIds } },
          select: { id: true, image_url: true, image_urls: true, breeders: { select: { name: true } } },
        })
      : [];
  const breederByProductId = new Map(
    products.map((p) => [p.id, breederNameFromRelation((p as { breeders?: unknown }).breeders)])
  );
  const variants =
    variantIds.length > 0
      ? await prisma.product_variants.findMany({
          where: { id: { in: variantIds } },
          select: {
            id: true,
            unit_label: true,
            product_id: true,
            products: { select: { breeders: { select: { name: true } } } },
          },
        })
      : [];
  const variantRowById = new Map(variants.map((v) => [v.id, v]));
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
  const customerEmail = order.customers?.email ?? null;
  const shippingAddress = order.shipping_address ?? order.customers?.address ?? null;

  const items = order.order_items.map((i) => {
    const vid = i.variant_id ?? null;
    const vrow = vid ? variantRowById.get(vid) : undefined;
    const breederFromProduct =
      i.product_id != null ? breederByProductId.get(i.product_id) ?? null : null;
    const breederFromVariant = vrow ? breederNameFromRelation(vrow.products?.breeders) : null;
    const breederName = breederFromProduct ?? breederFromVariant;
    const unitLabel =
      (i.unit_label?.trim() && i.unit_label.trim().length > 0
        ? i.unit_label.trim()
        : vrow?.unit_label?.trim()) || "—";
    return {
      id: Number(i.id),
      productName: i.product_name,
      unitLabel,
      breederName,
      imageUrl: i.product_id ? imageByProductId.get(i.product_id) ?? null : null,
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
    customerNote: order.customer_note,
    totalAmount: Number(order.total_amount),
    shippingFee: Number(order.shipping_fee ?? 0),
    discountAmount:
      Number(order.discount_amount ?? 0) +
      Number(order.promotion_discount_amount ?? 0) +
      Number(order.points_discount_amount ?? 0),
    status: order.status,
    voidReason: order.void_reason,
    trackingNumber: order.tracking_number,
    shippingProvider: order.shipping_provider,
    paymentMethod: order.payment_method,
    createdAt: order.created_at,
    lineUserId: order.line_user_id?.trim() ? order.line_user_id.trim() : null,
    items,
  };
}
