import { requireAdminUser } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  DEFAULT_BULK_PRICING,
  type BulkPricingConfig,
} from "@/lib/wholesale-bulk-pricing";
import {
  getWholesaleSettings,
  updateBulkPricingConfig,
} from "@/services/wholesale-catalog-service";

export const dynamic = "force-dynamic";

const StrainTierSchema = z.object({
  minQty: z.coerce.number().int().min(1),
  maxQty: z.union([z.coerce.number().int().min(1), z.null()]),
  thbPerSeed: z.coerce.number().min(0),
});

const BulkPerkSchema = z.object({
  minTotalQty: z.coerce.number().int().min(1),
  thbPerSeed: z.coerce.number().min(0),
  freeCoaCount: z.coerce.number().int().min(0),
  freeCoaValueEachThb: z.coerce.number().min(0),
});

const PutSchema = z.object({
  version: z.literal(2).optional(),
  eurThb: z.coerce.number().positive(),
  microPackQty: z.coerce.number().int().min(1),
  microPackThb: z.coerce.number().min(0),
  strainTiers: z.array(StrainTierSchema).min(1).max(10),
  bulkPerks: z.array(BulkPerkSchema).min(1).max(10),
  coaPackageAThb: z.coerce.number().min(0),
  coaPackageBThb: z.coerce.number().min(0),
});

export async function GET() {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const settings = await getWholesaleSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const body = await req.json();
    const parsed = PutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const config: BulkPricingConfig = {
      ...DEFAULT_BULK_PRICING,
      ...parsed.data,
      version: 2,
    };
    const bulkPricing = await updateBulkPricingConfig(config);
    return NextResponse.json({ settings: { bulkPricing } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
