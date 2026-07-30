import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { orderAllowsAccess } from "@/lib/order-access-auth";
import { uploadSlip } from "@/lib/services/order-service";
import { rateLimitIp } from "@/lib/rate-limit-ip";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimitIp(`upload-slip:${clientIp(req)}`, 20, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const formData = await req.formData();
    const orderNumber = (formData.get("order_number") as string)?.trim();
    const file = formData.get("file") as File | null;
    const t = String(formData.get("t") ?? "").trim();
    const e = String(formData.get("e") ?? "").trim();

    if (!orderNumber || !file || file.size === 0) {
      return NextResponse.json(
        { error: "order_number and file are required" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Access denied", code: "TOKEN_REQUIRED" },
        { status: 401 }
      );
    }

    const { data, error } = await uploadSlip({ orderNumber, file });

    if (error || !data) {
      const status =
        error === "Order not found" ? 404
        : error === "Slip already uploaded" ? 400
        : error === "This order does not require slip upload" ? 400
        : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ success: true, slip_url: data.slip_url });
  } catch (err) {
    console.error("POST /api/storefront/orders/upload-slip error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
