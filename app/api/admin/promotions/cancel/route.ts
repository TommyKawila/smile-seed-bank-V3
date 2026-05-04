import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { cancelPromotionCampaign } from "@/services/admin-service";

const CancelCampaignSchema = z.object({
  campaignId: z.string().regex(/^\d+$/),
});

export async function POST(req: Request) {
  await assertAdmin();
  const parsed = CancelCampaignSchema.parse(await req.json());
  const result = await cancelPromotionCampaign(parsed.campaignId);
  return NextResponse.json(result);
}
