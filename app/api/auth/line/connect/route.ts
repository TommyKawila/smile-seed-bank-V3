/**
 * GET /api/auth/line/connect
 * Redirects the user to LINE Login OAuth2 authorization page.
 * Requires session (Supabase) — user must be logged in.
 *
 * Env vars needed:
 *   LINE_LOGIN_CHANNEL_ID     — from LINE Developers > LINE Login channel
 *   NEXT_PUBLIC_SITE_URL      — e.g. https://smileseedbank.com
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  if (!channelId) {
    return NextResponse.json(
      { error: "LINE_LOGIN_CHANNEL_ID is not configured" },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const redirectUri = `${siteUrl}/api/auth/line/callback`;

  // Random state to prevent CSRF — store in httpOnly cookie for verification
  const state = `${user.id}:${Math.random().toString(36).slice(2)}`;

  const cookieStore = await cookies();
  cookieStore.set("line_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 300, // 5 minutes
    path: "/",
    sameSite: "lax",
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: channelId,
    redirect_uri: redirectUri,
    state,
    scope: "profile",
  });

  return NextResponse.redirect(`${LINE_AUTH_URL}?${params.toString()}`);
}
