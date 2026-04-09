import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getURL } from "@/lib/get-url";

export const dynamic = "force-dynamic";

const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";

function lineCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId =
    process.env.NEXT_PUBLIC_LINE_CLIENT_ID?.trim() || process.env.LINE_LOGIN_CHANNEL_ID?.trim() || "";
  const clientSecret =
    process.env.LINE_CHANNEL_SECRET?.trim() ||
    process.env.LINE_LOGIN_CHANNEL_SECRET?.trim() ||
    "";
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export async function GET(req: NextRequest) {
  const siteUrl = getURL().replace(/\/$/, "");
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const orderIdRaw = searchParams.get("state")?.trim() ?? "";
  const lineError = searchParams.get("error");

  const redirectFail = (msg: string) =>
    NextResponse.redirect(`${siteUrl}/track/${encodeURIComponent(orderIdRaw || "0")}?error=${encodeURIComponent(msg)}`);

  if (lineError) {
    return redirectFail(lineError === "access_denied" ? "cancelled" : lineError);
  }

  if (!code || !orderIdRaw) {
    return NextResponse.redirect(`${siteUrl}/?error=line_oauth`);
  }

  const id = BigInt(orderIdRaw.replace(/\D/g, "") || "0");
  if (id <= BigInt(0)) {
    return NextResponse.redirect(`${siteUrl}/?error=invalid_order`);
  }

  const creds = lineCredentials();
  if (!creds) {
    console.error("[api/line/callback] missing LINE_CHANNEL_SECRET / NEXT_PUBLIC_LINE_CLIENT_ID");
    return redirectFail("not_configured");
  }

  const redirectUri = `${siteUrl}/api/line/callback`;

  try {
    const tokenRes = await fetch(LINE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      console.error("[api/line/callback] token error", err);
      return redirectFail("token_failed");
    }

    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    if (!access_token) {
      return redirectFail("no_token");
    }

    const profileRes = await fetch(LINE_PROFILE_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileRes.ok) {
      return redirectFail("profile_failed");
    }

    const profile = (await profileRes.json()) as { userId: string };
    const lineUserId = profile.userId;

    const order = await prisma.orders.findUnique({
      where: { id },
      select: { line_user_id: true },
    });

    if (!order) {
      return NextResponse.redirect(`${siteUrl}/?error=order_not_found`);
    }

    const existing = order.line_user_id?.trim();
    if (existing && existing !== lineUserId) {
      return NextResponse.redirect(`${siteUrl}/track/${orderIdRaw}?error=already_linked`);
    }

    if (!existing) {
      await prisma.orders.update({
        where: { id },
        data: { line_user_id: lineUserId },
      });
    }

    return NextResponse.redirect(`${siteUrl}/track/${orderIdRaw}?success=true`);
  } catch (err) {
    console.error("[api/line/callback]", err);
    return redirectFail("server_error");
  }
}
