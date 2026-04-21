import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  promo_code_id: z.coerce.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const promo = await prisma.promo_codes.findUnique({
      where: { id: BigInt(parsed.data.promo_code_id) },
    });
    if (!promo || !promo.is_active) {
      return NextResponse.json({ error: "Promo not found" }, { status: 404 });
    }

    try {
      await prisma.userClaimedCoupon.create({
        data: {
          user_id: user.id,
          promo_code_id: BigInt(parsed.data.promo_code_id),
        },
      });
      return NextResponse.json({ ok: true, alreadyCollected: false });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json({ ok: true, alreadyCollected: true });
      }
      throw e;
    }
  } catch (e) {
    console.error("[coupons/collect] POST", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
