import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
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

  const path = request.nextUrl.pathname;
  const isAdminApi = path === "/api/admin" || path.startsWith("/api/admin/");
  const isAiApi = path === "/api/ai" || path.startsWith("/api/ai/");

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
  ],
};
