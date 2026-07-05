import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCheckoutPendingRestore } from "@/lib/services/order-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("orderNumber")?.trim() ?? "";
    let orderNumber = raw;
    try {
      orderNumber = decodeURIComponent(raw);
    } catch {
      /* keep raw */
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await getCheckoutPendingRestore(orderNumber, user?.id ?? null);
    if (!data) {
      const code = error ?? "UNKNOWN";
      const status =
        code === "LOGIN_REQUIRED"
          ? 401
          : code === "FORBIDDEN"
            ? 403
            : code === "NOT_FOUND" || code === "INVALID_ORDER_NUMBER"
              ? 404
              : 400;
      return NextResponse.json({ ok: false, code }, { status });
    }
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("GET checkout-pending error:", err);
    return NextResponse.json({ ok: false, code: "SERVER" }, { status: 500 });
  }
}
