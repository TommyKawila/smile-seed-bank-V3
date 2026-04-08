import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  lineUserId: z.string().min(5, "Invalid LINE user id"),
});

/**
 * Link LINE user id (from LIFF) to an order. Idempotent if same user re-claims.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: raw } = await params;
    const id = BigInt(raw.replace(/\D/g, "") || "0");
    if (id <= BigInt(0)) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }

    const lineUserId = parsed.data.lineUserId.trim();
    console.log("[track/claim] request", { orderId: String(id) });

    const order = await prisma.orders.findUnique({
      where: { id },
      select: { line_user_id: true, order_number: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const existing = order.line_user_id?.trim();
    if (existing) {
      if (existing === lineUserId) {
        console.log("[track/claim] already same user", { orderId: String(id) });
        return NextResponse.json({ ok: true, alreadyLinked: true, orderNumber: order.order_number });
      }
      console.warn("[track/claim] forbidden other user", { orderId: String(id) });
      return NextResponse.json(
        { error: "This order is already linked to another LINE account" },
        { status: 403 }
      );
    }

    await prisma.orders.update({
      where: { id },
      data: { line_user_id: lineUserId },
    });
    console.log("[track/claim] linked ok", { orderId: String(id) });

    return NextResponse.json({ ok: true, alreadyLinked: false, orderNumber: order.order_number });
  } catch (err) {
    console.error("[POST /api/track/claim]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
