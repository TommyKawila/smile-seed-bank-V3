import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export async function establishSupabaseSessionForEmail(
  email: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, error: "missing_email" };
  }

  const admin = createServiceRoleClient();
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalized,
  });

  if (linkErr) {
    console.error("[line-session] generateLink failed");
    return { ok: false, error: "link_failed" };
  }

  const tokenHash = link?.properties?.hashed_token;
  if (!tokenHash) {
    console.error("[line-session] generateLink: missing hashed_token");
    return { ok: false, error: "link_empty" };
  }

  const supabase = supabaseClient ?? (await createClient());
  const { error: otpErr } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });

  if (otpErr) {
    console.error("[line-session] verifyOtp failed");
    return { ok: false, error: "otp_failed" };
  }

  return { ok: true };
}
