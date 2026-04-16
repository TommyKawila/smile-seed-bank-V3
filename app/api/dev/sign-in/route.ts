import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database.types";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const email = process.env.DEV_ADMIN_EMAIL?.trim();
  const password = process.env.DEV_ADMIN_PASSWORD?.trim();
  if (!email || !password) {
    return NextResponse.json(
      {
        error:
          "Configure DEV_ADMIN_EMAIL and DEV_ADMIN_PASSWORD in .env.local (Supabase user with user_metadata.role = ADMIN).",
      },
      { status: 400 }
    );
  }

  const origin = new URL(req.url).origin;
  let response = NextResponse.redirect(`${origin}/admin/dashboard`, 303);

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return response;
}
