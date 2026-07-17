import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/next-auth-options";
import { safeNextPath } from "@/lib/safe-redirect-path";
import { establishSupabaseSessionForEmail } from "@/services/line-supabase-session-service";

/**
 * After NextAuth LINE login, promote the user into a real Supabase session
 * so the rest of the app (which reads Supabase) recognises them as logged in.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const next = safeNextPath(url.searchParams.get("next")) ?? "/profile";

  try {
    const session = await getServerSession(authOptions);

    const user = session?.user as
      | {
          supabaseUserId?: string;
          supabaseEmail?: string;
          email?: string | null;
        }
      | undefined;

    if (!session) {
      return NextResponse.redirect(`${origin}/login?error=line_bridge_no_session`);
    }
    if (!user?.supabaseUserId) {
      return NextResponse.redirect(`${origin}/login?error=line_bridge_no_uid`);
    }

    const email = user.supabaseEmail ?? user.email ?? null;
    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=line_bridge_no_email`);
    }

    const supabaseSession = await establishSupabaseSessionForEmail(email);
    if (!supabaseSession.ok) {
      console.error("[line-bridge] session failed:", supabaseSession.error);
      return NextResponse.redirect(`${origin}/login?error=line_bridge_otp`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch {
    console.error("[line-bridge] unexpected error");
    return NextResponse.redirect(`${origin}/login?error=line_bridge_exception`);
  }
}
