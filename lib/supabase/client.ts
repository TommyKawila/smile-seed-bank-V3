import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { env } from "@/lib/env";
import { supabaseAuthCookieOptions } from "@/lib/supabase/session-cookies";
import { purgeStaleAuthStorage } from "@/lib/supabase/purge-stale-auth";

let browserClient: SupabaseClient<Database> | undefined;

export function createClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookieOptions: supabaseAuthCookieOptions }
    );
    void purgeStaleAuthStorage(browserClient);
  }
  return browserClient;
}
