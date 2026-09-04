import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth-utils";
import { saveMockup } from "@/services/mockupService";
import { DEFAULT_FONT_SCALE, DEFAULT_LABEL_POSITION, DEFAULT_LABEL_SIZE_CM, MAX_FONT_SCALE, MIN_FONT_SCALE } from "@/types/label";

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  scale: z.number().positive(),
  rotation: z.number(),
  unit: z.enum(["ratio", "px"]).optional(),
});

const labelSizeCmSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

const bodySchema = z.object({
  id: z.string().uuid().optional(),
  species: z.string().min(1),
  strainName: z.string(),
  lotNo: z.string().default(""),
  trademark: z.string().default(""),
  collectionSource: z.string().default(""),
  quantity: z.number(),
  purity: z.number(),
  germination: z.number(),
  collectedDate: z.string(),
  testedDate: z.string(),
  expiryDate: z.string(),
  producerName: z.string(),
  producerLicensePP: z.string().default(""),
  /** @deprecated use producerLicensePP */
  producerLicenseRP2: z.string().optional(),
  distributorName: z.string(),
  distributorLicensePP4: z.string(),
  /** @deprecated use distributorLicensePP4 */
  distributorLicensePP3: z.string().optional(),
  address: z.string(),
  storageInstructions: z.string(),
  bgImageUrl: z.union([z.string().url(), z.literal(""), z.undefined()]).optional(),
  labelPosition: positionSchema.default(DEFAULT_LABEL_POSITION),
  labelSizeCm: labelSizeCmSchema.default(DEFAULT_LABEL_SIZE_CM),
  fontScale: z.number().min(MIN_FONT_SCALE).max(MAX_FONT_SCALE).default(DEFAULT_FONT_SCALE),
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
    const pp4 =
      parsed.data.distributorLicensePP4?.trim() ||
      parsed.data.distributorLicensePP3?.trim() ||
      "";
    const producerPP =
      parsed.data.producerLicensePP?.trim() ||
      parsed.data.producerLicenseRP2?.trim() ||
      "";
    const saved = await saveMockup({
      ...parsed.data,
      id: parsed.data.id ?? crypto.randomUUID(),
      bgImageUrl: bg || undefined,
      producerLicensePP: producerPP,
      distributorLicensePP4: pp4,
      labelPosition: parsed.data.labelPosition,
      labelSizeCm: parsed.data.labelSizeCm,
      fontScale: parsed.data.fontScale,
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
