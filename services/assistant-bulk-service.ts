/**
 * Bulk B2B tools for SSB Assistant — SG / SGF strain search + share-link pricing.
 */

import {
  bulkSupplierSlugFromBreeder,
  bulkUnitPriceForBreeder,
  snapB2BBulkQty,
} from "@/lib/b2b-quote-bulk-price";
import {
  BULK_SUPPLIER_BOOKS,
  DEFAULT_EUR_THB,
  getBulkSupplierBook,
  type BulkSupplierSlug,
} from "@/lib/bulk-seeds-book";
import {
  priceBulkShareOrder,
  supplierLabel,
  type BulkShareOrderItemInput,
} from "@/lib/bulk-share-order";
import type { BulkSharePayload } from "@/lib/bulk-share-token";
import { B2B_BREEDER_SG, B2B_BREEDER_SGF } from "@/types/b2b-quote";
import { GREEN_FUTURE_SLUG } from "@/types/partner-catalog";
import {
  SEEDS_GENETICS_CATALOG,
  type SgCatalogStrain,
} from "@/lib/seeds-genetics-catalog";
import { listPartnerStrains } from "@/services/partner-catalog-service";

const SEARCH_LIMIT = 12;
const MIN_BULK_QTY = 50;
const USD_PER_EUR_ESTIMATE = 1.09;
const SEARCH_NOISE_TOKENS = new Set([
  "fast",
  "ff",
  "gas",
  "fem",
  "auto",
  "the",
  "and",
  "seeds",
  "seed",
  "genetics",
  "sgf",
  "bx",
  "rbx",
]);

export type BulkSupplierFilter = BulkSupplierSlug | "all";

export type BulkStrainHit = {
  supplierSlug: BulkSupplierSlug;
  supplierLabel: string;
  strainName: string;
  category: string | null;
  matchScore: number;
  notes: string[];
};

export type BulkQuoteLineInput = {
  supplierSlug?: string;
  breederName?: string;
  strainName: string;
  qty: number;
  category?: string;
};

function normalizeHaystack(s: string): string {
  return s
    .toLowerCase()
    .replace(/feminized|autoflower|auto\b|photo\s*ff|fast\s*flowering/gi, " ")
    .replace(/[^a-z0-9.+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeQuery(q: string): string[] {
  return normalizeHaystack(q)
    .split(" ")
    .filter((t) => t.length > 0 && !SEARCH_NOISE_TOKENS.has(t));
}

function scoreMatch(haystack: string, tokens: string[]): number {
  if (!tokens.length) return 0;
  const norm = normalizeHaystack(haystack);
  let score = 0;
  for (const t of tokens) {
    if (!norm.includes(t)) return 0;
    if (norm === t) score += 10;
    else if (norm.startsWith(t)) score += 5;
    else score += 2;
  }
  return score;
}

function parseSupplierFilter(raw: string | undefined): BulkSupplierFilter {
  const s = (raw ?? "all").trim().toLowerCase();
  if (s === "seeds-genetics" || s === "sg" || s === "seeds genetics") {
    return "seeds-genetics";
  }
  if (
    s === "green-future" ||
    s === "gf" ||
    s === "sgf" ||
    s === "sgf seeds" ||
    s === "green future"
  ) {
    return "green-future";
  }
  return "all";
}

function resolveSupplierSlug(input: {
  supplierSlug?: string;
  breederName?: string;
}): BulkSupplierSlug | null {
  if (input.supplierSlug) {
    const s = input.supplierSlug.trim().toLowerCase();
    if (s === "seeds-genetics" || s === "sg") return "seeds-genetics";
    if (s === "green-future" || s === "gf" || s === "sgf") return "green-future";
  }
  if (input.breederName) {
    return bulkSupplierSlugFromBreeder(input.breederName);
  }
  return null;
}

function sgCategoryLabel(strain: SgCatalogStrain): string {
  if (strain.primaryCategory === "photo-ff") return "Photo FF";
  if (strain.primaryCategory.includes("auto")) return "Autoflower";
  if (strain.primaryCategory.includes("feminized") || strain.primaryCategory.includes("cali")) {
    return "Feminized";
  }
  return strain.primaryCategory;
}

function searchSgStrains(tokens: string[]): BulkStrainHit[] {
  const hits: BulkStrainHit[] = [];
  for (const strain of SEEDS_GENETICS_CATALOG.strains) {
    const score = scoreMatch(strain.name, tokens);
    if (score <= 0) continue;
    const notes: string[] = [];
    if (strain.fastFlowering) notes.push("Fast flowering / Photo FF");
    if (strain.listSource === "photo-ff-hand") notes.push("Photo FF list");
    hits.push({
      supplierSlug: "seeds-genetics",
      supplierLabel: B2B_BREEDER_SG,
      strainName: strain.name,
      category: sgCategoryLabel(strain),
      matchScore: score,
      notes,
    });
  }
  return hits;
}

async function searchGfStrains(tokens: string[]): Promise<BulkStrainHit[]> {
  const q = tokens.join(" ");
  const { strains } = await listPartnerStrains(GREEN_FUTURE_SLUG, {
    q,
    limit: SEARCH_LIMIT * 3,
  });
  const hits: BulkStrainHit[] = [];
  for (const strain of strains) {
    const hay = `${strain.strainName} ${strain.varietyCode} ${strain.typeLabel ?? ""}`;
    const score = scoreMatch(hay, tokens);
    if (score <= 0) continue;
    const notes: string[] = [];
    if (strain.typeLabel) notes.push(strain.typeLabel);
    if (/rbx/i.test(strain.strainName) && tokens.some((t) => t.includes("bx"))) {
      notes.push("Customer may mean BX — catalog lists RBX");
    }
    hits.push({
      supplierSlug: "green-future",
      supplierLabel: B2B_BREEDER_SGF,
      strainName: strain.strainName,
      category: strain.seedFormat === "AUTO_FEM" ? "Autoflower" : "Feminized",
      matchScore: score,
      notes,
    });
  }
  return hits;
}

export async function searchBulkStrains(opts: {
  query: string;
  supplier?: string;
  limit?: number;
}): Promise<unknown> {
  const q = opts.query.trim();
  if (!q) return { error: "query is required", strains: [] };

  let tokens = tokenizeQuery(q);
  if (!tokens.length) {
    tokens = normalizeHaystack(q)
      .split(" ")
      .filter((t) => t.length > 0);
  }
  if (!tokens.length) return { error: "query is required", strains: [] };

  const filter = parseSupplierFilter(opts.supplier);
  const limit = Math.min(Math.max(opts.limit ?? SEARCH_LIMIT, 1), 20);

  const sgHits = filter === "all" || filter === "seeds-genetics" ? searchSgStrains(tokens) : [];
  const gfHits =
    filter === "all" || filter === "green-future" ? await searchGfStrains(tokens) : [];

  const strains = [...sgHits, ...gfHits]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  return {
    query: q,
    supplier: filter,
    count: strains.length,
    strains,
    catalogNote:
      "Bulk pricing uses exclusive share ladder (50+ seeds/strain). Retail shop prices differ.",
  };
}

function defaultBulkPayload(): BulkSharePayload {
  const sgBook = getBulkSupplierBook("seeds-genetics")!;
  const gfBook = getBulkSupplierBook("green-future")!;
  return {
    v: 1,
    exp: Date.now() + 86400000,
    title: "assistant-bulk-quote",
    suppliers: ["seeds-genetics", "green-future"],
    showStrains: true,
    gmOverride: null,
    landed: {
      "seeds-genetics": sgBook.recommendedLandedPct,
      "green-future": gfBook.recommendedLandedPct,
    },
    eurThb: DEFAULT_EUR_THB,
  };
}

function roundEur(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundThb(n: number): number {
  return Math.ceil(n);
}

export async function quoteBulkOrder(opts: {
  items: BulkQuoteLineInput[];
  currency?: string;
}): Promise<unknown> {
  const rawItems = opts.items ?? [];
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "items array is required (strainName, qty, supplierSlug or breederName)" };
  }

  const currency = (opts.currency ?? "EUR").toUpperCase() === "THB" ? "THB" : "EUR";
  const payload = defaultBulkPayload();
  const orderItems: BulkShareOrderItemInput[] = [];
  const unresolved: string[] = [];

  for (const raw of rawItems) {
    const strainName = String(raw.strainName ?? "").trim();
    const qty = Math.floor(Number(raw.qty));
    if (!strainName) {
      unresolved.push("(missing strain name)");
      continue;
    }
    const slug = resolveSupplierSlug({
      supplierSlug: raw.supplierSlug != null ? String(raw.supplierSlug) : undefined,
      breederName: raw.breederName != null ? String(raw.breederName) : undefined,
    });
    if (!slug) {
      unresolved.push(`${strainName}: unknown supplier — use Seeds Genetics or SGF Seeds`);
      continue;
    }
    if (!Number.isFinite(qty) || qty < MIN_BULK_QTY) {
      unresolved.push(`${strainName}: minimum ${MIN_BULK_QTY} seeds per strain`);
      continue;
    }
    orderItems.push({
      supplierSlug: slug,
      strainName,
      category: raw.category != null ? String(raw.category) : undefined,
      qty: snapB2BBulkQty(qty),
    });
  }

  if (!orderItems.length) {
    return { error: "No valid line items", unresolved };
  }

  const priced = priceBulkShareOrder(payload, orderItems);
  if (!priced.ok) return { error: priced.error, unresolved };

  const { totals } = priced;
  const bySupplier = new Map<
    BulkSupplierSlug,
    {
      supplierLabel: string;
      seedCount: number;
      subtotalEur: number;
      subtotalThb: number;
      subtotalUsdEstimate: number;
      under1000Usd: boolean;
      lines: typeof totals.lines;
    }
  >();

  for (const line of totals.lines) {
    const bucket = bySupplier.get(line.supplierSlug) ?? {
      supplierLabel: line.supplierLabel,
      seedCount: 0,
      subtotalEur: 0,
      subtotalThb: 0,
      subtotalUsdEstimate: 0,
      under1000Usd: true,
      lines: [],
    };
    bucket.seedCount += line.qty;
    bucket.subtotalThb += line.lineThb;
    bucket.lines.push(line);
    bySupplier.set(line.supplierSlug, bucket);
  }

  const supplierTotals = [...bySupplier.entries()].map(([slug, bucket]) => {
    const subtotalEur = roundEur(bucket.subtotalThb / payload.eurThb);
    const subtotalUsdEstimate = roundEur(subtotalEur * USD_PER_EUR_ESTIMATE);
    return {
      supplierSlug: slug,
      supplierLabel: bucket.supplierLabel,
      seedCount: bucket.seedCount,
      subtotalEur,
      subtotalThb: bucket.subtotalThb,
      subtotalUsdEstimate,
      under1000Usd: subtotalUsdEstimate < 1000,
      b2bQuoteChannel: slug === "green-future" ? "gf" : "sg",
      lines: bucket.lines.map((l) => ({
        strainName: l.strainName,
        category: l.category || null,
        qty: l.qty,
        unitEur: roundEur(l.unitEur),
        unitThb: l.unitThb,
        lineEur: roundEur(l.lineThb / payload.eurThb),
        lineThb: l.lineThb,
      })),
    };
  });

  const grandEur = roundEur(totals.subtotalThb / payload.eurThb);
  const grandUsdEstimate = roundEur(grandEur * USD_PER_EUR_ESTIMATE);

  return {
    currency,
    eurThb: payload.eurThb,
    seedCount: totals.seedCount,
    grandTotalEur: grandEur,
    grandTotalThb: totals.subtotalThb,
    grandTotalUsdEstimate: grandUsdEstimate,
    excludesShipping: true,
    splitInvoicesOk: supplierTotals.every((s) => s.under1000Usd),
    supplierTotals,
    unresolved: unresolved.length ? unresolved : undefined,
    adminNextSteps: [
      "Create separate B2B pro-forma per supplier:",
      ...supplierTotals.map(
        (s) =>
          `· ${s.supplierLabel}: /admin/documents/b2b-quote?channel=${s.b2bQuoteChannel}`
      ),
      "Use DRAFT_TH/DRAFT_EN blocks when replying to the customer.",
    ],
    pricingNote:
      "Starter tier (50 seeds/strain). USD is estimate only — quote customer in EUR unless asked otherwise.",
  };
}

export async function getBulkPricingTiers(opts: {
  supplier?: string;
  currency?: string;
}): Promise<unknown> {
  const filter = parseSupplierFilter(opts.supplier);
  const currency = (opts.currency ?? "EUR").toUpperCase() === "THB" ? "THB" : "EUR";
  const slugs: BulkSupplierSlug[] =
    filter === "all" ? ["seeds-genetics", "green-future"] : [filter];

  const tiers = slugs.map((slug) => {
    const book = BULK_SUPPLIER_BOOKS.find((b) => b.slug === slug);
    const breeder = slug === "green-future" ? B2B_BREEDER_SGF : B2B_BREEDER_SG;
    const qtySamples = [50, 101, 251, 500];
    return {
      supplierSlug: slug,
      supplierLabel: supplierLabel(slug),
      breederName: breeder,
      samplePrices: qtySamples.map((qty) => ({
        qty,
        unitPrice: bulkUnitPriceForBreeder(breeder, qty, currency),
      })),
      minQtyPerStrain: MIN_BULK_QTY,
    };
  });

  return { currency, tiers };
}
