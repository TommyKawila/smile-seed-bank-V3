import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { updateBulkDiscountByBreeder } from "@/services/admin-service";

const BulkDiscountSchema = z.object({
  breederId: z.string().regex(/^\d+$/),
  discountPercent: z.coerce.number().int().min(0).max(100),
  endsAt: z.string().datetime().nullable().optional(),
  articleBannerThUrl: z.union([z.literal(""), z.string().url()]).nullable().optional(),
  articleBannerEnUrl: z.union([z.literal(""), z.string().url()]).nullable().optional(),
  articleBannerMobileThUrl: z.union([z.literal(""), z.string().url()]).nullable().optional(),
  articleBannerMobileEnUrl: z.union([z.literal(""), z.string().url()]).nullable().optional(),
});

export async function POST(req: Request) {
  await assertAdmin();
  const parsed = BulkDiscountSchema.parse(await req.json());
  const result = await updateBulkDiscountByBreeder(
    parsed.breederId,
    parsed.discountPercent,
    parsed.endsAt ? new Date(parsed.endsAt) : null,
    {
      thUrl: parsed.articleBannerThUrl?.trim() || null,
      enUrl: parsed.articleBannerEnUrl?.trim() || null,
      mobileThUrl: parsed.articleBannerMobileThUrl?.trim() || null,
      mobileEnUrl: parsed.articleBannerMobileEnUrl?.trim() || null,
    }
  );
  return NextResponse.json(result);
}
