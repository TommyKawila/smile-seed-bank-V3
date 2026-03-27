/**
 * AI Product Importer — Firecrawl scrape + Claude extraction + breeder resolution.
 * Persists via Supabase admin (createProductWithVariants) or Prisma update for existing master_sku.
 */

import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toMasterSku, toVariantSku } from "@/lib/sku-utils";
import { localizeImage } from "@/services/image-storage.service";
import { createProductWithVariants, syncProductStats } from "@/services/product-service";
import type { Json, Product, ProductVariant } from "@/types/supabase";
import {
  AiImporterExtractedSchema,
  type AiImportRowInput,
  type AiImporterExtracted,
} from "@/lib/validations/ai-importer";

type ServiceResult<T> = { data: T | null; error: string | null };

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape";
const DEFAULT_CLAUDE_MODEL = "claude-3-5-sonnet-20241022";

function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_CLAUDE_MODEL;
}

/**
 * Scrape a breeder product URL via Firecrawl (markdown preferred for LLM context).
 */
export async function scrapeUrlWithFirecrawl(url: string): Promise<ServiceResult<string>> {
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) {
    return { data: null, error: "FIRECRAWL_API_KEY is not set" };
  }
  try {
    const res = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    const json = (await res.json()) as {
      success?: boolean;
      data?: { markdown?: string; html?: string };
      error?: string;
    };
    if (!res.ok || json.success === false) {
      return { data: null, error: json.error ?? `Firecrawl HTTP ${res.status}` };
    }
    const md = json.data?.markdown ?? json.data?.html ?? "";
    if (!md.trim()) {
      return { data: null, error: "Firecrawl returned empty content" };
    }
    return { data: md, error: null };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}

/**
 * Resolve breeder row by name: case-insensitive exact match, then best partial match among active breeders.
 */
export async function resolveBreederIdByName(
  breederName: string
): Promise<ServiceResult<{ id: bigint; name: string }>> {
  const n = breederName.trim();
  if (!n) return { data: null, error: "Breeder name is empty" };

  try {
    const exact = await prisma.breeders.findFirst({
      where: { name: { equals: n, mode: "insensitive" }, is_active: true },
      select: { id: true, name: true },
    });
    if (exact) return { data: exact, error: null };

    const candidates = await prisma.breeders.findMany({
      where: { is_active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const lower = n.toLowerCase();
    const normalized = lower.replace(/\s+/g, " ");

    let best: { id: bigint; name: string; score: number } | null = null;
    for (const b of candidates) {
      const bn = b.name.toLowerCase();
      if (bn === normalized) {
        return { data: { id: b.id, name: b.name }, error: null };
      }
      if (bn.includes(normalized) || normalized.includes(bn)) {
        const score = Math.min(bn.length, normalized.length);
        if (!best || score > best.score) {
          best = { id: b.id, name: b.name, score };
        }
      }
    }

    if (best) return { data: { id: best.id, name: best.name }, error: null };

    return { data: null, error: `No breeder match for "${breederName}"` };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  if (fence?.[1]) return fence[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

/**
 * Ask Claude to return a single JSON object aligned with our product enrichment fields.
 */
export async function extractProductFieldsWithClaude(params: {
  sheetName: string;
  sheetBreeder: string;
  sourceUrl: string;
  scrapedMarkdown: string;
  hintPrice: number;
  hintStock: number;
}): Promise<ServiceResult<AiImporterExtracted>> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return { data: null, error: "ANTHROPIC_API_KEY is not set" };
  }

  const system = `You are a cannabis seed catalog data extractor. Output ONLY valid JSON (no markdown fences, no commentary).
The response MUST be a single JSON object matching this shape exactly (keys and nesting):

{
  "name": string | null (optional),
  "thc_percent": number | null,
  "indica_ratio": number | null,
  "sativa_ratio": number | null,
  "genetic_ratio": string | null,
  "terpenes": string[],
  "description_th": string | null,
  "images": string[],
  "seo": {
    "th": { "title": string | null, "description": string | null },
    "en": { "title": string | null, "description": string | null }
  } | null
}

Rules:
- "seo": Generate SEO meta title (max 60 characters) and meta description (max 160 characters) in BOTH Thai ("th") and English ("en"). Titles should include strain + breeder keywords where natural; descriptions must be unique vs title and compelling for search snippets.
- "images": Extract up to 5 UNIQUE absolute https image URLs from the scraped content only (markdown links, figure URLs, img src). The FIRST URL in the array MUST be the single best "hero" product shot; order remaining URLs by relevance (packaging, gallery). Fewer than 5 is OK. Empty array if no safe URLs.
- Other fields: infer ratios from text; use null when impossible. "description_th": fluent Thai (2–6 sentences) for a premium seed bank.

Strict: no extra keys, no trailing commas, valid JSON only.`;

  const user = `Sheet row:
- Name: ${params.sheetName}
- Breeder: ${params.sheetBreeder}
- URL: ${params.sourceUrl}
- Price hint: ${params.hintPrice}
- Stock hint: ${params.hintStock}

Scraped page content (markdown):
---
${params.scrapedMarkdown.slice(0, 120_000)}
---

Return one JSON object only.`;

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: getAnthropicModel(),
      max_tokens: 6144,
      system,
      messages: [{ role: "user", content: user }],
    });

    const block = msg.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return { data: null, error: "Claude returned no text block" };
    }

    const raw = extractJsonObject(block.text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { data: null, error: "Claude output was not valid JSON" };
    }

    const validated = AiImporterExtractedSchema.safeParse(parsed);
    if (!validated.success) {
      const first = validated.error.issues[0];
      return {
        data: null,
        error: `AI output validation: ${first?.path?.join(".") ?? "?"} — ${first?.message}`,
      };
    }

    return { data: validated.data, error: null };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}

function toProductDecimal(n: unknown): number | null {
  if (n === null || n === undefined) return null;
  const x = typeof n === "number" ? n : parseFloat(String(n).replace(/%/g, "").trim());
  if (!Number.isFinite(x)) return null;
  return Math.round(x * 100) / 100;
}

function terpenesToJsonValue(terpenes: string[]): object {
  return terpenes.length ? terpenes : [];
}

/** Storage path segment from master SKU (safe folder name). */
function imageImportFolder(masterSku: string): string {
  return `ai-import/${masterSku
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "product"}`;

}

/**
 * Localize up to 5 unique images into Supabase Storage (order preserved: hero first).
 * localizeImage already falls back to the original URL on failure; this layer never drops URLs.
 */
async function applyLocalizedProductImages(
  extracted: AiImporterExtracted,
  masterSku: string
): Promise<AiImporterExtracted> {
  const folder = imageImportFolder(masterSku);
  const allUrls = Array.from(
    new Set((extracted.images ?? []).map((u) => u.trim()).filter(Boolean))
  ).slice(0, 5);
  if (allUrls.length === 0) return extracted;

  const localized: string[] = [];
  for (const u of allUrls) {
    try {
      const out = await localizeImage(u, folder);
      localized.push(out ?? u);
    } catch (e) {
      console.warn("[ai-importer] localizeImage", e);
      localized.push(u);
    }
  }

  const merged = Array.from(new Set(localized)).slice(0, 5);
  return {
    ...extracted,
    images: merged,
    image_url: merged[0],
    additional_images: merged.slice(1),
  };
}

/** Prisma seo_meta: { th: { title, description }, en: { title, description } } */
function buildSeoMeta(extracted: AiImporterExtracted): Prisma.InputJsonValue | null {
  const s = extracted.seo;
  if (!s) return null;
  const thRaw = s.th;
  const enRaw = s.en;
  const th =
    thRaw &&
    (thRaw.title?.trim() || thRaw.description?.trim())
      ? {
          title: thRaw.title?.trim() ?? null,
          description: thRaw.description?.trim() ?? null,
        }
      : null;
  const en =
    enRaw &&
    (enRaw.title?.trim() || enRaw.description?.trim())
      ? {
          title: enRaw.title?.trim() ?? null,
          description: enRaw.description?.trim() ?? null,
        }
      : null;
  if (!th && !en) return null;
  const out: Record<string, { title: string | null; description: string | null }> = {};
  if (th) out.th = th;
  if (en) out.en = en;
  return out as Prisma.InputJsonValue;
}

function imageUrlsJsonFromExtracted(extracted: AiImporterExtracted): Prisma.InputJsonValue | null {
  const urls = (extracted.images ?? []).slice(0, 5);
  if (!urls.length) return null;
  return urls as unknown as Prisma.InputJsonValue;
}

/**
 * Full pipeline: match breeder → scrape → Claude → validate → create or update product + default "1 Seed" variant.
 */
export async function runAiImportPipeline(
  input: AiImportRowInput
): Promise<
  ServiceResult<{
    mode: "created" | "updated" | "dry_run";
    productId: bigint | null;
    masterSku: string;
    extracted: AiImporterExtracted;
    breederId: bigint;
    scrapeError: string | null;
  }>
> {
  const breederRes = await resolveBreederIdByName(input.breeder);
  if (!breederRes.data || breederRes.error) {
    return { data: null, error: breederRes.error ?? "Breeder not found" };
  }

  let scraped = "";
  let scrapeError: string | null = null;
  const sc = await scrapeUrlWithFirecrawl(input.url);
  if (sc.data) {
    scraped = sc.data;
  } else {
    scrapeError = sc.error ?? "Scrape failed";
    scraped = `(Scrape unavailable: ${scrapeError})\nSource URL: ${input.url}`;
  }

  const ai = await extractProductFieldsWithClaude({
    sheetName: input.name,
    sheetBreeder: breederRes.data.name,
    sourceUrl: input.url,
    scrapedMarkdown: scraped,
    hintPrice: input.price,
    hintStock: input.stock,
  });
  if (!ai.data || ai.error) {
    return { data: null, error: ai.error ?? "AI extraction failed" };
  }

  let extracted = ai.data;
  const displayName = extracted.name?.trim() || input.name.trim();
  const masterSku = toMasterSku(breederRes.data.name, displayName);

  if (!input.dryRun) {
    extracted = await applyLocalizedProductImages(extracted, masterSku);
  }

  if (input.dryRun) {
    return {
      data: {
        mode: "dry_run",
        productId: null,
        masterSku,
        extracted,
        breederId: breederRes.data.id,
        scrapeError,
      },
      error: null,
    };
  }

  const existing = await prisma.products.findFirst({
    where: {
      breeder_id: breederRes.data.id,
      master_sku: masterSku,
    },
    include: { product_variants: { orderBy: { id: "asc" } } },
  });

  const thc = toProductDecimal(extracted.thc_percent ?? null);
  const indica = toProductDecimal(extracted.indica_ratio ?? null);
  const sativa = toProductDecimal(extracted.sativa_ratio ?? null);

  const terpenesJson = terpenesToJsonValue(extracted.terpenes ?? []);
  const galleryUrls = imageUrlsJsonFromExtracted(extracted);
  const seoMeta = buildSeoMeta(extracted);

  if (existing) {
    await prisma.products.update({
      where: { id: existing.id },
      data: {
        name: displayName,
        description_th: extracted.description_th ?? existing.description_th,
        image_url: extracted.image_url ?? existing.image_url,
        ...(galleryUrls != null ? { image_urls: galleryUrls } : {}),
        ...(seoMeta != null ? { seo_meta: seoMeta } : {}),
        thc_percent: thc !== null ? new Prisma.Decimal(thc) : undefined,
        indica_ratio: indica !== null ? new Prisma.Decimal(indica) : undefined,
        sativa_ratio: sativa !== null ? new Prisma.Decimal(sativa) : undefined,
        genetic_ratio: extracted.genetic_ratio ?? existing.genetic_ratio,
        terpenes: terpenesJson as object,
      },
    });

    const unitLabel = "1 Seed";
    const variant =
      existing.product_variants.find((v) => v.unit_label === unitLabel) ??
      existing.product_variants[0];

    if (variant?.id) {
      await prisma.product_variants.update({
        where: { id: variant.id },
        data: {
          price: new Prisma.Decimal(input.price),
          stock: input.stock,
          sku: toVariantSku(masterSku, variant.unit_label),
        },
      });
    }

    await syncProductStats(Number(existing.id));

    return {
      data: {
        mode: "updated",
        productId: existing.id,
        masterSku,
        extracted,
        breederId: breederRes.data.id,
        scrapeError,
      },
      error: null,
    };
  }

  const productRow: Omit<Product, "id" | "price" | "stock"> = {
    name: displayName,
    breeder_id: Number(breederRes.data.id),
    master_sku: masterSku,
    category: null,
    description_th: extracted.description_th ?? null,
    description_en: null,
    image_url: extracted.image_url ?? null,
    image_url_2: null,
    image_url_3: null,
    image_url_4: null,
    image_url_5: null,
    image_urls: (galleryUrls as Json) ?? null,
    seo_meta: (seoMeta as Json) ?? null,
    video_url: null,
    is_active: true,
    thc_percent: thc,
    cbd_percent: null,
    genetics: null,
    indica_ratio: indica,
    sativa_ratio: sativa,
    strain_dominance: null,
    flowering_type: null,
    seed_type: null,
    yield_info: null,
    growing_difficulty: null,
    effects: null,
    flavors: null,
    medical_benefits: null,
    genetic_ratio: extracted.genetic_ratio ?? null,
    sex_type: null,
    lineage: null,
    terpenes: terpenesJson as Json,
  };

  const variantRow: Omit<ProductVariant, "id" | "product_id"> = {
    unit_label: "1 Seed",
    price: input.price,
    cost_price: 0,
    stock: input.stock,
    is_active: true,
    sku: toVariantSku(masterSku, "1 Seed"),
  };

  const created = await createProductWithVariants(productRow, [variantRow]);
  if (created.error || !created.data) {
    return { data: null, error: created.error ?? "createProductWithVariants failed" };
  }

  return {
    data: {
      mode: "created",
      productId: BigInt(created.data.productId),
      masterSku,
      extracted,
      breederId: breederRes.data.id,
      scrapeError,
    },
    error: null,
  };
}

