import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateClearanceStorefront } from "@/lib/revalidate-clearance";
import { listClearanceBreederSummary } from "@/services/clearance-admin-service";
import {
  reorderClearanceBreederBanners,
  upsertClearanceBreederBanner,
} from "@/services/clearance-breeder-banner-service";

export const dynamic = "force-dynamic";

const UpsertSchema = z.object({
  breederId: z.coerce.number().int().positive(),
  imageUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  titleTh: z.string().max(200).optional(),
  titleEn: z.string().max(200).nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

const ReorderSchema = z.object({
  orderedBreederIds: z.array(z.coerce.number().int().positive()).min(1),
});

export async function GET() {
  try {
    const breederSummary = await listClearanceBreederSummary();
    return NextResponse.json({ breederSummary });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const banner = await upsertClearanceBreederBanner(parsed.data);
    revalidateClearanceStorefront();
    return NextResponse.json({ banner });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    await reorderClearanceBreederBanners(parsed.data.orderedBreederIds);
    revalidateClearanceStorefront();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
