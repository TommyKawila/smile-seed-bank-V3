import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pathMatchesCampaignTargets } from "@/lib/promotion-campaign-utils";
import { bigintToJson } from "@/lib/bigint-json";

export const dynamic = "force-dynamic";

/**
 * Active campaigns for pop-up: path + time + quota. No secrets.
 */
export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path") ?? "/";
    const now = new Date();

    const rows = await prisma.promotion_campaigns.findMany({
      where: {
        is_active: true,
        start_at: { lte: now },
        end_at: { gte: now },
      },
      orderBy: { id: "desc" },
    });

    const matched = rows.filter(
      (r) =>
        r.target_paths.length > 0 &&
        pathMatchesCampaignTargets(path, r.target_paths) &&
        (r.total_limit === 0 || r.usage_count < r.total_limit)
    );

    const payload = matched.map((r) => ({
      id: String(r.id),
      name: r.name,
      image_url_desktop: r.image_url_desktop,
      image_url_mobile: r.image_url_mobile,
      image_width: r.image_width,
      image_height: r.image_height,
      target_url: r.target_url,
      save_to_profile: r.save_to_profile,
      display_delay_ms: r.display_delay_ms,
      display_mode: r.display_mode,
      probability: r.probability,
      promo_code: r.promo_code,
      discount_type: r.discount_type,
      discount_value: String(r.discount_value),
    }));

    return NextResponse.json(bigintToJson(payload));
  } catch (e) {
    console.error("promotion-campaigns GET", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
