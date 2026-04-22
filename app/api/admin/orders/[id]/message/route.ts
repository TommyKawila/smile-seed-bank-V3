import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrderLog } from "@/lib/order-logs";
import { prisma } from "@/lib/prisma";
import { pushTextToLineUser } from "@/services/line-messaging";

const BodySchema = z.object({
  message: z.string().min(1, "Enter a message").max(5000),
});

export const dynamic = "force-dynamic";

function resolveLineUserIdFromOrder(
  o: {
    line_user_id: string | null;
    customers: { line_user_id: string | null } | null;
    customer_profile: { line_id: string | null } | null;
  }
): string | null {
  const a = o.line_user_id?.trim();
  const b = o.customers?.line_user_id?.trim();
  const c = o.customer_profile?.line_id?.trim();
  return a || b || c || null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const message = parsed.data.message.trim();
    if (!message) {
      return NextResponse.json({ error: "Message is empty" }, { status: 400 });
    }

    const order = await prisma.orders.findUnique({
      where: { id: BigInt(orderId) },
      select: {
        id: true,
        order_number: true,
        line_user_id: true,
        customers: { select: { line_user_id: true } },
        customer_profile: { select: { line_id: true } },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const lineUid = resolveLineUserIdFromOrder(order);
    if (!lineUid) {
      return NextResponse.json(
        { error: "No LINE user linked to this order — link a LINE id first" },
        { status: 400 }
      );
    }

    const push = await pushTextToLineUser(lineUid, message);
    if (!push.success) {
      return NextResponse.json(
        { error: push.error ?? "LINE send failed" },
        { status: 502 }
      );
    }

    await createOrderLog({
      orderId,
      action: "MESSAGE_SENT",
      messageContent: message,
    });

    return NextResponse.json({ ok: true, orderNumber: order.order_number });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders/[id]/message]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
