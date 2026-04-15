"use server";

import { Prisma } from "@prisma/client";
import { validateCoupon } from "@/lib/services/coupon-service";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/** Server-side promo validation for checkout (same rules as POST /api/storefront/coupons/validate). */
export async function validatePromotionCampaignCode(input: {
  code: string;
  subtotal: number;
  email: string | null;
  user_id: string | null;
}) {
  const code = input.code.trim().toUpperCase();
  return validateCoupon({
    code,
    subtotal: input.subtotal,
    email: input.email,
    user_id: input.user_id,
  });
}

export type SavePromotionResult =
  | { ok: true; savedToProfile: true }
  | { ok: true; savedToProfile: false; guestHint: string }
  | { ok: false; error: string };

/** Persist campaign → user; guests get a client-side hint (caller stores localStorage). */
export async function savePromotionToUser(campaignId: string): Promise<SavePromotionResult> {
  let id: bigint;
  try {
    id = BigInt(campaignId);
  } catch {
    return { ok: false, error: "Invalid campaign" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return {
      ok: true,
      savedToProfile: false,
      guestHint: "บันทึกในเครื่องแล้ว — เข้าสู่ระบบเพื่อซิงค์กับบัญชี",
    };
  }

  const campaign = await prisma.promotion_campaigns.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!campaign) {
    return { ok: false, error: "Campaign not found" };
  }

  const hasCustomer = await prisma.customers.findUnique({
    where: { id: user.id },
    select: { id: true },
  });
  if (!hasCustomer) {
    await prisma.customers.create({
      data: {
        id: user.id,
        email: user.email ?? null,
        full_name:
          (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
          (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
          null,
      },
    });
  }

  try {
    await prisma.userSavedPromotion.create({
      data: {
        user_id: user.id,
        promotion_campaign_id: id,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: true, savedToProfile: true };
    }
    throw e;
  }

  return { ok: true, savedToProfile: true };
}
