import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteOrigin } from "@/lib/get-url";

export const dynamic = "force-dynamic";

const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";

function redirectTrackAuthFailed(site: string, orderIdRaw: string) {
  const digits = orderIdRaw.replace(/\D/g, "");
  if (digits)
    return NextResponse.redirect(`${site}/track/${encodeURIComponent(digits)}?error=auth_failed`);
  return NextResponse.redirect(`${site}/?error=auth_failed`);
}

export async function GET(req: NextRequest) {
  const site = getSiteOrigin();
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const orderIdRaw = searchParams.get("state")?.trim() ?? "";
  const lineError = searchParams.get("error");

  console.log("🍎 [line/callback] incoming", {
    hasCode: Boolean(code),
    orderIdRaw: orderIdRaw || null,
    lineError,
  });

  if (lineError) {
    console.log("🍊 [line/callback] LINE error param", lineError);
    return redirectTrackAuthFailed(site, orderIdRaw);
  }

  if (!code || !orderIdRaw) {
    console.log("🍋 [line/callback] missing code or state");
    return redirectTrackAuthFailed(site, orderIdRaw);
  }

  const id = BigInt(orderIdRaw.replace(/\D/g, "") || "0");
  if (id <= BigInt(0)) {
    console.log("🍎 [line/callback] invalid order id in state");
    return NextResponse.redirect(`${site}/?error=auth_failed`);
  }

  const clientId = process.env.LINE_LOGIN_CHANNEL_ID?.trim();
  const clientSecret = process.env.LINE_LOGIN_CHANNEL_SECRET?.trim();
  if (!clientId || !clientSecret) {
    console.log("🍊 [line/callback] missing LINE_LOGIN_CHANNEL_ID or LINE_LOGIN_CHANNEL_SECRET");
    return redirectTrackAuthFailed(site, orderIdRaw);
  }

  const redirectUri = `${site}/api/line/callback`;

  try {
    const tokenRes = await fetch(LINE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    console.log("🍋 [line/callback] token exchange", { ok: tokenRes.ok, status: tokenRes.status });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      console.log("🍎 [line/callback] token body", err);
      return redirectTrackAuthFailed(site, orderIdRaw);
    }

    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    const access_token = tokenJson.access_token;
    if (!access_token) {
      console.log("🍊 [line/callback] no access_token in response");
      return redirectTrackAuthFailed(site, orderIdRaw);
    }

    const profileRes = await fetch(LINE_PROFILE_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    console.log("🍋 [line/callback] profile", { ok: profileRes.ok, status: profileRes.status });

    if (!profileRes.ok) {
      return redirectTrackAuthFailed(site, orderIdRaw);
    }

    const profile = (await profileRes.json()) as { userId: string };
    const lineUserId = profile.userId;
    console.log("🍎 [line/callback] profile userId prefix", lineUserId?.slice(0, 4));

    const order = await prisma.orders.findUnique({
      where: { id },
      select: { line_user_id: true },
    });

    if (!order) {
      console.log("🍊 [line/callback] order not found", { id: String(id) });
      return redirectTrackAuthFailed(site, orderIdRaw);
    }

    const existing = order.line_user_id?.trim();
    if (existing && existing !== lineUserId) {
      console.log("🍋 [line/callback] order already linked to another LINE user");
      return redirectTrackAuthFailed(site, orderIdRaw);
    }

    if (!existing) {
      await prisma.orders.update({
        where: { id },
        data: { line_user_id: lineUserId },
      });
      console.log("🍎 [line/callback] orders.line_user_id updated");
    }

    return NextResponse.redirect(`${site}/track/${orderIdRaw}?success=true`);
  } catch (err) {
    console.log("🍊 [line/callback] catch", err);
    return redirectTrackAuthFailed(site, orderIdRaw);
  }
}
