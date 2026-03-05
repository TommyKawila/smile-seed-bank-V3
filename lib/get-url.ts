/**
 * Returns the canonical base URL of the application, with trailing slash.
 *
 * Priority:
 *  1. NEXT_PUBLIC_BASE_URL  — explicit override (recommended for custom domains)
 *  2. NEXT_PUBLIC_VERCEL_URL — auto-injected by Vercel (preview + production)
 *  3. http://localhost:3000/ — local development fallback
 *
 * Works in both server-side (API routes, Server Components) and
 * client-side contexts (browser env vars are prefixed NEXT_PUBLIC_).
 */
export function getURL(): string {
  let url =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000/";

  // Ensure protocol prefix
  url = url.includes("http") ? url : `https://${url}`;
  // Ensure single trailing slash
  url = url.endsWith("/") ? url : `${url}/`;

  return url;
}
