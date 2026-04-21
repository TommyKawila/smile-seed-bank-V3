import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { bigintToJson } from "@/lib/bigint-json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ coupons: [] });
    }

    const rows = await prisma.userClaimedCoupon.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      include: {
        promo_codes: {
          select: {
            id: true,
            code: true,
            discount_type: true,
            discount_value: true,
            min_spend: true,
            expiry_date: true,
            first_order_only: true,
            is_active: true,
            badge_url: true,
            badge_lottie_url: true,
          },
        },
      },
    });

    const redemptions = await prisma.coupon_redemptions.findMany({
      where: { user_id: user.id, coupon_id: { not: null } },
      select: { coupon_id: true, order_id: true },
    });
    const activeOrderIds = redemptions
      .map((r) => r.order_id)
      .filter((v): v is bigint => v != null);
    const activeOrders = activeOrderIds.length
      ? await prisma.orders.findMany({
          where: { id: { in: activeOrderIds }, status: { notIn: ["CANCELLED", "VOID", "REJECTED"] } },
          select: { id: true },
        })
      : [];
    const activeOrderIdSet = new Set(activeOrders.map((o) => o.id.toString()));
    const usedCouponIds = new Set(
      redemptions
        .filter(
          (r) =>
            r.coupon_id != null &&
            (r.order_id == null || activeOrderIdSet.has(r.order_id.toString()))
        )
        .map((r) => r.coupon_id!.toString())
    );

    const coupons = rows
      .map((r) => r.promo_codes)
      .filter((p): p is NonNullable<typeof p> => p != null)
      .map((p) => ({
        id: Number(p.id),
        code: p.code,
        discount_type: p.discount_type ?? "PERCENTAGE",
        discount_value: Number(p.discount_value ?? 0),
        min_spend: p.min_spend != null ? Number(p.min_spend) : null,
        expiry_date: p.expiry_date?.toISOString() ?? null,
        first_order_only: p.first_order_only,
        is_active: p.is_active !== false,
        badge_url: p.badge_url?.trim() ? String(p.badge_url) : null,
        badge_lottie_url: p.badge_lottie_url?.trim() ? String(p.badge_lottie_url) : null,
        used: usedCouponIds.has(p.id.toString()),
      }));

    return NextResponse.json(bigintToJson({ coupons }));
  } catch (e) {
    console.error("[coupons/collected] GET", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
