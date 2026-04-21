import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/next-auth-options";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect-path";

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

    const admin = createServiceRoleClient();
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr) {
      console.error("[line-bridge] generateLink failed");
      return NextResponse.redirect(`${origin}/login?error=line_bridge_link`);
    }
    const tokenHash = link?.properties?.hashed_token;
    if (!tokenHash) {
      console.error("[line-bridge] generateLink: missing hashed_token");
      return NextResponse.redirect(`${origin}/login?error=line_bridge_link_empty`);
    }

    const supabase = await createClient();
    const { error: otpErr } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (otpErr) {
      console.error("[line-bridge] verifyOtp failed");
      return NextResponse.redirect(`${origin}/login?error=line_bridge_otp`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch {
    console.error("[line-bridge] unexpected error");
    return NextResponse.redirect(`${origin}/login?error=line_bridge_exception`);
  }
}
