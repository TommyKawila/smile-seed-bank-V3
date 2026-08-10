import { requireAdminUser } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateNewSeedsStorefront } from "@/lib/revalidate-new-seeds";
import { listNewSeedsBreederSummary } from "@/services/new-seeds-admin-service";
import {
  reorderNewSeedsBreederBanners,
  upsertNewSeedsBreederBanner,
} from "@/services/new-seeds-breeder-banner-service";

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
    const breederSummary = await listNewSeedsBreederSummary();
    return NextResponse.json({ breederSummary });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const __adminGate = await requireAdminUser();
  if (!__adminGate.ok) return __adminGate.response;
  try {
    const body = await req.json();
    const parsed = UpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const banner = await upsertNewSeedsBreederBanner(parsed.data);
    revalidateNewSeedsStorefront();
    return NextResponse.json({ banner });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const __adminGate = await requireAdminUser();
  if (!__adminGate.ok) return __adminGate.response;
  try {
    const body = await req.json();
    const parsed = ReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    await reorderNewSeedsBreederBanners(parsed.data.orderedBreederIds);
    revalidateNewSeedsStorefront();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
