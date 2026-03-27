import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const order = await prisma.orders.findUnique({
      where: { id: BigInt(orderId) },
      include: {
        order_items: true,
        customers: { select: { full_name: true, email: true, phone: true, address: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const productIds = [...new Set(order.order_items.map((i) => i.product_id).filter(Boolean))] as bigint[];
    const products = productIds.length > 0
      ? await prisma.products.findMany({
          where: { id: { in: productIds } },
          select: { id: true, image_url: true, image_urls: true, breeders: { select: { name: true } } },
        })
      : [];
    const breederByProductId = new Map(products.map((p) => [p.id, (p as { breeders?: { name: string } | null }).breeders?.name ?? null]));
    const imageByProductId = new Map(products.map((p) => {
      const img = Array.isArray((p as { image_urls?: unknown }).image_urls) && ((p as { image_urls: string[] }).image_urls).length > 0
        ? (p as { image_urls: string[] }).image_urls[0]
        : (p as { image_url?: string | null }).image_url ?? null;
      return [p.id, img];
    }));

    const customerName = order.customer_name ?? order.customers?.full_name ?? null;
    const customerPhone = order.customer_phone ?? order.customers?.phone ?? null;
    const customerEmail = order.customers?.email ?? null;
    const shippingAddress = order.shipping_address ?? order.customers?.address ?? null;

    const items = order.order_items.map((i) => ({
      id: Number(i.id),
      productName: i.product_name,
      unitLabel: i.unit_label ?? "—",
      breederName: i.product_id ? breederByProductId.get(i.product_id) ?? null : null,
      imageUrl: i.product_id ? imageByProductId.get(i.product_id) ?? null : null,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      totalPrice: Number(i.total_price ?? 0) || Number(i.unit_price) * i.quantity,
    }));

    return NextResponse.json(
      bigintToJson({
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
        discountAmount: Number(order.discount_amount ?? 0),
        status: order.status,
        voidReason: order.void_reason,
        trackingNumber: order.tracking_number,
        shippingProvider: order.shipping_provider,
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
        items,
      })
    );
  } catch (err) {
    console.error("[orders/[id]]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
