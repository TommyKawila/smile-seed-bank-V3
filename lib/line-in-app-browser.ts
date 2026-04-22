/**
 * LINE in-app WebView (Android/iOS) — Google blocks OAuth in embedded UAs
 * (disallowed_useragent). Use with client-side `navigator.userAgent` checks.
 */
export function isLineInAppUserAgent(ua: string): boolean {
  if (!ua) return false;
  if (/\bLine\//i.test(ua)) return true;
  if (/\bLIFF\b/i.test(ua)) return true;
  if (/LIFT\/Chat|LineApp|line[-_]?webview/i.test(ua)) return true;
  return false;
}
