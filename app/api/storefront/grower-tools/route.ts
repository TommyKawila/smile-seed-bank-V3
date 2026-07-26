import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitIp } from "@/lib/rate-limit-ip";
import { buildShopeeAffiliateSearchUrl } from "@/lib/shopee-affiliate";
import { resolveFertilizerType } from "@/lib/fertilizer-advisor";
import { isGrowerToolAiEnabled } from "@/services/setting-service";
import {
  adviseFertilizer,
  analyzeSoilMix,
  diagnosePlant,
} from "@/services/grower-tools-service";

export const dynamic = "force-dynamic";

const LocaleSchema = z.enum(["th", "en"]);

const MaterialSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  amount: z.string().max(64).optional(),
});

const PotTargetSchema = z.object({
  potLiters: z.number().positive().max(500),
  potCount: z.number().int().positive().max(500),
  totalFillLiters: z.number().positive(),
  superSoilLiters: z.number().positive(),
  baseSoilLiters: z.number().positive(),
});

const BodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("soil-mixer"),
    payload: z.object({
      potTarget: PotTargetSchema,
      materials: z.array(MaterialSchema).min(1).max(20),
      locale: LocaleSchema,
      recipeMode: z.enum(["basic", "advance"]).default("basic"),
    }),
  }),
  z.object({
    action: z.literal("fertilizer"),
    payload: z.object({
      stageId: z.enum(["seedling", "veg", "flower"]),
      type: z.enum(["organic", "synthetic"]),
      medium: z.enum(["soil", "coco", "hydro", "rockwool"]).default("soil"),
      locale: LocaleSchema,
    }),
  }),
  z.object({
    action: z.literal("plant-doctor"),
    payload: z.object({
      image: z.string().min(100).max(8_000_000),
      symptoms: z.string().max(500).optional(),
      locale: LocaleSchema,
    }),
  }),
]);

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limited = rateLimitIp(`grower-tools:${ip}`, 12, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterSec: limited.retryAfterSec },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }

    const { action, payload } = parsed.data;

    if (!(await isGrowerToolAiEnabled(action))) {
      return NextResponse.json(
        { error: "ai_disabled", message: "This AI tool is temporarily disabled" },
        { status: 503 }
      );
    }

    if (action === "soil-mixer") {
      const { analysis, error } = await analyzeSoilMix(
        payload.materials,
        payload.potTarget,
        payload.locale,
        payload.recipeMode
      );
      if (error || !analysis) {
        return NextResponse.json({ error: error ?? "Analysis failed" }, { status: 502 });
      }
      const buyLinks = analysis.buyList.map((item) => ({
        ...item,
        shopUrl: buildShopeeAffiliateSearchUrl(item.keyword),
      }));
      return NextResponse.json({ analysis, buyLinks });
    }

    if (action === "fertilizer") {
      const resolvedType = resolveFertilizerType(payload.medium, payload.type);
      const { analysis, error } = await adviseFertilizer(
        {
          stageId: payload.stageId,
          type: resolvedType,
          medium: payload.medium,
        },
        payload.locale
      );
      if (error || !analysis) {
        return NextResponse.json({ error: error ?? "Analysis failed" }, { status: 502 });
      }
      const buyLinks = analysis.products.map((item) => ({
        ...item,
        shopUrl: buildShopeeAffiliateSearchUrl(item.keyword, "fertilizer"),
      }));
      return NextResponse.json({ analysis, buyLinks });
    }

    const { text, error } = await diagnosePlant(
      payload.image,
      payload.symptoms,
      payload.locale
    );
    if (error) return NextResponse.json({ error }, { status: 502 });
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
