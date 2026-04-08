import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackStatusLabelEn, trackStatusLabelTh } from "@/lib/track-order-public";

export const dynamic = "force-dynamic";

/**
 * Public read: anyone with the numeric order id link can see status + tracking (no PII).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: raw } = await params;
    const id = BigInt(raw.replace(/\D/g, "") || "0");
    if (id <= BigInt(0)) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    const order = await prisma.orders.findUnique({
      where: { id },
      select: {
        order_number: true,
        status: true,
        tracking_number: true,
        shipping_provider: true,
        line_user_id: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      orderNumber: order.order_number,
      status: order.status,
      statusLabelEn: trackStatusLabelEn(order.status),
      statusLabelTh: trackStatusLabelTh(order.status),
      trackingNumber: order.tracking_number,
      shippingProvider: order.shipping_provider,
      lineLinked: Boolean(order.line_user_id?.trim()),
    });
  } catch (err) {
    console.error("[GET /api/track/[orderId]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
