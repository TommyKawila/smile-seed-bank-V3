import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { buildVoidOrderClaimWhere, orderIsReadyToShip } from "@/lib/order-paid";
import { restoreVariantStockForOrderItems } from "@/lib/order-inventory";
import { revalidateAfterOrderStatusChange } from "@/lib/revalidate-storefront-order";
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

    const oid = BigInt(orderId);
    let orderNumber = "";
    let totalAmount = 0;

    await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { id: oid },
        include: { order_items: true },
      });

      if (!order) {
        throw new Error("VOID_ERR_NOT_FOUND");
      }
      orderNumber = order.order_number;
      totalAmount = Number(order.total_amount);

      if (order.status === "VOIDED") {
        throw new Error("VOID_ERR_ALREADY_VOIDED");
      }

      const canVoidFromPaid =
        orderIsReadyToShip(order.status, order.payment_status) || order.status === "PAID";
      if (order.status !== "COMPLETED" && !canVoidFromPaid) {
        throw new Error("VOID_ERR_NOT_ELIGIBLE");
      }

      const claimWhere = buildVoidOrderClaimWhere(oid, order.status, order.payment_status);
      if (!claimWhere) {
        throw new Error("VOID_ERR_NOT_ELIGIBLE");
      }

      const claimed = await tx.orders.updateMany({
        where: claimWhere,
        data: {
          status: "VOIDED",
          void_reason: voidReason || null,
        },
      });
      if (claimed.count !== 1) {
        throw new Error("VOID_ERR_CONFLICT");
      }

      await restoreVariantStockForOrderItems(tx, order.order_items);

      if (order.customer_profile_id) {
        const ptsRedeemed = order.points_redeemed ?? 0;
        const pointsToSubtract = Math.floor(totalAmount / 100);
        const netPointsChange = ptsRedeemed - pointsToSubtract;
        await tx.customer.update({
          where: { id: order.customer_profile_id },
          data: {
            points: { increment: netPointsChange },
            total_spend: { decrement: new Prisma.Decimal(totalAmount) },
          },
        });
      }
    });

    void (async () => {
      const r = await sendVoidOrderAlert({
        orderNumber,
        totalAmount,
        reason: voidReason,
      });
      if (!r.success) console.error("[orders/void] LINE alert:", r.error);
    })();

    await revalidateAfterOrderStatusChange(orderId, orderNumber);

    return NextResponse.json({ success: true, status: "VOIDED" });
  } catch (err) {
    const code = err instanceof Error ? err.message : String(err);
    if (code === "VOID_ERR_NOT_FOUND") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (code === "VOID_ERR_ALREADY_VOIDED") {
      return NextResponse.json({ error: "Order is already voided" }, { status: 400 });
    }
    if (code === "VOID_ERR_NOT_ELIGIBLE") {
      return NextResponse.json(
        { error: "Only paid (ready to ship) or completed orders can be voided" },
        { status: 400 }
      );
    }
    if (code === "VOID_ERR_CONFLICT") {
      return NextResponse.json(
        { error: "Order already voided or concurrently updated" },
        { status: 409 }
      );
    }
    console.error("PATCH /api/admin/orders/[id]/void error:", err);
    return NextResponse.json({ error: code }, { status: 500 });
  }
}
