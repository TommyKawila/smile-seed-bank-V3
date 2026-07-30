import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { orderAllowsAccess } from "@/lib/order-access-auth";
import { getCheckoutPendingRestore } from "@/lib/services/order-service";
import { rateLimitIp } from "@/lib/rate-limit-ip";

export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function GET(req: NextRequest) {
  try {
    const limited = rateLimitIp(`checkout-pending:${clientIp(req)}`, 30, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const raw = req.nextUrl.searchParams.get("orderNumber")?.trim() ?? "";
    let orderNumber = raw;
    try {
      orderNumber = decodeURIComponent(raw);
    } catch {
      /* keep raw */
    }
    const t = req.nextUrl.searchParams.get("t")?.trim() ?? "";
    const e = req.nextUrl.searchParams.get("e")?.trim() ?? "";

    if (!orderNumber || orderNumber.length < 4) {
      return NextResponse.json({ ok: false, code: "INVALID_ORDER_NUMBER" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const allowed = await orderAllowsAccess(orderNumber, {
      userId: user?.id ?? null,
      t,
      e,
    });
    if (!allowed) {
      return NextResponse.json({ ok: false, code: "TOKEN_REQUIRED" }, { status: 401 });
    }

    const { data, error } = await getCheckoutPendingRestore(orderNumber);
    if (error || !data) {
      return NextResponse.json(
        { ok: false, code: error ?? "NOT_FOUND" },
        { status: error === "NOT_FOUND" ? 404 : 400 }
      );
    }
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("GET checkout-pending error:", err);
    return NextResponse.json({ ok: false, code: "SERVER" }, { status: 500 });
  }
}
