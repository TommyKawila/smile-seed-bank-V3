import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { verifyLiffIdToken } from "@/lib/line-liff-verify";
import { LIFF_DEFAULT_REDIRECT } from "@/lib/line-liff-config";
import { safeNextPath } from "@/lib/safe-redirect-path";
import { env } from "@/lib/env";
import { supabaseAuthCookieOptions } from "@/lib/supabase/session-cookies";
import { syncLineUserToSupabase } from "@/services/line-auth-service";
import { establishSupabaseSessionForEmail } from "@/services/line-supabase-session-service";
import type { Database } from "@/types/database.types";

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
      console.error("[line/liff/session] sync failed");
      return NextResponse.json({ ok: false, error: "sync_failed" }, { status: 500 });
    }

    const sessionResponse = NextResponse.json({ ok: true, redirect });
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookieOptions: supabaseAuthCookieOptions,
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              sessionResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const session = await establishSupabaseSessionForEmail(synced.email, supabase);
    if (!session.ok) {
      console.error("[line/liff/session] session error:", session.error);
      return NextResponse.json({ ok: false, error: session.error }, { status: 500 });
    }

    return sessionResponse;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg === "invalid_token" || msg.includes("not configured")) {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[line/liff/session] unexpected error");
    return NextResponse.json({ ok: false, error: "session_failed" }, { status: 500 });
  }
}
