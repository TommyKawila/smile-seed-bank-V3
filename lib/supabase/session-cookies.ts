import type { CookieOptionsWithName } from "@supabase/ssr";

/** Browser + server Supabase auth cookies — align maxAge everywhere to avoid early drops. */
export const SUPABASE_AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

export const supabaseAuthCookieOptions: CookieOptionsWithName = {
  path: "/",
  sameSite: "lax",
  maxAge: SUPABASE_AUTH_COOKIE_MAX_AGE_SEC,
  secure: process.env.NODE_ENV === "production",
};
