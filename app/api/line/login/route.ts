import { NextRequest, NextResponse } from "next/server";
import { getSiteOrigin } from "@/lib/get-url";

const LINE_AUTHORIZE = "https://access.line.me/oauth2/v2.1/authorize";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId")?.trim() ?? "";
  if (!orderId || !/^\d+$/.test(orderId)) {
    return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
  }

  const clientId = process.env.LINE_LOGIN_CHANNEL_ID?.trim();
  if (!clientId) {
    console.log("🍎 [line/login] missing LINE_LOGIN_CHANNEL_ID");
    return NextResponse.json({ error: "LINE is not configured" }, { status: 500 });
  }

  const base = getSiteOrigin();
  const redirectUri = `${base}/api/line/callback`;
  console.log("🍊 [line/login]", { orderId, redirectUri });

  const qs = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: orderId,
    scope: "openid profile",
  });

  const lineAuthUrl = `${LINE_AUTHORIZE}?${qs.toString()}`;
  console.log("🍋 [line/login] redirect to LINE authorize");
  return NextResponse.redirect(lineAuthUrl);
}
