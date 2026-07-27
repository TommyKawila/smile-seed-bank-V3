import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashClientIp } from "@/lib/ip-hash";
import { rateLimitGrowerTools } from "@/lib/rate-limit-upstash";
import { buildShopeeAffiliateSearchUrl } from "@/lib/shopee-affiliate";
import { computeSoilPotTarget } from "@/lib/soil-mixer";
import { resolveFertilizerType } from "@/lib/fertilizer-advisor";
import type { GrowerToolAiAction } from "@/lib/grower-tools-settings";
import { isGrowerToolAiEnabled } from "@/services/setting-service";
import {
  checkGrowerToolsBudget,
  tripGrowerToolsBudget,
} from "@/services/grower-tools-budget-service";
import {
  adviseFertilizer,
  analyzeSoilMix,
  diagnosePlant,
  type GrowerToolAiMeta,
} from "@/services/grower-tools-service";
import { logGrowerToolUsage } from "@/services/grower-tools-usage-service";

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
      materials: z.array(MaterialSchema).max(20),
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

function logFromMeta(
  action: GrowerToolAiAction,
  ipHash: string,
  status: "ok" | "error",
  meta?: GrowerToolAiMeta
) {
  logGrowerToolUsage({
    action,
    status,
    ipHash,
    model: meta?.model,
    promptTokens: meta?.promptTokens,
    completionTokens: meta?.completionTokens,
    latencyMs: meta?.latencyMs,
  });
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const ipHash = hashClientIp(ip);

  let actionForLimit = "unknown";
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
    actionForLimit = action;

    const limited = await rateLimitGrowerTools(ipHash, action);
    if (!limited.ok) {
      logGrowerToolUsage({
        action,
        status: "rate_limited",
        ipHash,
      });
      return NextResponse.json(
        { error: "rate_limited", retryAfterSec: limited.retryAfterSec },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        }
      );
    }

    if (!(await isGrowerToolAiEnabled(action))) {
      logGrowerToolUsage({ action, status: "ai_disabled", ipHash });
      return NextResponse.json(
        { error: "ai_disabled", message: "This AI tool is temporarily disabled" },
        { status: 503 }
      );
    }

    const budget = await checkGrowerToolsBudget();
    if (!budget.ok) {
      await tripGrowerToolsBudget();
      logGrowerToolUsage({ action, status: "budget_blocked", ipHash });
      return NextResponse.json(
        {
          error: "budget_exceeded",
          message: "API budget limit reached",
          dailySpend: budget.dailySpend,
          monthlySpend: budget.monthlySpend,
        },
        { status: 503 }
      );
    }

    if (action === "soil-mixer") {
      const potTarget = computeSoilPotTarget(
        payload.potTarget.potLiters,
        payload.potTarget.potCount
      );
      const { analysis, error, meta } = await analyzeSoilMix(
        payload.materials,
        potTarget,
        payload.locale,
        payload.recipeMode
      );
      if (error || !analysis) {
        logFromMeta(action, ipHash, "error", meta);
        return NextResponse.json({ error: error ?? "Analysis failed" }, { status: 502 });
      }
      logFromMeta(action, ipHash, "ok", meta);
      const buyLinks = analysis.buyList.map((item) => ({
        ...item,
        shopUrl: buildShopeeAffiliateSearchUrl(item.keyword),
      }));
      return NextResponse.json({ analysis, buyLinks });
    }

    if (action === "fertilizer") {
      const resolvedType = resolveFertilizerType(payload.medium, payload.type);
      const { analysis, error, meta } = await adviseFertilizer(
        {
          stageId: payload.stageId,
          type: resolvedType,
          medium: payload.medium,
        },
        payload.locale
      );
      if (error || !analysis) {
        logFromMeta(action, ipHash, "error", meta);
        return NextResponse.json({ error: error ?? "Analysis failed" }, { status: 502 });
      }
      logFromMeta(action, ipHash, "ok", meta);
      const buyLinks = analysis.products.map((item) => ({
        ...item,
        shopUrl: buildShopeeAffiliateSearchUrl(item.keyword, "fertilizer"),
      }));
      return NextResponse.json({ analysis, buyLinks });
    }

    const { text, error, meta } = await diagnosePlant(
      payload.image,
      payload.symptoms,
      payload.locale
    );
    if (error) {
      logFromMeta(action, ipHash, "error", meta);
      return NextResponse.json({ error }, { status: 502 });
    }
    logFromMeta(action, ipHash, "ok", meta);
    return NextResponse.json({ text });
  } catch (err) {
    logGrowerToolUsage({
      action: actionForLimit,
      status: "error",
      ipHash,
    });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
