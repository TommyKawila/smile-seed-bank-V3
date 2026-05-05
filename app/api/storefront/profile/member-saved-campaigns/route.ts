import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { bigintToJson } from "@/lib/bigint-json";

export const dynamic = "force-dynamic";

/** All `user_saved_promotions` rows with campaign join (including expired) for profile UI. */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ items: [] });
    }

    const rows = await prisma.userSavedPromotion.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      include: {
        promotion_campaigns: {
          select: {
            id: true,
            name: true,
            promo_code: true,
            discount_type: true,
            discount_value: true,
            end_at: true,
            is_active: true,
          },
        },
      },
    });

    const items = rows
      .map((r) => {
        const c = r.promotion_campaigns;
        if (!c) return null;
        return {
          campaign_id: String(c.id),
          name: c.name,
          promo_code: c.promo_code,
          discount_type: c.discount_type,
          discount_value: String(c.discount_value),
          end_at: c.end_at.toISOString(),
          is_active: c.is_active,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    return NextResponse.json(bigintToJson({ items }));
  } catch (e) {
    console.error("[member-saved-campaigns] GET", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
