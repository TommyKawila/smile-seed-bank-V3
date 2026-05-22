/**
 * LINE in-app WebView blocks some OAuth flows (e.g. Google). Appending `openExternalBrowser=1`
 * asks many LINE clients to open the URL in the system browser instead of the in-app WebView.
 */
export function appendLineOpenExternalBrowserParam(url: string): string {
  const raw = url.trim();
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    if (u.searchParams.get("openExternalBrowser") === "1") return raw;
    u.searchParams.set("openExternalBrowser", "1");
    return u.toString();
  } catch {
    if (/[?&]openExternalBrowser=1(?:&|$|#)/.test(raw)) return raw;
    return raw.includes("?") ? `${raw}&openExternalBrowser=1` : `${raw}?openExternalBrowser=1`;
  }
}
