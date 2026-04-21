/**
 * Coupon Service — validate coupons and list available ones.
 * Uses postgres driver via getSql() for cache-bypass.
 */
import { getSql } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { isCouponPercentageType } from "@/lib/discount-utils";
import type { DiscountType } from "@/types/supabase";

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface CouponRow {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_spend: number | null;
  usage_limit_per_user: number | null;
  expiry_date: string | null;
  requires_auth: boolean | null;
  first_order_only: boolean | null;
}

export interface ValidateCouponInput {
  code: string;
  subtotal: number;
  email: string | null;
  user_id: string | null;
  /** Customer phone (raw). Used for cross-account single-use fraud check. */
  phone?: string | null;
}

export type ValidateCouponError =
  | { type: "NOT_FOUND" }
  | { type: "REQUIRE_LOGIN"; message: string; requireLogin: true }
  | { type: "FIRST_ORDER_ONLY" }
  | { type: "EXPIRED" }
  | { type: "MIN_SPEND"; minSpend: number }
  | { type: "ALREADY_USED" }
  | { type: "PHONE_ALREADY_USED" }
  | { type: "CAMPAIGN_EXHAUSTED" }
  | { type: "CAMPAIGN_INACTIVE" }
  | { type: "SERVER_ERROR"; message: string };

export interface ValidateCouponSuccess {
  promo_code_id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
}

export type ValidateCouponResult =
  | { ok: true; data: ValidateCouponSuccess }
  | { ok: false; error: ValidateCouponError };

export interface AvailableCoupon {
  code: string;
  discount_type: string;
  discount_value: number;
  min_spend: number | null;
}

export interface EligibleCoupon {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_spend: number | null;
  expiry_date: string | null;
  first_order_only: boolean | null;
  is_active: boolean;
  /** Public badge image URL; fallback when no Lottie */
  badge_url: string | null;
  /** Public Lottie JSON URL; preferred for floating badge when set */
  badge_lottie_url: string | null;
}

// ─── validateCoupon ───────────────────────────────────────────────────────────

const REQUIRE_LOGIN_MSG =
  "สมัครสมาชิกหรือเข้าสู่ระบบเพื่อใช้โค้ดส่วนลด (Google, อีเมล หรือ LINE)";

export async function validateCoupon(
  input: ValidateCouponInput
): Promise<ValidateCouponResult> {
  try {
    const { code, subtotal, email, user_id } = input;

    if (!user_id) {
      return {
        ok: false,
        error: {
          type: "REQUIRE_LOGIN",
          message: REQUIRE_LOGIN_MSG,
          requireLogin: true,
        },
      };
    }

    const sql = getSql();

    // Fetch promo code
    const rows = await sql<CouponRow[]>`
      SELECT id, code, discount_type, discount_value, min_spend,
             usage_limit_per_user, expiry_date, requires_auth, first_order_only
      FROM promo_codes
      WHERE code = ${code} AND is_active = true
      LIMIT 1
    `;
    const promo = rows[0];
    if (!promo) return { ok: false, error: { type: "NOT_FOUND" } };

    const campaign = await prisma.promotion_campaigns.findUnique({
      where: { promo_code_id: BigInt(promo.id) },
    });
    if (campaign) {
      const now = new Date();
      if (!campaign.is_active || now < campaign.start_at || now > campaign.end_at) {
        return { ok: false, error: { type: "CAMPAIGN_INACTIVE" } };
      }
      if (campaign.total_limit > 0 && campaign.usage_count >= campaign.total_limit) {
        return { ok: false, error: { type: "CAMPAIGN_EXHAUSTED" } };
      }
    }

    // Auth check
    if (promo.requires_auth && !user_id) {
      const loginMsg =
        promo.code === "WELCOME10"
          ? "กรุณาเข้าสู่ระบบเพื่อใช้โค้ด WELCOME10 และรับส่วนลดสมาชิกใหม่ 10%"
          : "Please login to use this code";
      return { ok: false, error: { type: "REQUIRE_LOGIN", message: loginMsg, requireLogin: true } };
    }

    // First order check
    if (promo.first_order_only) {
      if (!user_id && !email) {
        return { ok: false, error: { type: "REQUIRE_LOGIN", message: "Please login to use this code", requireLogin: true } };
      }
      const hasOrder = await _hasCompletedOrder(sql, user_id, email);
      if (hasOrder) return { ok: false, error: { type: "FIRST_ORDER_ONLY" } };
    }

    // Expiry check (invalid when current time is after expiry_date)
    if (promo.expiry_date) {
      const expMs = new Date(promo.expiry_date).getTime();
      if (Number.isFinite(expMs) && Date.now() > expMs) {
        return { ok: false, error: { type: "EXPIRED" } };
      }
    }

    // Min spend check
    if (promo.min_spend != null && promo.min_spend > 0 && subtotal < promo.min_spend) {
      return { ok: false, error: { type: "MIN_SPEND", minSpend: promo.min_spend } };
    }

    // Usage limit check
    if (email || user_id) {
      const usedCount = await _getUsageCount(sql, promo.id, user_id, email);
      const limit = promo.usage_limit_per_user ?? 1;
      if (usedCount >= limit) return { ok: false, error: { type: "ALREADY_USED" } };
    }

    // ── Phone-based cross-account fraud check ───────────────────────────────
    // For single-use codes, block if ANY past order with this coupon used the
    // same phone (normalized digits only), even under a different account.
    const limit = promo.usage_limit_per_user ?? 1;
    if (limit <= 1) {
      const phoneDigits = _normalizePhone(input.phone);
      if (phoneDigits.length >= 9) {
        const usedByPhone = await _hasOrderUsingPromoByPhone(sql, promo.id, phoneDigits);
        if (usedByPhone) return { ok: false, error: { type: "PHONE_ALREADY_USED" } };
      }
    }

    const discountAmount = isCouponPercentageType(promo.discount_type)
      ? Math.round((subtotal * promo.discount_value) / 100)
      : promo.discount_value;

    return {
      ok: true,
      data: {
        promo_code_id: promo.id,
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        discount_amount: discountAmount,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[coupon-service] validateCoupon error:", message);
    return { ok: false, error: { type: "SERVER_ERROR", message } };
  }
}

// ─── getAvailableCoupons ──────────────────────────────────────────────────────

export async function getAvailableCoupons(
  subtotal: number,
  email: string | null
): Promise<AvailableCoupon[]> {
  try {
    const sql = getSql();
    const rows = email
      ? await sql<AvailableCoupon[]>`
          SELECT p.code, p.discount_type, p.discount_value, p.min_spend
          FROM promo_codes p
          WHERE p.is_active = true
            AND (p.expiry_date IS NULL OR p.expiry_date > now())
            AND (p.min_spend IS NULL OR p.min_spend <= ${subtotal})
            AND (
              SELECT COUNT(*) FROM coupon_redemptions cr
              WHERE cr.coupon_id = p.id AND cr.email = ${email}
            ) < COALESCE(p.usage_limit_per_user, 1)
          ORDER BY p.code
        `
      : await sql<AvailableCoupon[]>`
          SELECT p.code, p.discount_type, p.discount_value, p.min_spend
          FROM promo_codes p
          WHERE p.is_active = true
            AND (p.expiry_date IS NULL OR p.expiry_date > now())
            AND (p.min_spend IS NULL OR p.min_spend <= ${subtotal})
          ORDER BY p.code
        `;
    return rows;
  } catch (err) {
    console.error("[coupon-service] getAvailableCoupons error:", err);
    return [];
  }
}

// ─── getEligibleCoupons ───────────────────────────────────────────────────────

/**
 * Returns all active coupons the given user is still eligible for.
 * Filters out: already redeemed, first_order_only when user has orders, expired.
 * Sorted best-value first (highest discount_value).
 */
export async function getEligibleCoupons(
  userId: string,
  email: string | null
): Promise<EligibleCoupon[]> {
  try {
    const sql = getSql();

    // Fetch all active, non-expired, non-fully-used coupons for this user
    const rows = await sql<EligibleCoupon[]>`
      SELECT p.id, p.code, p.discount_type, p.discount_value,
             p.min_spend, p.expiry_date, p.first_order_only,
             p.is_active, p.badge_url, p.badge_lottie_url
      FROM promo_codes p
      WHERE p.is_active = true
        AND (p.expiry_date IS NULL OR p.expiry_date > now())
        AND (
          SELECT COUNT(*) FROM coupon_redemptions cr
          WHERE cr.coupon_id = p.id
            AND (
              cr.user_id = ${userId}
              ${email ? sql`OR cr.email = ${email}` : sql``}
            )
        ) < COALESCE(p.usage_limit_per_user, 1)
      ORDER BY p.discount_value DESC
    `;

    // Post-filter: remove first_order_only coupons when user has a completed order
    const hasOrder = await _hasCompletedOrder(sql, userId, email);
    return rows
      .filter((c) => !(c.first_order_only && hasOrder))
      .map((c) => ({
        ...c,
        is_active: c.is_active !== false,
        badge_url:
          c.badge_url != null && String(c.badge_url).trim() !== ""
            ? String(c.badge_url)
            : null,
        badge_lottie_url:
          c.badge_lottie_url != null && String(c.badge_lottie_url).trim() !== ""
            ? String(c.badge_lottie_url)
            : null,
      }));
  } catch (err) {
    console.error("[coupon-service] getEligibleCoupons error:", err);
    return [];
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

type SqlClient = ReturnType<typeof getSql>;

async function _hasCompletedOrder(
  sql: SqlClient,
  userId: string | null,
  email: string | null
): Promise<boolean> {
  if (userId) {
    const rows = await sql`
      SELECT id FROM orders
      WHERE customer_id = ${userId} AND status IN ('PAID', 'SHIPPED')
      LIMIT 1
    `;
    return rows.length > 0;
  }
  if (email) {
    const customers = await sql`
      SELECT id FROM customers WHERE email = ${email} LIMIT 1
    `;
    const cust = customers[0] as { id: string } | undefined;
    if (!cust) return false;
    const rows = await sql`
      SELECT id FROM orders
      WHERE customer_id = ${cust.id} AND status IN ('PAID', 'SHIPPED')
      LIMIT 1
    `;
    return rows.length > 0;
  }
  return false;
}

// ─── hasUserUsedWelcomeCoupon ─────────────────────────────────────────────────

/**
 * Returns true if the given user has already redeemed WELCOME10.
 * Checks both coupon_redemptions (by user_id) and coupon_redemptions (by email).
 */
export async function hasUserUsedWelcomeCoupon(userId: string): Promise<boolean> {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT cr.id
      FROM coupon_redemptions cr
      JOIN promo_codes p ON p.id = cr.coupon_id
      WHERE p.code = 'WELCOME10'
        AND cr.user_id = ${userId}
      LIMIT 1
    `;
    return rows.length > 0;
  } catch (err) {
    console.error("[coupon-service] hasUserUsedWelcomeCoupon error:", err);
    return false;
  }
}

function _normalizePhone(phone: string | null | undefined): string {
  return String(phone ?? "").replace(/\D/g, "");
}

/**
 * Returns true if any non-cancelled order by this phone has already redeemed the given coupon.
 * Matches phone against `orders.shipping_phone`, `orders.customer_phone`, and `customers.phone`
 * (via `orders.customer_id`), comparing digit-only normalized forms.
 */
async function _hasOrderUsingPromoByPhone(
  sql: SqlClient,
  couponId: number,
  phoneDigits: string
): Promise<boolean> {
  const rows = await sql`
    SELECT 1
    FROM coupon_redemptions cr
    JOIN orders o ON o.id = cr.order_id
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE cr.coupon_id = ${couponId}
      AND o.status NOT IN ('CANCELLED', 'VOID', 'REJECTED')
      AND (
        regexp_replace(COALESCE(o.shipping_phone, ''), '[^0-9]', '', 'g') = ${phoneDigits}
        OR regexp_replace(COALESCE(o.customer_phone, ''), '[^0-9]', '', 'g') = ${phoneDigits}
        OR regexp_replace(COALESCE(c.phone, ''), '[^0-9]', '', 'g') = ${phoneDigits}
      )
    LIMIT 1
  `;
  return rows.length > 0;
}

async function _getUsageCount(
  sql: SqlClient,
  couponId: number,
  userId: string | null,
  email: string | null
): Promise<number> {
  let rows: unknown[];
  if (userId && email) {
    rows = await sql`
      SELECT id FROM coupon_redemptions
      WHERE coupon_id = ${couponId}
        AND (user_id = ${userId} OR email = ${email})
    `;
  } else if (userId) {
    rows = await sql`
      SELECT id FROM coupon_redemptions WHERE coupon_id = ${couponId} AND user_id = ${userId}
    `;
  } else {
    rows = await sql`
      SELECT id FROM coupon_redemptions WHERE coupon_id = ${couponId} AND email = ${email!}
    `;
  }
  return rows.length;
}
