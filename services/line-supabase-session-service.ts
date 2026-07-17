import "server-only";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function establishSupabaseSessionForEmail(
  email: string
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

  const supabase = await createClient();
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
