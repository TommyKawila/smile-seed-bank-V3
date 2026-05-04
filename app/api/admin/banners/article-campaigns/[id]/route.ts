import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { updateArticleCampaignBanners } from "@/services/promotion-campaign-service";

const ArticleCampaignBannerSchema = z.object({
  articleBannerThUrl: z.string().trim().optional().nullable(),
  articleBannerEnUrl: z.string().trim().optional().nullable(),
  articleBannerMobileThUrl: z.string().trim().optional().nullable(),
  articleBannerMobileEnUrl: z.string().trim().optional().nullable(),
});

function campaignId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) throw new Error("Invalid campaign id");
  return BigInt(raw);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await assertAdmin();
  const parsed = ArticleCampaignBannerSchema.parse(await req.json());
  const campaign = await updateArticleCampaignBanners(campaignId(params.id), parsed);
  revalidatePath("/blog");
  return NextResponse.json({ campaign });
}
