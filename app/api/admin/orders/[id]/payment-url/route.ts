import { requireAdminUser } from "@/lib/auth-utils";
import { buildOrderPaymentUrl } from "@/lib/order-access-token";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __adminGate = await requireAdminUser();
  if (!__adminGate.ok) return __adminGate.response;

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

    const paymentUrl = buildOrderPaymentUrl(order.order_number);
    if (!paymentUrl.includes("t=")) {
      return NextResponse.json(
        { error: "Payment access token unavailable (check RECEIPT_DOWNLOAD_SECRET)" },
        { status: 503 }
      );
    }

    return NextResponse.json({ paymentUrl, orderNumber: order.order_number });
  } catch (err) {
    console.error("[orders/[id]/payment-url]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
