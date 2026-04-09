/**
 * Canonical public site URL — **NEXT_PUBLIC_SITE_URL** is the single source of truth.
 * Fallbacks: NEXT_PUBLIC_VERCEL_URL (Vercel), then local dev.
 *
 * Returns a string with a single trailing slash.
 */
export function getURL(): string {
  let url =
    (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim()) ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "http://localhost:3000/";

  url = url.includes("http") ? url : `https://${url}`;
  url = url.endsWith("/") ? url : `${url}/`;

  return url;
}

/**
 * Same origin as `getURL()` without trailing slash. Non-localhost HTTP URLs are upgraded to HTTPS
 * so LINE / OG links stay correct in production.
 */
export function getSiteOrigin(): string {
  let o = getURL().replace(/\/$/, "");
  if (!o.includes("localhost") && o.startsWith("http://")) {
    o = o.replace(/^http:\/\//i, "https://");
  }
  return o;
}
