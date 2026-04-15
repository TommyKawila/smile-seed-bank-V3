import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { upsertPromoCodeForCampaign } from "@/lib/promotion-campaign-sync";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const optionalTargetUrl = z.union([
  z.literal(""),
  z.literal("action:save"),
  z.string().url(),
]);

const BodySchema = z.object({
  name: z.string().min(1),
  image_url_desktop: z.string().url(),
  image_url_mobile: z.union([z.literal(""), z.string().url()]).optional().default(""),
  image_width: z.number().int().positive().nullable().optional(),
  image_height: z.number().int().positive().nullable().optional(),
  target_url: optionalTargetUrl.optional().default(""),
  save_to_profile: z.boolean().optional().default(false),
  display_delay_ms: z.number().int().min(0).max(600_000).optional().default(3000),
  display_mode: z.enum(["POPUP", "EASTER_EGG"]).optional().default("POPUP"),
  probability: z.number().min(0).max(1).optional().default(1),
  promo_code: z.string().min(3).max(32),
  discount_type: z.enum(["PERCENTAGE", "FIXED"]),
  discount_value: z.number().nonnegative(),
  target_paths: z.array(z.string().min(1)).min(1),
  start_at: z.string(),
  end_at: z.string(),
  total_limit: z.number().int().nonnegative(),
  per_user_limit: z.number().int().positive(),
  is_active: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const rows = await prisma.promotion_campaigns.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(bigintToJson(rows));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const startAt = new Date(d.start_at);
    const endAt = new Date(d.end_at);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }
    if (endAt <= startAt) {
      return NextResponse.json({ error: "end_at must be after start_at" }, { status: 400 });
    }
    if (d.discount_type === "PERCENTAGE" && d.discount_value > 100) {
      return NextResponse.json({ error: "Percentage cannot exceed 100" }, { status: 400 });
    }

    const row = await prisma.$transaction(async (tx) => {
      const promo = await upsertPromoCodeForCampaign(
        {
          promo_code: d.promo_code,
          discount_type: d.discount_type,
          discount_value: d.discount_value,
          total_limit: d.total_limit,
          per_user_limit: d.per_user_limit,
          start_at: startAt,
          end_at: endAt,
          is_active: d.is_active,
        },
        tx
      );

      return tx.promotion_campaigns.create({
        data: {
          name: d.name.trim(),
          image_url_desktop: d.image_url_desktop,
          image_url_mobile: d.image_url_mobile ?? "",
          image_width: d.image_width ?? null,
          image_height: d.image_height ?? null,
          target_url: d.target_url ?? "",
          save_to_profile: d.save_to_profile ?? false,
          display_delay_ms: d.display_delay_ms ?? 3000,
          display_mode: d.display_mode ?? "POPUP",
          probability: d.probability ?? 1,
          promo_code: promo.code,
          promo_code_id: promo.id,
          discount_type: d.discount_type,
          discount_value: new Prisma.Decimal(d.discount_value),
          target_paths: d.target_paths.map((p) => p.trim()),
          start_at: startAt,
          end_at: endAt,
          total_limit: d.total_limit,
          per_user_limit: d.per_user_limit,
          is_active: d.is_active,
        },
      });
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
