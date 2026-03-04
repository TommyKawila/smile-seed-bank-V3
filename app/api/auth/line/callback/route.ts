/**
 * GET /api/auth/line/callback
 * LINE Login OAuth2 callback handler.
 *
 * Flow:
 *  1. Verify state cookie matches (CSRF protection)
 *  2. Extract userId from state (set in /connect)
 *  3. Exchange `code` for LINE access token
 *  4. Fetch LINE profile to get `userId` (line_user_id)
 *  5. Update customers table via Direct SQL
 *  6. Redirect to /profile?tab=profile&line_connected=1
 *
 * Env vars needed:
 *   LINE_LOGIN_CHANNEL_ID
 *   LINE_LOGIN_CHANNEL_SECRET
 *   NEXT_PUBLIC_SITE_URL
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSql } from "@/lib/db";

const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const errorRedirect = (msg: string) =>
    NextResponse.redirect(`${siteUrl}/profile?tab=profile&line_error=${encodeURIComponent(msg)}`);

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");

  if (!code || !returnedState) {
    return errorRedirect("LINE login was cancelled");
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("line_oauth_state")?.value;
  cookieStore.delete("line_oauth_state");

  if (!savedState || savedState !== returnedState) {
    return errorRedirect("Invalid state — please try again");
  }

  // Extract user UUID from state (format: "<userId>:<random>")
  const customerId = savedState.split(":")[0];
  if (!customerId) return errorRedirect("Could not identify user");

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;
  if (!channelId || !channelSecret) {
    return errorRedirect("LINE login is not configured on the server");
  }

  const redirectUri = `${siteUrl}/api/auth/line/callback`;

  try {
    // ── 1. Exchange code for access token ───────────────────────────────────
    const tokenRes = await fetch(LINE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      console.error("[line/callback] token error:", err);
      return errorRedirect("Failed to get LINE access token");
    }

    const { access_token } = (await tokenRes.json()) as { access_token: string };

    // ── 2. Get LINE profile ──────────────────────────────────────────────────
    const profileRes = await fetch(LINE_PROFILE_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileRes.ok) {
      return errorRedirect("Failed to fetch LINE profile");
    }

    const profile = (await profileRes.json()) as { userId: string; displayName: string };
    const lineUserId = profile.userId;

    // ── 3. Update customers table ────────────────────────────────────────────
    const sql = getSql();
    await sql`
      UPDATE customers
      SET line_user_id = ${lineUserId}
      WHERE id = ${customerId}
    `;

    return NextResponse.redirect(
      `${siteUrl}/profile?tab=profile&line_connected=1&line_name=${encodeURIComponent(profile.displayName)}`
    );
  } catch (err) {
    console.error("[line/callback] error:", err);
    return errorRedirect("Something went wrong — please try again");
  }
}
