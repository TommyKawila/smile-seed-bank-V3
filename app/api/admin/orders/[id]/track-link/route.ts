import { requireAdminUser } from "@/lib/auth-utils";
import { buildOrderTrackUrl } from "@/lib/order-access-token";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Signed `/track/{id}?t=&e=` for POS / admin share (HMAC capability). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const order = await prisma.orders.findUnique({
      where: { id: BigInt(orderId) },
      select: { order_number: true },
    });
    if (!order?.order_number) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const trackUrl = buildOrderTrackUrl(orderId, order.order_number);
    if (!trackUrl.includes("t=")) {
      return NextResponse.json(
        { error: "Track claim token unavailable (check RECEIPT_DOWNLOAD_SECRET)" },
        { status: 503 }
      );
    }

    return NextResponse.json({ trackUrl, orderNumber: order.order_number });
  } catch (err) {
    console.error("[orders/[id]/track-link]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
