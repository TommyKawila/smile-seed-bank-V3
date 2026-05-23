import type { NextRequest, NextResponse } from "next/server";

export const VIEWPORT_HINT_COOKIE = "ssb_vp";
const MQ_DESKTOP = "(min-width: 768px)";

export function isLikelyDesktopUserAgent(userAgent: string): boolean {
  return !/Mobile|Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

export function applyViewportHintCookie(request: NextRequest, response: NextResponse): NextResponse {
  if (request.cookies.get(VIEWPORT_HINT_COOKIE)) return response;
  const ua = request.headers.get("user-agent") ?? "";
  response.cookies.set(VIEWPORT_HINT_COOKIE, isLikelyDesktopUserAgent(ua) ? "d" : "m", {
    path: "/",
    maxAge: 86_400,
    sameSite: "lax",
  });
  return response;
}

export function readViewportHintDesktopFromCookie(): boolean | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${VIEWPORT_HINT_COOKIE}=([dm])(?:;|$)`));
  if (!m) return null;
  return m[1] === "d";
}

export function subscribeDesktopViewport(onChange: () => void): () => void {
  const mq = window.matchMedia(MQ_DESKTOP);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function getDesktopViewportSnapshot(): boolean {
  const hint = readViewportHintDesktopFromCookie();
  if (hint !== null) return hint;
  return window.matchMedia(MQ_DESKTOP).matches;
}

export function getDesktopViewportServerSnapshot(): boolean {
  return false;
}
