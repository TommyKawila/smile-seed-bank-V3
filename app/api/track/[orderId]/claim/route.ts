import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyLiffIdToken } from "@/lib/line-liff-verify";
import { rateLimitIp } from "@/lib/rate-limit-ip";

export const dynamic = "force-dynamic";

/**
 * Link LINE user to an order. Requires a verified LINE Login / LIFF id_token —
 * never trust a client-supplied lineUserId (IDOR / notification hijack).
 * Prefer the OAuth flow at `/api/line/login?orderId=` for browser users.
 */
const BodySchema = z.object({
  idToken: z.string().min(20, "Invalid id token"),
});

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const limited = rateLimitIp(`track-claim:${clientIp(req)}`, 10, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

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

    let lineUserId: string;
    try {
      const verified = await verifyLiffIdToken(parsed.data.idToken.trim());
      lineUserId = verified.lineUserId.trim();
    } catch {
      return NextResponse.json({ error: "LINE token verification failed" }, { status: 401 });
    }

    if (lineUserId.length < 5) {
      return NextResponse.json({ error: "Invalid LINE user" }, { status: 401 });
    }

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
        return NextResponse.json({
          ok: true,
          alreadyLinked: true,
          orderNumber: order.order_number,
        });
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

    return NextResponse.json({
      ok: true,
      alreadyLinked: false,
      orderNumber: order.order_number,
    });
  } catch (err) {
    console.error("[POST /api/track/claim]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
