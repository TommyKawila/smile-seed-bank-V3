import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth-utils";
import { bigintToJson } from "@/lib/bigint-json";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  await assertAdmin();
  const rows = await prisma.$queryRaw`
    SELECT
      pc.id,
      pc.breeder_id,
      b.name AS breeder_name,
      pc.discount_percent,
      pc.ends_at,
      CASE
        WHEN pc.status = 'ACTIVE' AND pc.ends_at IS NOT NULL AND pc.ends_at < NOW() THEN 'EXPIRED'
        ELSE pc.status
      END AS status,
      pc.created_at
    FROM promotion_campaigns pc
    LEFT JOIN breeders b ON b.id = pc.breeder_id
    WHERE pc.campaign_kind = 'BULK_DISCOUNT'
      AND pc.discount_percent IS NOT NULL
      AND pc.discount_percent > 0
      AND pc.status = 'ACTIVE'
      AND (pc.ends_at IS NULL OR pc.ends_at >= NOW())
    ORDER BY pc.created_at DESC
    LIMIT 50
  `;

  return NextResponse.json(bigintToJson(rows));
}
