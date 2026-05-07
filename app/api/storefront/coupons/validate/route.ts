import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveSkipCouponPerUserReuseForAdminSession } from "@/lib/coupon-usage-admin-bypass";
import { createClient } from "@/lib/supabase/server";
import { validateCoupon } from "@/lib/services/coupon-service";

const BodySchema = z.object({
  code: z.string().trim().toUpperCase().min(1, "Please enter a promo code"),
  subtotal: z.coerce.number().min(0),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { code, subtotal, email, phone, user_id } = parsed.data;
    const supabase = await createClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    const skipReuse = resolveSkipCouponPerUserReuseForAdminSession({
      sessionUser,
      requestUserId: user_id ?? null,
    });

    const result = await validateCoupon({
      code,
      subtotal,
      email: email ?? null,
      user_id: user_id ?? null,
      phone: phone ?? null,
      skipPerUserCouponReuseChecks: skipReuse,
    });

    if (!result.ok) {
      const err = result.error;
      switch (err.type) {
        case "NOT_FOUND":
          return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 400 });
        case "REQUIRE_LOGIN":
          return NextResponse.json(
            { error: err.message, requireLogin: true },
            { status: 401 }
          );
        case "FIRST_ORDER_ONLY":
          return NextResponse.json(
            { error: "This code is for new customers only" },
            { status: 400 }
          );
        case "EXPIRED":
          return NextResponse.json(
            { error: "Invalid or expired promo code" },
            { status: 400 }
          );
        case "MIN_SPEND":
          return NextResponse.json(
            {
              error: `Minimum order amount not met — shop at least ฿${err.minSpend.toLocaleString("en-US")}`,
            },
            { status: 400 }
          );
        case "ALREADY_USED":
          return NextResponse.json({ error: "This promo code has already been used" }, { status: 400 });
        case "PHONE_ALREADY_USED":
          return NextResponse.json(
            { error: "This promo has already been used for this phone number" },
            { status: 400 }
          );
        case "CAMPAIGN_EXHAUSTED":
          return NextResponse.json(
            { error: "This promo code has reached its usage limit" },
            { status: 400 }
          );
        case "CAMPAIGN_INACTIVE":
          return NextResponse.json(
            { error: "This promo code cannot be used at this time" },
            { status: 400 }
          );
        case "SERVER_ERROR":
          return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, ...result.data });
  } catch (e) {
    console.error("coupons/validate error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
