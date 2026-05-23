import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { StorefrontSessionHint } from "@/lib/storefront-session-hint";

/** Cookie session for navbar / age gate — no Supabase JS on the client. */
export async function getStorefrontSessionHint(): Promise<StorefrontSessionHint> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return null;
    return { userId: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
}
