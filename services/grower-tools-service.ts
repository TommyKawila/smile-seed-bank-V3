import "server-only";

import {
  aggregateShortagesFromRecipes,
  resolveSoilShopeeKeyword,
  type SoilMixAnalysis,
  type SoilMixBuyItem,
  type SoilMixRecipeLine,
  type SoilMixStockStatus,
  type SoilPotTarget,
  type SuperSoilRecipeMode,
} from "@/lib/soil-mixer";
import {
  getBrandProductsForStage,
  getOrganicSoilPrepSteps,
  isOrganicSoilFeeding,
  parseFertilizerAnalysis,
  resolveFertilizerKit,
  resolveFertilizerType,
  type FertilizerAnalysis,
  type FertilizerGrowStage,
  type FertilizerMedium,
} from "@/lib/fertilizer-advisor";
import { GROW_STAGES } from "@/lib/grower-tools";
import { normalizeSoilMixerThaiText, soilMixerThaiVocabularyPrompt } from "@/lib/soil-mixer-terms";
import { withTimeout } from "@/lib/timeout";
import { buildCompleteSoilRecipes } from "@/services/soil-mixer-recipe-service";

export type GrowerToolsLocale = "th" | "en";

export type GrowerToolAiMeta = {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
};

export type GrowerToolsAiResult = {
  text: string | null;
  error: string | null;
  meta?: GrowerToolAiMeta;
};

export type SoilMixAiResult = {
  analysis: SoilMixAnalysis | null;
  error: string | null;
  meta?: GrowerToolAiMeta;
};

export type FertilizerAiResult = {
  analysis: FertilizerAnalysis | null;
  error: string | null;
  meta?: GrowerToolAiMeta;
};

export type { SoilMixAnalysis, SoilMixBuyItem, FertilizerAnalysis };

function parseOpenAiUsage(json: {
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}): Pick<GrowerToolAiMeta, "promptTokens" | "completionTokens" | "totalTokens"> {
  const promptTokens = json.usage?.prompt_tokens ?? 0;
  const completionTokens = json.usage?.completion_tokens ?? 0;
  const totalTokens = json.usage?.total_tokens ?? promptTokens + completionTokens;
  return { promptTokens, completionTokens, totalTokens };
}

function aiMeta(
  model: string,
  usage: Pick<GrowerToolAiMeta, "promptTokens" | "completionTokens" | "totalTokens">,
  latencyMs: number
): GrowerToolAiMeta {
  return { model, latencyMs, ...usage };
}

async function callOpenAIText(
  prompt: string,
  imageDataUrl?: string
): Promise<GrowerToolsAiResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { text: null, error: "OPENAI_API_KEY is not configured" };
  }

  const userContent: object[] = [{ type: "text", text: prompt }];
  if (imageDataUrl) {
    userContent.push({
      type: "image_url",
      image_url: { url: imageDataUrl, detail: "high" },
    });
  }

  const model = imageDataUrl ? "gpt-4o" : "gpt-4o-mini";
  const started = Date.now();

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 2048,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful cannabis horticulture assistant for home growers in legal jurisdictions. Give practical, safe advice.",
          },
          { role: "user", content: userContent },
        ],
      }),
    });

    const latencyMs = Date.now() - started;

    if (!res.ok) {
      const body = await res.text();
      return { text: null, error: body.slice(0, 400) || `OpenAI HTTP ${res.status}` };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    const text = json.choices?.[0]?.message?.content?.trim() || null;
    if (!text) return { text: null, error: "Empty AI response" };
    const usage = parseOpenAiUsage(json);
    return {
      text,
      error: null,
      meta: aiMeta(model, usage, latencyMs),
    };
  } catch (err) {
    return { text: null, error: err instanceof Error ? err.message : String(err) };
  }
}

async function callOpenAIJson(prompt: string): Promise<GrowerToolsAiResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { text: null, error: "OPENAI_API_KEY is not configured" };
  }

  const model = "gpt-4o-mini";
  const started = Date.now();

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 1600,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a concise organic soil advisor. Reply with valid JSON only matching the schema. Keep every string short.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const latencyMs = Date.now() - started;

    if (!res.ok) {
      const body = await res.text();
      return { text: null, error: body.slice(0, 400) || `OpenAI HTTP ${res.status}` };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    const text = json.choices?.[0]?.message?.content?.trim() || null;
    if (!text) return { text: null, error: "Empty AI response" };
    const usage = parseOpenAiUsage(json);
    return {
      text,
      error: null,
      meta: aiMeta(model, usage, latencyMs),
    };
  } catch (err) {
    return { text: null, error: err instanceof Error ? err.message : String(err) };
  }
}

function localeLine(locale: GrowerToolsLocale): string {
  return locale === "en"
    ? "All string values in JSON must be in English."
    : `ทุกข้อความใน JSON ต้องเป็นภาษาไทย สั้น กระชับ อ่านง่าย\n${soilMixerThaiVocabularyPrompt()}`;
}

function normalizeRecipeLineThai(line: SoilMixRecipeLine): SoilMixRecipeLine {
  return {
    ...line,
    name: normalizeSoilMixerThaiText(line.name),
    need: normalizeSoilMixerThaiText(line.need),
    have: normalizeSoilMixerThaiText(line.have),
    buyMore: normalizeSoilMixerThaiText(line.buyMore),
  };
}

function normalizeAnalysisThai(analysis: SoilMixAnalysis): SoilMixAnalysis {
  return {
    ...analysis,
    summary: normalizeSoilMixerThaiText(analysis.summary),
    gaps: analysis.gaps.map(normalizeSoilMixerThaiText),
    baseMixPlan: analysis.baseMixPlan.map(normalizeRecipeLineThai),
    superMixPlan: analysis.superMixPlan.map(normalizeRecipeLineThai),
    buyList: analysis.buyList.map((item) => ({
      ...item,
      name: normalizeSoilMixerThaiText(item.name),
      keyword: normalizeSoilMixerThaiText(item.keyword),
    })),
    howToUse: {
      ...analysis.howToUse,
      superPerPot: normalizeSoilMixerThaiText(analysis.howToUse.superPerPot),
      basePerPot: normalizeSoilMixerThaiText(analysis.howToUse.basePerPot),
      why: normalizeSoilMixerThaiText(analysis.howToUse.why),
      steps: analysis.howToUse.steps.map(normalizeSoilMixerThaiText),
    },
  };
}

function asStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim())
    .slice(0, max);
}

/** Block recommending pre-made "Base soil" bags — we mix Base from ingredients. */
function isForbiddenBaseSoilPurchase(name: string, keyword: string): boolean {
  const s = `${name} ${keyword}`.toLowerCase();
  const hits = [
    "base soil",
    "basesoil",
    "ดินพื้นฐาน",
    "ดินเบส",
    "เบสซอยล์",
    "เบสซอย",
    "super soil สำเร็จ",
    "supersoil สำเร็จ",
  ];
  return hits.some((h) => s.includes(h));
}

function parseStockStatus(v: unknown): SoilMixStockStatus {
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "short" || s === "missing" || s === "ok") return s;
  return "ok";
}

function parseRecipeLines(raw: unknown): SoilMixRecipeLine[] {
  if (!Array.isArray(raw)) return [];
  const out: SoilMixRecipeLine[] = [];
  for (const item of raw.slice(0, 12)) {
    if (typeof item === "string" && item.trim()) {
      out.push({
        name: item.trim(),
        need: "—",
        have: "—",
        status: "ok",
        buyMore: "",
      });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const ingredientId =
      typeof row.ingredientId === "string" ? row.ingredientId.trim() : undefined;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!name) continue;
    const need = typeof row.need === "string" ? row.need.trim() : String(row.need ?? "—");
    const have = typeof row.have === "string" ? row.have.trim() : String(row.have ?? "0");
    const status = parseStockStatus(row.status);
    const buyMore =
      typeof row.buyMore === "string"
        ? row.buyMore.trim()
        : status === "ok"
          ? ""
          : String(row.buyMore ?? "");
    out.push({
      ingredientId,
      name,
      need: need || "—",
      have: have || "0",
      status,
      buyMore: status === "ok" ? "" : buyMore,
    });
  }
  return out;
}

function parseSoilMixAnalysis(
  raw: string,
  potTarget: SoilPotTarget,
  locale: GrowerToolsLocale
): SoilMixAnalysis | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const summary = typeof data.summary === "string" ? data.summary.trim() : "";
    if (!summary) return null;

    const baseMixPlan = parseRecipeLines(data.baseMixPlan);
    const superMixPlan = parseRecipeLines(data.superMixPlan);

    // Always derive gaps + buyList from recipe cards (source of truth for UI)
    const { buyList: derivedBuy, gaps } = aggregateShortagesFromRecipes(
      baseMixPlan,
      superMixPlan,
      locale
    );

    // Prefer AI keywords when name matches; amounts always from recipe sum
    const aiKeywordByName = new Map<string, string>();
    const buyRaw = Array.isArray(data.buyList) ? data.buyList : [];
    for (const item of buyRaw) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const keyword = typeof row.keyword === "string" ? row.keyword.trim() : "";
      if (!name || !keyword) continue;
      if (isForbiddenBaseSoilPurchase(name, keyword)) continue;
      aiKeywordByName.set(name.toLowerCase(), keyword);
    }

    const buyList: SoilMixBuyItem[] = derivedBuy
      .map((item) => ({
        ...item,
        keyword: aiKeywordByName.get(item.name.toLowerCase()) ?? item.keyword,
      }))
      .filter((item) => !isForbiddenBaseSoilPurchase(item.name, item.keyword));

    const howRaw =
      data.howToUse && typeof data.howToUse === "object"
        ? (data.howToUse as Record<string, unknown>)
        : {};
    const howToUse = {
      superPerPot:
        typeof howRaw.superPerPot === "string" ? howRaw.superPerPot.trim() : "",
      basePerPot:
        typeof howRaw.basePerPot === "string" ? howRaw.basePerPot.trim() : "",
      why: typeof howRaw.why === "string" ? howRaw.why.trim() : "",
      steps: asStringArray(howRaw.steps, 4),
    };

    return {
      summary,
      volumes: {
        potCount: potTarget.potCount,
        baseSoilLiters: potTarget.baseSoilLiters,
        superSoilLiters: potTarget.superSoilLiters,
        totalFillLiters: potTarget.totalFillLiters,
      },
      baseMixPlan,
      superMixPlan,
      gaps,
      buyList,
      howToUse,
    };
  } catch {
    return null;
  }
}

export type SoilMaterialInput = { id: string; label: string; amount?: string };

export async function analyzeSoilMix(
  materials: SoilMaterialInput[],
  potTarget: SoilPotTarget,
  locale: GrowerToolsLocale,
  recipeMode: SuperSoilRecipeMode = "basic"
): Promise<SoilMixAiResult> {
  const list = materials
    .map((m) => `- id=${m.id}; ${m.label}; amount=${m.amount ?? "0 L"}`)
    .join("\n");
  const canonicalRecipes = buildCompleteSoilRecipes(
    materials,
    potTarget,
    locale,
    recipeMode
  );

  const perPotSuper = (potTarget.superSoilLiters / potTarget.potCount).toFixed(1);
  const perPotBase = (potTarget.baseSoilLiters / potTarget.potCount).toFixed(1);
  const baseL = potTarget.baseSoilLiters.toFixed(1);
  const superL = potTarget.superSoilLiters.toFixed(1);

  const prompt = `You explain a pre-calculated Base soil + Super soil recipe for home growers. Reply JSON only.

TARGET FILL (must hit both):
- potCount: ${potTarget.potCount} × ${potTarget.potLiters.toFixed(1)} L each
- totalFillLiters: ${potTarget.totalFillLiters.toFixed(1)}
- Base soil to mix (top 2/3): ${baseL} L (~${perPotBase} L/pot)
- Super soil to mix (bottom 1/3): ${superL} L (~${perPotSuper} L/pot)
- recipeMode: ${recipeMode}

ON HAND (allocate these FIRST across both recipes — do not invent higher "have" than listed):
${list || "(none)"}

CANONICAL RECIPES (already calculated by the server):
${JSON.stringify(canonicalRecipes)}

Copy baseMixPlan and superMixPlan EXACTLY. Do not add, remove, rename, or recalculate ingredients or quantities.

JSON schema:
{
  "summary": "1-2 short sentences: on-hand first; shortfalls for Base ${baseL} L + Super ${superL} L (${recipeMode})",
  "baseMixPlan": [
    {
      "name": "ingredient",
      "need": "30 L",
      "have": "20 L",
      "status": "ok|short|missing",
      "buyMore": "10 L or empty if ok"
    }
  ],
  "superMixPlan": [ { "name": "...", "need": "...", "have": "...", "status": "ok|short|missing", "buyMore": "..." } ],
  "gaps": ["short summary of shortages"],
  "buyList": [
    { "name": "ingredient", "amount": "total qty to buy across both recipes", "keyword": "Shopee search keyword" }
  ],
  "howToUse": {
    "superPerPot": "~${perPotSuper} L Super at bottom 1/3",
    "basePerPot": "~${perPotBase} L Base on top 2/3",
    "why": "one short sentence: Super is hot — do not fill whole pot",
    "steps": ["step1", "step2", "step3"]
  }
}

Rules (STRICT):
1) Treat CANONICAL RECIPES as the source of truth.
2) Explain the shortages accurately in summary and howToUse.
3) NEVER recommend buying bagged "Base soil" / "Super soil" mix / pre-made soil blends — only raw ingredients.
4) buyList = unique ingredients to purchase from canonical shortfalls; keyword shoppable on Shopee TH.
5) Keep strings short. gaps max 8. buyList max 12.

${localeLine(locale)}`;

  const timed = await withTimeout(callOpenAIJson(prompt), 12000, {
    text: null,
    error: "timeout",
  });

  if (timed.error || !timed.text) {
    return { analysis: null, error: timed.error ?? "Empty AI response" };
  }

  const analysis = parseSoilMixAnalysis(timed.text, potTarget, locale);
  if (!analysis) {
    return { analysis: null, error: "Invalid AI JSON" };
  }
  const analysisWithCanonicalRecipes: SoilMixAnalysis = {
    ...analysis,
    ...canonicalRecipes,
  };
  const normalized =
    locale === "th"
      ? normalizeAnalysisThai(analysisWithCanonicalRecipes)
      : analysisWithCanonicalRecipes;
  // Re-aggregate after Thai normalize so names/amounts stay in sync with recipe cards
  const synced = aggregateShortagesFromRecipes(
    normalized.baseMixPlan,
    normalized.superMixPlan,
    locale
  );
  return {
    analysis: {
      ...normalized,
      gaps: synced.gaps,
      buyList: synced.buyList.map((item) => ({
        ...item,
        keyword: resolveSoilShopeeKeyword(item.ingredientId, item.name),
      })),
    },
    error: null,
    meta: timed.meta,
  };
}

export type FertilizerInput = {
  stageId: FertilizerGrowStage;
  type: "organic" | "synthetic";
  medium: FertilizerMedium;
};

function stageLabelForLocale(stageId: FertilizerGrowStage, locale: GrowerToolsLocale): string {
  const row = GROW_STAGES.find((s) => s.id === stageId);
  if (!row) return stageId;
  return locale === "en" ? row.labelEn : row.labelTh;
}

export async function adviseFertilizer(
  input: FertilizerInput,
  locale: GrowerToolsLocale
): Promise<FertilizerAiResult> {
  const effectiveType = resolveFertilizerType(input.medium, input.type);
  const organicNatural = isOrganicSoilFeeding(input.medium, effectiveType);
  const kit = resolveFertilizerKit(input.medium, effectiveType);
  const stageLabel = stageLabelForLocale(input.stageId, locale);
  const localeRules =
    locale === "en"
      ? "All string values in JSON must be in English. Keep each string short."
      : `ทุกข้อความใน JSON ต้องเป็นภาษาไทย สั้น กระชับ\n${soilMixerThaiVocabularyPrompt()}`;

  const brandRule = organicNatural
    ? `NATURAL ORGANIC SOIL feeding (regular soil, NOT super soil hot mix).
- Recommend worm castings, compost/compost tea, kelp, guano, bone/blood meal — same philosophy as building living soil.
- Do NOT mention bottled brands (Biobizz, Athena, etc.).
- products array MUST be [] — product list is added by the app.
- Summary, npkFocus, feedingTips, cautions must focus on natural amendments for ${stageLabel}.
- feedingTips: practical real-world use — top-dress amounts, tea dilution, frequency, how to mix into soil.`
    : `LOCKED BRAND: ${kit.brand} only.
- Do NOT recommend other brands or generic products.
- products array MUST be [] (empty) — product list is added by the app.
- Summary, npkFocus, feedingTips, cautions must match ${kit.brand} feeding style for ${stageLabel} on ${input.medium}.
- For soil: assume regular soil (NOT super soil) when giving Biobizz advice.
- For coco/rockwool: ${kit.brand === "Athena" ? "reference Athena Pro Line EC targets & CalMag" : ""}
- For RDWC: ${kit.brand === "FloraFlex" ? "reference FloraFlex reservoir EC & pH targets" : ""}`;

  const summaryHint = organicNatural
    ? "natural organic amendments and how to feed this stage"
    : `${kit.brand} and this stage`;

  const prompt = `You advise home cannabis growers on fertilizer / feeding. Reply JSON only.

Context:
- Grow stage: ${stageLabel} (${input.stageId})
- Fertilizer type: ${effectiveType}
- Medium: ${input.medium}
- ${brandRule}

JSON schema:
{
  "summary": "1-2 short sentences — mention ${summaryHint}",
  "npkFocus": {
    "n": "short N guidance for this stage",
    "p": "short P guidance",
    "k": "short K guidance"
  },
  "products": [],
  "cautions": ["first bullet MUST use ระวังอาการปุ๋ยไหม้ (Nutrient Burn) for burn/over-feed — max 4 bullets"],
  "feedingTips": ["practical feeding schedule tips — max 4 bullets"]
}

Rules:
- Keep every string under 120 chars
- No markdown in JSON strings

${localeRules}`;

  const timed = await withTimeout(callOpenAIJson(prompt), 12000, {
    text: null,
    error: "timeout",
  });

  if (timed.error || !timed.text) {
    return { analysis: null, error: timed.error ?? "Empty AI response" };
  }

  const parsed = parseFertilizerAnalysis(timed.text);
  if (!parsed) {
    return { analysis: null, error: "Invalid AI JSON" };
  }

  const brandProducts = getBrandProductsForStage(kit, input.stageId, locale);
  const brandLabel =
    locale === "en" && kit.brandEn ? kit.brandEn : kit.brand;
  const analysis: FertilizerAnalysis = {
    ...parsed,
    products: brandProducts,
    prepSteps: organicNatural ? getOrganicSoilPrepSteps(input.stageId, locale) : undefined,
    organicNatural,
    recommendedBrand: brandLabel,
    brandTagline: locale === "en" ? kit.taglineEn : kit.taglineTh,
  };

  if (locale === "th") {
    return {
      analysis: {
        ...analysis,
        summary: normalizeSoilMixerThaiText(analysis.summary),
        npkFocus: {
          n: normalizeSoilMixerThaiText(analysis.npkFocus.n),
          p: normalizeSoilMixerThaiText(analysis.npkFocus.p),
          k: normalizeSoilMixerThaiText(analysis.npkFocus.k),
        },
        cautions: analysis.cautions.map(normalizeSoilMixerThaiText),
        feedingTips: analysis.feedingTips.map(normalizeSoilMixerThaiText),
        prepSteps: analysis.prepSteps?.map(normalizeSoilMixerThaiText),
      },
      error: null,
      meta: timed.meta,
    };
  }

  return { analysis, error: null, meta: timed.meta };
}

export async function diagnosePlant(
  imageDataUrl: string,
  symptoms: string | undefined,
  locale: GrowerToolsLocale
): Promise<GrowerToolsAiResult> {
  const prompt = `You are a plant health assistant for cannabis growers (visual triage only — not a lab diagnosis).
${symptoms ? `Grower notes: ${symptoms}` : "No extra notes from grower."}

Analyze the photo for common issues: nutrient deficiencies/toxicities, pests, mold, heat/light stress, over/under watering.
Structure:
1) Most likely causes (ranked)
2) What to check next (pH, runoff, microscope, etc.)
3) Gentle corrective steps
4) When to seek expert help

Do NOT store or reference personal data. ${locale === "en" ? "Respond in English." : "ตอบเป็นภาษาไทย กระชับ"}`;

  return withTimeout(callOpenAIText(prompt, imageDataUrl), 12000, {
    text: null,
    error: "timeout",
  });
}
