import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { restoreVariantStockForOrderItems } from "@/lib/order-inventory";
import { sendVoidOrderAlert } from "@/services/line-messaging";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const voidReason = typeof body.void_reason === "string" ? body.void_reason.trim() : null;

    const order = await prisma.orders.findUnique({
      where: { id: BigInt(orderId) },
      include: { order_items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "VOIDED") {
      return NextResponse.json({ error: "Order is already voided" }, { status: 400 });
    }

    if (order.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only COMPLETED orders can be voided" },
        { status: 400 }
      );
    }

    const totalAmount = Number(order.total_amount);
    const ptsRedeemed = order.points_redeemed ?? 0;
    const customerProfileId = order.customer_profile_id;

    await prisma.$transaction(async (tx) => {
      await restoreVariantStockForOrderItems(tx, order.order_items);

      await tx.orders.update({
        where: { id: BigInt(orderId) },
        data: {
          status: "VOIDED",
          void_reason: voidReason || null,
        },
      });

      if (customerProfileId) {
        const pointsToSubtract = Math.floor(totalAmount / 100);
        const netPointsChange = ptsRedeemed - pointsToSubtract;
        await tx.customer.update({
          where: { id: customerProfileId },
          data: {
            points: { increment: netPointsChange },
            total_spend: { decrement: new Prisma.Decimal(totalAmount) },
          },
        });
      }
    });

    void (async () => {
      const r = await sendVoidOrderAlert({
        orderNumber: order.order_number,
        totalAmount,
        reason: voidReason,
      });
      if (!r.success) console.error("[orders/void] LINE alert:", r.error);
    })();

    return NextResponse.json({ success: true, status: "VOIDED" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("PATCH /api/admin/orders/[id]/void error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
