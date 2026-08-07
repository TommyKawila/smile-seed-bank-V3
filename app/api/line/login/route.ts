import { NextRequest, NextResponse } from "next/server";
import { getSiteOrigin } from "@/lib/get-url";
import { verifyOrderAccessQuery } from "@/lib/order-access-token";
import { prisma } from "@/lib/prisma";
import { encodeLineClaimOAuthState } from "@/lib/line-claim-oauth-state";

const LINE_AUTHORIZE = "https://access.line.me/oauth2/v2.1/authorize";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId")?.trim() ?? "";
  const t = req.nextUrl.searchParams.get("t")?.trim() ?? "";
  const e = req.nextUrl.searchParams.get("e")?.trim() ?? "";
  if (!orderId || !/^\d+$/.test(orderId)) {
    return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
  }
  if (!t || !e) {
    return NextResponse.json(
      { error: "Missing claim token (open the signed track link)" },
      { status: 403 }
    );
  }

  const id = BigInt(orderId);
  const order = await prisma.orders.findUnique({
    where: { id },
    select: { order_number: true },
  });
  if (!order?.order_number) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!verifyOrderAccessQuery(order.order_number, t, e)) {
    return NextResponse.json({ error: "Invalid or expired claim token" }, { status: 403 });
  }

  const clientId = process.env.LINE_LOGIN_CHANNEL_ID?.trim();
  if (!clientId) {
    console.log("🍎 [line/login] missing LINE_LOGIN_CHANNEL_ID");
    return NextResponse.json({ error: "LINE is not configured" }, { status: 500 });
  }

  const base = getSiteOrigin();
  const redirectUri = `${base}/api/line/callback`;
  const state = encodeLineClaimOAuthState({ orderId, t, e });
  console.log("🍊 [line/login]", { orderId, redirectUri });

  const qs = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile",
  });

  const lineAuthUrl = `${LINE_AUTHORIZE}?${qs.toString()}`;
  console.log("🍋 [line/login] redirect to LINE authorize");
  return NextResponse.redirect(lineAuthUrl);
}
