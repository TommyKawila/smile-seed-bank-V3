import "server-only";

import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseAuthCookies } from "@/lib/supabase/has-auth-cookies";
import type { StorefrontSessionHint } from "@/lib/storefront-session-hint";

/** Cookie session for navbar / age gate — no Supabase JS on the client. */
export async function getStorefrontSessionHint(
  cookieStore?: ReadonlyRequestCookies
): Promise<StorefrontSessionHint> {
  const store = cookieStore ?? (await cookies());
  if (!hasSupabaseAuthCookies(store.getAll())) return null;
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      await supabase.auth.signOut({ scope: "local" });
      return null;
    }
    const user = session?.user;
    if (!user?.id) return null;
    return { userId: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
}
