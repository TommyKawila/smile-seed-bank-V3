import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCoupon } from "@/lib/services/coupon-service";

const BodySchema = z.object({
  code: z.string().min(1).trim().toUpperCase(),
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
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { code, subtotal, email, phone, user_id } = parsed.data;
    const result = await validateCoupon({
      code,
      subtotal,
      email: email ?? null,
      user_id: user_id ?? null,
      phone: phone ?? null,
    });

    if (!result.ok) {
      const err = result.error;
      switch (err.type) {
        case "NOT_FOUND":
          return NextResponse.json({ error: "ไม่พบโค้ดนี้" }, { status: 400 });
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
            { error: "ขออภัย โค้ดส่วนลดนี้หมดอายุแล้ว" },
            { status: 400 }
          );
        case "MIN_SPEND":
          return NextResponse.json(
            {
              error: `ยอดไม่ถึงเกณฑ์ — ต้องซื้อขั้นต่ำ ฿${err.minSpend.toLocaleString("th-TH")}`,
            },
            { status: 400 }
          );
        case "ALREADY_USED":
          return NextResponse.json({ error: "Used" }, { status: 400 });
        case "PHONE_ALREADY_USED":
          return NextResponse.json(
            { error: "สิทธิ์นี้ถูกใช้งานไปแล้วสำหรับเบอร์โทรศัพท์นี้" },
            { status: 400 }
          );
        case "CAMPAIGN_EXHAUSTED":
          return NextResponse.json(
            { error: "โค้ดนี้ถูกใช้ครบโควตาแล้ว" },
            { status: 400 }
          );
        case "CAMPAIGN_INACTIVE":
          return NextResponse.json(
            { error: "โค้ดนี้ไม่สามารถใช้ได้ในช่วงเวลานี้" },
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
