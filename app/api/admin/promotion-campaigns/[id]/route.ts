import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import {
  upsertPromoCodeForCampaign,
  deactivatePromoCodeById,
  normalizeCampaignPromoCode,
} from "@/lib/promotion-campaign-sync";

export const dynamic = "force-dynamic";

const optionalTargetUrl = z.union([
  z.literal(""),
  z.literal("action:save"),
  z.string().url(),
]);

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  image_url_desktop: z.string().url().optional(),
  image_url_mobile: z.union([z.literal(""), z.string().url()]).optional(),
  image_width: z.number().int().positive().nullable().optional(),
  image_height: z.number().int().positive().nullable().optional(),
  target_url: optionalTargetUrl.optional(),
  save_to_profile: z.boolean().optional(),
  display_delay_ms: z.number().int().min(0).max(600_000).optional(),
  display_mode: z.enum(["POPUP", "EASTER_EGG"]).optional(),
  probability: z.number().min(0).max(1).optional(),
  promo_code: z.string().min(3).max(32).optional(),
  discount_type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discount_value: z.number().nonnegative().optional(),
  target_paths: z.array(z.string().min(1)).min(1).optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  total_limit: z.number().int().nonnegative().optional(),
  per_user_limit: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await ctx.params;
    const id = BigInt(idStr);
    const existing = await prisma.promotion_campaigns.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const parsed = PatchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const d = parsed.data;

    const startAt = d.start_at != null ? new Date(d.start_at) : existing.start_at;
    const endAt = d.end_at != null ? new Date(d.end_at) : existing.end_at;
    if (d.start_at != null || d.end_at != null) {
      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
      }
      if (endAt <= startAt) {
        return NextResponse.json({ error: "end_at must be after start_at" }, { status: 400 });
      }
    }

    const discountType = d.discount_type ?? existing.discount_type;
    const discountVal = d.discount_value ?? Number(existing.discount_value);
    if (discountType === "PERCENTAGE" && discountVal > 100) {
      return NextResponse.json({ error: "Percentage cannot exceed 100" }, { status: 400 });
    }

    const nextCodeRaw = d.promo_code ?? existing.promo_code;
    const nextCode = normalizeCampaignPromoCode(nextCodeRaw);

    const oldPromoId = existing.promo_code_id;
    if (d.promo_code != null && nextCode !== existing.promo_code && oldPromoId != null) {
      await deactivatePromoCodeById(oldPromoId);
    }

    const promo = await upsertPromoCodeForCampaign({
      promo_code: nextCode,
      discount_type: discountType,
      discount_value: discountVal,
      total_limit: d.total_limit ?? existing.total_limit,
      per_user_limit: d.per_user_limit ?? existing.per_user_limit,
      start_at: startAt,
      end_at: endAt,
      is_active: d.is_active ?? existing.is_active,
    });

    const row = await prisma.promotion_campaigns.update({
      where: { id },
      data: {
        ...(d.name != null ? { name: d.name.trim() } : {}),
        ...(d.image_url_desktop != null ? { image_url_desktop: d.image_url_desktop } : {}),
        ...(d.image_url_mobile !== undefined ? { image_url_mobile: d.image_url_mobile ?? "" } : {}),
        ...(d.image_width !== undefined ? { image_width: d.image_width } : {}),
        ...(d.image_height !== undefined ? { image_height: d.image_height } : {}),
        ...(d.target_url !== undefined ? { target_url: d.target_url ?? "" } : {}),
        ...(d.save_to_profile !== undefined ? { save_to_profile: d.save_to_profile } : {}),
        ...(d.display_delay_ms != null ? { display_delay_ms: d.display_delay_ms } : {}),
        ...(d.display_mode != null ? { display_mode: d.display_mode } : {}),
        ...(d.probability != null ? { probability: d.probability } : {}),
        promo_code: promo.code,
        promo_code_id: promo.id,
        ...(d.discount_type != null ? { discount_type: d.discount_type } : {}),
        ...(d.discount_value != null
          ? { discount_value: new Prisma.Decimal(d.discount_value) }
          : {}),
        ...(d.target_paths != null ? { target_paths: d.target_paths.map((p) => p.trim()) } : {}),
        start_at: startAt,
        end_at: endAt,
        ...(d.total_limit != null ? { total_limit: d.total_limit } : {}),
        ...(d.per_user_limit != null ? { per_user_limit: d.per_user_limit } : {}),
        ...(d.is_active != null ? { is_active: d.is_active } : {}),
      },
    });

    return NextResponse.json(bigintToJson(row));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "promo_code already used" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await ctx.params;
    const id = BigInt(idStr);
    const existing = await prisma.promotion_campaigns.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.promo_code_id != null) {
      await deactivatePromoCodeById(existing.promo_code_id);
    }
    await prisma.promotion_campaigns.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
