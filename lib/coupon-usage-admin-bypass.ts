import type { User } from "@supabase/supabase-js";

/**
 * Admin storefront QA bypass for per-customer promo reuse checks.
 *
 * Set `ADMIN_COUPON_USAGE_BYPASS_EMAILS` to a comma-separated list of lowercase emails that
 * match the Supabase-auth email for the same `user_id` as the storefront request body.
 * Alternatively set `user_metadata.role` to `"ADMIN"` on that auth user.
 *
 * Bypass is gated on `sessionUser.id === requestUserId` — never trusts client-sent email alone.
 */

function normalizeEmail(e: string | null | undefined): string | null {
  const s = e?.trim().toLowerCase();
  return s && s.includes("@") ? s : null;
}

/** Comma-separated list in ADMIN_COUPON_USAGE_BYPASS_EMAILS (case-insensitive). */
function bypassEmailAllowlist(): Set<string> {
  const raw = process.env.ADMIN_COUPON_USAGE_BYPASS_EMAILS ?? "";
  return new Set(
    raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  );
}

/**
 * Server-side only: callers must resolve session from cookies; body user_id alone is untrusted.
 * Skips ONLY per-customer redemption / phone reuse checks when {@link coupon-service validates}.
 */
export function resolveSkipCouponPerUserReuseForAdminSession(opts: {
  sessionUser: User | null | undefined;
  requestUserId: string | null | undefined;
}): boolean {
  const sessionId = opts.sessionUser?.id;
  const rid = opts.requestUserId?.trim();
  if (!sessionId || !rid || sessionId !== rid) return false;

  const role = opts.sessionUser?.user_metadata?.role;
  if (typeof role === "string" && role === "ADMIN") {
    console.log("ADMIN_BYPASS: Admin testing coupon, skipping usage limit check.");
    return true;
  }

  const emails = bypassEmailAllowlist();
  const em = normalizeEmail(opts.sessionUser?.email ?? undefined);
  if (em !== null && emails.has(em)) {
    console.log("ADMIN_BYPASS: Admin testing coupon, skipping usage limit check.");
    return true;
  }

  return false;
}
