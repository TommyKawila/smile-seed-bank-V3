import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

function adminRoleFromMetadata(user: { user_metadata?: Record<string, unknown> }): string {
  const r = user.user_metadata?.role;
  return typeof r === "string" ? r : "";
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isDev = process.env.NODE_ENV === "development";

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthCallback =
    path === "/auth/callback" || path.startsWith("/auth/callback/");
  const isUpdatePassword =
    path === "/update-password" || path.startsWith("/update-password/");
  /** Storefront order flows (claim / status / digital receipt) — public, no login. */
  const isPublicOrderPage =
    path.startsWith("/order/claim") ||
    path.startsWith("/order/status") ||
    path.startsWith("/order/receipt");
  const isAdminApi = path === "/api/admin" || path.startsWith("/api/admin/");
  const isAiApi = path === "/api/ai" || path.startsWith("/api/ai/");

  /** PKCE callback + password page: unauthenticated users must reach these routes. */
  if (isAuthCallback || isUpdatePassword || isPublicOrderPage) {
    return supabaseResponse;
  }

  /** Local `next dev` only — never on Vercel production (NODE_ENV=production). */
  if (
    isDev &&
    (path === "/admin" ||
      path.startsWith("/admin/") ||
      isAdminApi ||
      isAiApi)
  ) {
    return supabaseResponse;
  }

  if (isAdminApi || isAiApi) {
    if (!user || adminRoleFromMetadata(user) !== "ADMIN") {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      copyCookies(supabaseResponse, res);
      return res;
    }
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    const redirect = NextResponse.redirect(url);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (adminRoleFromMetadata(user) !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("reason", "admin_required");
    const redirect = NextResponse.redirect(url);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin",
    "/api/admin/:path*",
    "/api/ai",
    "/api/ai/:path*",
    "/auth/callback",
    "/auth/callback/:path*",
    "/update-password",
    "/update-password/:path*",
    "/order/claim/:path*",
    "/order/status/:path*",
    "/order/receipt/:path*",
  ],
};
