import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth-utils";
import { saveMockup } from "@/services/mockupService";
import { DEFAULT_LABEL_POSITION } from "@/types/label";

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  scale: z.number().positive(),
  rotation: z.number(),
});

const bodySchema = z.object({
  id: z.string().uuid().optional(),
  species: z.string().min(1),
  strainName: z.string(),
  quantity: z.number(),
  purity: z.number(),
  germination: z.number(),
  collectedDate: z.string(),
  testedDate: z.string(),
  expiryDate: z.string(),
  producerName: z.string(),
  producerLicenseRP2: z.string(),
  distributorName: z.string(),
  distributorLicensePP3: z.string(),
  address: z.string(),
  storageInstructions: z.string(),
  bgImageUrl: z.union([z.string().url(), z.literal(""), z.undefined()]).optional(),
  labelPosition: positionSchema.default(DEFAULT_LABEL_POSITION),
});

export async function POST(req: Request) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const bg = parsed.data.bgImageUrl?.trim();
    const saved = await saveMockup({
      ...parsed.data,
      id: parsed.data.id ?? crypto.randomUUID(),
      bgImageUrl: bg || undefined,
      labelPosition: parsed.data.labelPosition,
    });

    const origin = new URL(req.url).origin;
    return NextResponse.json({
      id: saved.id,
      data: saved,
      shareUrl: `${origin}/share/mockup/${saved.id}`,
    });
  } catch (e) {
    console.error("[mockups POST]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
