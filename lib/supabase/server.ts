import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { env } from "@/lib/env";
import { supabaseAuthCookieOptions } from "@/lib/supabase/session-cookies";

function requireServiceRoleKey(): string {
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) {
    throw new Error(
      "[env] SUPABASE_SERVICE_ROLE_KEY is missing — required for service-role DB access (bypasses RLS). Add it in .env.local (Supabase → Settings → API → service_role)."
    );
  }
  return key;
}

/**
 * Server-only: Supabase client with the **service role** JWT (not the anon/browser client).
 * Uses `@supabase/supabase-js` directly — no cookie/session layer — so RLS is bypassed for admin writes.
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
  return createSupabaseJsClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    requireServiceRoleKey(),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: supabaseAuthCookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from Server Component — cookie mutation ignored
          }
        },
      },
    }
  );
}

/** Same JWT as {@link createServiceRoleClient}; kept async for existing call sites. */
export async function createAdminClient(): Promise<SupabaseClient<Database>> {
  return createServiceRoleClient();
}
