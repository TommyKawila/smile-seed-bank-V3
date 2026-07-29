/** True when Supabase SSR auth cookies are present (skip getSession for anonymous guests). */
export function hasSupabaseAuthCookies(
  cookies: ReadonlyArray<{ name: string; value: string }>
): boolean {
  return cookies.some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
}
