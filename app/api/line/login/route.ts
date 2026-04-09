import { NextRequest, NextResponse } from "next/server";
import { getURL } from "@/lib/get-url";

const LINE_AUTHORIZE = "https://access.line.me/oauth2/v2.1/authorize";

function lineClientId(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_LINE_CLIENT_ID?.trim() || process.env.LINE_LOGIN_CHANNEL_ID?.trim() || undefined
  );
}

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId")?.trim() ?? "";
  if (!orderId || !/^\d+$/.test(orderId)) {
    return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
  }

  const clientId = lineClientId();
  if (!clientId) {
    return NextResponse.json({ error: "LINE client is not configured" }, { status: 500 });
  }

  const siteUrl = getURL().replace(/\/$/, "");
  const redirectUri = `${siteUrl}/api/line/callback`;

  const qs = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: orderId,
    scope: "openid profile",
  });

  return NextResponse.redirect(`${LINE_AUTHORIZE}?${qs.toString()}`);
}
