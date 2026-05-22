import { NextRequest, NextResponse } from "next/server";
import { storefrontDeferCssHeadInjection } from "@/lib/storefront-defer-css";

const DEFER_CSS_SUBREQUEST = "x-ssb-defer-css";

export function shouldApplyStorefrontDeferCss(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const path = request.nextUrl.pathname;
  if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/_next")) {
    return false;
  }
  if (/\.[a-z0-9]+$/i.test(path)) return false;
  return true;
}

export async function applyStorefrontDeferCssTransform(
  request: NextRequest
): Promise<NextResponse | null> {
  if (typeof HTMLRewriter === "undefined") return null;
  if (request.headers.get(DEFER_CSS_SUBREQUEST) === "1") return null;

  const headers = new Headers(request.headers);
  headers.set(DEFER_CSS_SUBREQUEST, "1");

  const res = await fetch(request.url, { headers, redirect: "manual" });
  const ct = res.headers.get("content-type") ?? "";
  if (!res.ok || !ct.includes("text/html")) {
    return null;
  }

  const inject = storefrontDeferCssHeadInjection();

  return new HTMLRewriter()
    .on("head", {
      element(element) {
        element.prepend(inject, { html: true });
      },
    })
    .transform(res) as unknown as NextResponse;
}
