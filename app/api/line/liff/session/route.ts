import { NextRequest, NextResponse } from "next/server";
import { verifyLiffIdToken } from "@/lib/line-liff-verify";
import { LIFF_DEFAULT_REDIRECT } from "@/lib/line-liff-config";
import { safeNextPath } from "@/lib/safe-redirect-path";
import { syncLineUserToSupabase } from "@/services/line-auth-service";
import { establishSupabaseSessionForEmail } from "@/services/line-supabase-session-service";

type SessionBody = {
  idToken?: string;
  next?: string;
};

export async function POST(req: NextRequest) {
  let body: SessionBody;
  try {
    body = (await req.json()) as SessionBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const idToken = body.idToken?.trim();
  if (!idToken) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  const redirect = safeNextPath(body.next ?? null) ?? LIFF_DEFAULT_REDIRECT;

  try {
    const verified = await verifyLiffIdToken(idToken);
    const synced = await syncLineUserToSupabase({
      lineUserId: verified.lineUserId,
      name: verified.name ?? null,
      email: verified.email ?? null,
      picture: verified.picture ?? null,
    });

    if (!synced) {
      return NextResponse.json({ ok: false, error: "sync_failed" }, { status: 500 });
    }

    const session = await establishSupabaseSessionForEmail(synced.email);
    if (!session.ok) {
      return NextResponse.json({ ok: false, error: session.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, redirect });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg === "invalid_token" || msg.includes("not configured")) {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[line/liff/session] unexpected error");
    return NextResponse.json({ ok: false, error: "session_failed" }, { status: 500 });
  }
}
