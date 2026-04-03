import {
  formatGeneticRatioString,
  normalizeSativaIndicaPercents,
} from "@/lib/genetic-percent-utils";

// AI Product Extraction Service
// Supports: Google Gemini 2.5 Flash | OpenAI GPT-4o
// Both providers support multimodal input (text + images)
// Both return the same ExtractedProductData interface

export type AiProvider = "gemini" | "openai";

export type StrainDominanceValue = "Mostly Indica" | "Mostly Sativa" | "Hybrid 50/50";

export interface ExtractedProductData {
  name?: string;
  category?: string;
  genetics?: string;
  lineage?: string | null;
  /** Derived display string; prefer sativa_percent + indica_percent from AI. */
  genetic_ratio?: string | null;
  /** Integers 0–100; sum must be 100 when set (see sanitize). */
  sativa_percent?: number | null;
  indica_percent?: number | null;
  strain_dominance?: StrainDominanceValue | null;
  thc_percent?: number | null;
  /** As in source text, e.g. "< 1%", "0.5", "Trace". */
  cbd_percent?: string | null;
  indica_ratio?: number | null;
  sativa_ratio?: number | null;
  /** Canonical: autoflower | photoperiod (lowercase) */
  flowering_type?: "autoflower" | "photoperiod" | null;
  seed_type?: "FEMINIZED" | "REGULAR" | null;
  /** Canonical: feminized | regular (lowercase) — NOT used for autoflower (use flowering_type) */
  sex_type?: "feminized" | "regular" | null;
  yield_info?: string | null;
  growing_difficulty?: string | null;
  terpenes?: string[] | null;
  effects?: string[] | null;
  flavors?: string[] | null;
  medical_benefits?: string[] | null;
  description_th?: string | null;
  description_en?: string | null;
}

type ExtractionResult = { data: ExtractedProductData | null; error: string | null };

// A base64 string prefixed with data URI scheme, e.g. "data:image/jpeg;base64,/9j/..."
export type Base64Image = string;

// ─── Shared Prompt ────────────────────────────────────────────────────────────

const JSON_SCHEMA = `{
  "name": "string — strain/product name, or \"Unknown\" if not found",
  "category": "Seeds",
  "genetics": "string — short strain type summary e.g. '70% Sativa / 30% Indica', or \"Unknown\"",
  "lineage": "string — parent strains with × symbol e.g. 'OG Kush × White Widow', or \"Unknown\" if not found",
  "sativa_percent": number | null — integer 0–100. With indica_percent, the two MUST sum to 100. Example: text says \"Sativa 70%\" → sativa_percent: 70, indica_percent: 30. If only one side is stated (e.g. \"80% Indica\"), set that number and compute the other so the sum is 100. If no ratio can be inferred, set BOTH to null.",
  "indica_percent": number | null — integer 0–100. Must pair with sativa_percent so sativa_percent + indica_percent === 100 when either is non-null.",
  "strain_dominance": "Mostly Indica" | "Mostly Sativa" | "Hybrid 50/50" | null — REQUIRED. Infer from genetics, sativa_percent/indica_percent, or keywords in text/images. Keywords: "Indica Dominant", "Mostly Indica", "Indica-leaning" → "Mostly Indica"; "Sativa Dominant", "Mostly Sativa", "Sativa-leaning" → "Mostly Sativa"; "50/50", "Hybrid", "Balanced", "Indica/Sativa" → "Hybrid 50/50". Use null only if truly unidentifiable.",
  "thc_percent": number | null — single numeric percent 0–100. If a RANGE appears (e.g. \"18-22%\", \"20–25%\", \"Up to 25%\", \"max 30%\"), output only the MAXIMUM value as a number. Use null if not found — do NOT use \"Unknown\" for this field,
  "cbd_percent": string | null — copy the label from the text when it uses symbols or words (e.g. \"< 1%\", \"<1\", \"Trace\", \"0.5%\"). If only a plain number is given, output it as in the source (with or without \"%\"). Use null if not found,
  "indica_ratio": number | null (0-100 integer — legacy mirror of indica_percent; omit or set equal to indica_percent when using new fields),
  "sativa_ratio": number | null (0-100 integer — legacy mirror of sativa_percent),
  "flowering_type": "autoflower" | "photoperiod" | null — photoperiod = depends on light schedule; autoflower = ruderalis-type automatic flowering,
  "seed_type": "FEMINIZED" | "REGULAR" | null,
  "sex_type": "feminized" | "regular" | null — NEVER put \"Autoflower\" here; autoflowering belongs in flowering_type only,
  "yield_info": "string — e.g. '400-500g/m²', or \"Unknown\"",
  "growing_difficulty": "Easy" | "Moderate" | "Difficult" | "Unknown",
  "terpenes": ["string"] — array of terpene names inferred from flavor/aroma, e.g. ["Myrcene", "Limonene"]. Use ["Unknown"] if no flavor cues at all,
  "effects": ["string"] — e.g. ["Relaxed", "Happy", "Euphoric"]. Use ["Unknown"] if not found,
  "flavors": ["string"] — e.g. ["Earthy", "Pine", "Sweet"]. Use ["Unknown"] if not found,
  "medical_benefits": ["string"] — e.g. ["Stress", "Pain", "Anxiety"]. Use ["Unknown"] if not found,
  "description_en": "string — A detailed, professional English narrative of 5-8 sentences covering: the strain's unique character and appeal; its genetic lineage and heritage; THC/CBD potency profile; dominant effects and the experience it delivers; flavor and aroma highlights; yield potential and growing traits; and best use cases (recreational or medicinal). SEO-optimized, written in the voice of a premium cannabis seed bank.",
  "description_th": "string — Natural, professional Thai translation of description_en. Write as a native Thai speaker describing a premium product — do not transliterate literally."
}`;

const SYSTEM_PROMPT = `You are an expert cannabis seed catalog data extractor specializing in premium genetics.
You will receive raw text and/or images of cannabis seed packaging, brochures, or product descriptions.
Read ALL visible text in the images carefully — prioritize English text.

EXTRACTION RULES:
1. FALLBACK: For any string field where data cannot be found or reasonably inferred, output the exact string "Unknown". For number fields (thc_percent, sativa_percent, indica_percent) that cannot be found, output null. For cbd_percent, output null if not found (never \"Unknown\").
2. STRAIN_DOMINANCE: Look for keywords like "Mostly Indica", "Indica Dominant", "Indica-leaning", "Sativa Dominant", "Mostly Sativa", "50/50 Hybrid", "Balanced Hybrid". Map to exactly one of: "Mostly Indica", "Mostly Sativa", or "Hybrid 50/50". Use sativa_percent/indica_percent (e.g. Indica ≥60% → Mostly Indica, Sativa ≥60% → Mostly Sativa, ~50/50 → Hybrid 50/50) if no explicit keywords.
3. GENETIC PERCENTAGES (sativa_percent & indica_percent): Output two integers 0–100 only. They MUST sum to 100 whenever either is non-null. If the text says "Sativa 70%", set sativa_percent: 70 and indica_percent: 30. If only "80% Indica" is stated, set indica_percent: 80 and sativa_percent: 20. If a balanced hybrid with no numbers, use 50 and 50. If genetics cannot be determined at all, set BOTH to null. Do NOT output a separate genetic_ratio string — use only these two numeric keys.
4. LINEAGE: Use the × symbol between parent strains. Identify Father × Mother if mentioned.
5. TERPENES: Infer terpene names from flavor/aroma descriptions if not explicitly listed (e.g. citrus/lemon → Limonene, earthy/musky → Myrcene, spicy/pepper → Caryophyllene, pine → Pinene, floral → Linalool).
6. DESCRIPTION (ENGLISH): Write a rich narrative of 5-8 sentences synthesizing: strain character, lineage heritage, THC/CBD potency, effects experience, flavor/aroma profile, growing traits, and recommended use cases. Tone: premium cannabis seed bank catalog.
7. DESCRIPTION (THAI): Translate the English description into natural, fluent Thai. Write as if a native Thai speaker composed it — not a word-for-word translation.
8. THC POTENCY: If the label gives a range (e.g. 18–22%, 20-25%), always output the highest number only. Phrases like \"Up to X%\" / \"max X%\" / \"under X%\" → use X as thc_percent (single number).
9. CBD POTENCY: Preserve symbols and wording from the label (e.g. \"< 1%\") in cbd_percent as a string; do not convert to a number if the source uses < or text like Trace.
10. FLOWERING_TYPE vs SEX_TYPE (critical):
   - Keywords \"Auto\", \"Autoflow\", \"Autoflowering\", \"Ruderalis\", \"Fast Buds Auto\" → flowering_type MUST be \"autoflower\" (not sex_type).
   - Keywords \"Feminized\", \"Fem\", \"Female seeds\" → sex_type \"feminized\".
   - Keywords \"Regular\", \"Reg\", \"non-feminized\" → sex_type \"regular\".
   - Photoperiod / Photo-period / traditional photo → flowering_type \"photoperiod\".
   - If the product is autoflowering and sex_type is unclear, set sex_type to \"feminized\" (most autos are fem) UNLESS the text explicitly says \"Regular\" / \"regular seeds\" for that auto line.
   - Output lowercase exactly: flowering_type in autoflower|photoperiod|null; sex_type in feminized|regular|null.

Return ONLY a valid JSON object (no markdown, no code fences, no explanation) matching this schema:
${JSON_SCHEMA}

IMPORTANT: You must return the output as a RAW JSON object ONLY. Do not include markdown formatting, do not include \`\`\`json tags, and do not include any explanatory text. Just the JSON.

JSON FORMATTING: Ensure all string values are properly escaped for JSON. Specifically, do not include literal newlines within string values; use '\\n' instead. If the text is long, summarize it to ensure the JSON object is complete and valid.`;

/** Remove markdown ``` / ```json fences so JSON.parse succeeds when the model wraps output. */
function sanitizeAiJsonText(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

/** Replace raw line breaks inside JSON string literals with escaped \\n (fixes unterminated string errors). */
function escapeIllegalNewlinesInJsonStrings(input: string): string {
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (escape) {
      out += c;
      escape = false;
      continue;
    }
    if (c === "\\") {
      out += c;
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      out += c;
      continue;
    }
    if (inString && (c === "\n" || c === "\r")) {
      if (c === "\r" && input[i + 1] === "\n") i++;
      out += "\\n";
      continue;
    }
    out += c;
  }
  return out;
}

/** If net `{` braces are unclosed (outside strings), append closing `}` (basic truncation repair). */
function appendMissingClosingBraces(input: string): string {
  let balance = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === "{") balance++;
    else if (c === "}") balance--;
  }
  if (balance > 0) return input + "}".repeat(balance);
  return input;
}

function parseAiJsonResponse(raw: string): ExtractedProductData {
  let s = sanitizeAiJsonText(raw);
  if (!s) {
    throw new Error(
      "AI returned empty content after removing markdown code fences — expected a JSON object"
    );
  }
  s = escapeIllegalNewlinesInJsonStrings(s).trim();

  const tryParse = (t: string): ExtractedProductData =>
    JSON.parse(t) as ExtractedProductData;

  try {
    return tryParse(s);
  } catch {
    // fall through
  }

  const withBraces = appendMissingClosingBraces(s);
  try {
    return tryParse(withBraces);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`AI JSON parse failed after newline + brace repair: ${msg}`);
  }
}

// ─── Gemini 2.5 Flash (Multimodal) — stable v1 REST (prompt-based JSON, no responseMimeType) ─

async function extractWithGemini(
  text: string,
  images: Base64Image[]
): Promise<ExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { data: null, error: "GEMINI_API_KEY ไม่ได้ตั้งค่าใน .env.local" };

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Build parts array: text first, then images as inlineData
  const parts: object[] = [
    { text: `${SYSTEM_PROMPT}\n\nRaw text (may be empty if images provided):\n${text || "(none)"}` },
  ];

  for (const dataUrl of images) {
    // dataUrl format: "data:image/jpeg;base64,XXXX..."
    const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) continue;
    parts.push({
      inlineData: {
        mimeType: match[1],   // e.g. "image/jpeg"
        data: match[2],        // pure base64, no prefix
      },
    });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    let detail = bodyText.slice(0, 500);
    try {
      const j = JSON.parse(bodyText) as { error?: { message?: string; status?: string } };
      const msg = j?.error?.message ?? j?.error?.status;
      if (msg) detail = `${msg} (${res.status})`;
    } catch {
      detail = `${res.status} ${detail}`;
    }
    console.error(
      "[Gemini API] Request failed — check model name, API key, and billing. Details:",
      detail
    );
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 240)}`);
  }

  const result = await res.json();
  const rawJson: string | undefined =
    result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawJson) throw new Error("Gemini ไม่ส่งผลลัพธ์กลับมา");

  return { data: parseAiJsonResponse(rawJson), error: null };
}

// ─── OpenAI GPT-4o (Multimodal Vision) ────────────────────────────────────────

async function extractWithOpenAI(
  text: string,
  images: Base64Image[]
): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { data: null, error: "OPENAI_API_KEY ไม่ได้ตั้งค่าใน .env.local" };

  // Build user message content — text block + image blocks
  const userContent: object[] = [
    {
      type: "text",
      text: `Extract product data from the following text and/or images.\n\nRaw text:\n${text || "(none)"}`,
    },
  ];

  for (const dataUrl of images) {
    userContent.push({
      type: "image_url",
      image_url: { url: dataUrl, detail: "high" },
    });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`OpenAI ${res.status}: ${JSON.stringify(body).slice(0, 200)}`);
  }

  const result = await res.json();
  const rawJson: string | undefined = result?.choices?.[0]?.message?.content;

  if (!rawJson) throw new Error("OpenAI ไม่ส่งผลลัพธ์กลับมา");
  return { data: parseAiJsonResponse(rawJson), error: null };
}

// ─── Map AI strain_dominance to our 3 standard values ──────────────────────────

function mapStrainDominance(v: unknown): StrainDominanceValue | null {
  if (v == null || v === "") return null;
  const s = String(v).toLowerCase().trim();
  if (s.includes("indica") && !s.includes("sativa")) return "Mostly Indica";
  if (s.includes("sativa") && !s.includes("indica")) return "Mostly Sativa";
  if (s.includes("hybrid") || s.includes("50") || s.includes("50/50") || s.includes("balanced")) return "Hybrid 50/50";
  if (s === "mostly indica") return "Mostly Indica";
  if (s === "mostly sativa") return "Mostly Sativa";
  if (s === "hybrid 50/50") return "Hybrid 50/50";
  return null;
}

// ─── Sanitize ─────────────────────────────────────────────────────────────────

function normalizeFloweringFromAi(data: ExtractedProductData): "autoflower" | "photoperiod" | null {
  const raw = data.flowering_type as unknown;
  if (raw != null && raw !== "" && raw !== "Unknown") {
    const s = String(raw).toLowerCase();
    if (s.includes("auto")) return "autoflower";
    if (s.includes("photo")) return "photoperiod";
  }
  const sexRaw = String(data.sex_type ?? "");
  if (sexRaw.toLowerCase().includes("auto") && sexRaw.toLowerCase().includes("flower")) {
    return "autoflower";
  }
  return null;
}

function normalizeSexFromAi(
  data: ExtractedProductData,
  flowering: "autoflower" | "photoperiod" | null
): "feminized" | "regular" | null {
  const raw = data.sex_type as unknown;
  const s = raw != null && raw !== "Unknown" ? String(raw).toLowerCase() : "";
  if (s.includes("auto") && s.includes("flower")) {
    return flowering === "autoflower" ? "feminized" : null;
  }
  if (s.includes("regular") && !s.includes("fem")) return "regular";
  if (s.includes("feminized") || s === "fem" || s.includes("female")) return "feminized";
  if (flowering === "autoflower") return "feminized";
  return null;
}

function parseThcMax(v: unknown): number | null {
  if (v == null || v === "Unknown" || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.min(100, Math.max(0, v));
  }
  const s = String(v).trim();
  if (!s || s === "Unknown") return null;
  const nums = s.match(/\d+(?:\.\d+)?/g);
  if (!nums?.length) return null;
  const vals = nums.map((x) => parseFloat(x)).filter((n) => Number.isFinite(n));
  if (!vals.length) return null;
  const max = Math.max(...vals);
  return Math.min(100, Math.max(0, max));
}

function sanitizeCbd(v: unknown): string | null {
  if (v == null || v === "Unknown" || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  const s = String(v).trim();
  if (!s || s === "Unknown") return null;
  return s;
}

function sanitize(data: ExtractedProductData): ExtractedProductData {
  const clampNum = (v: unknown): number | null => {
    if (v == null || v === "Unknown" || v === "") return null;
    const n = Number(v);
    if (isNaN(n)) return null;
    return Math.min(100, Math.max(0, n));
  };
  const sp0 = data.sativa_percent ?? data.sativa_ratio;
  const ip0 = data.indica_percent ?? data.indica_ratio;
  const { sativa_percent: satP, indica_percent: indP } = normalizeSativaIndicaPercents(
    sp0,
    ip0
  );
  const sd =
    mapStrainDominance(data.strain_dominance) ??
    (satP != null && indP != null
      ? indP >= 60
        ? "Mostly Indica"
        : satP >= 60
          ? "Mostly Sativa"
          : "Hybrid 50/50"
      : mapStrainDominance(data.genetic_ratio) ?? mapStrainDominance(data.genetics));
  const flowering_type = normalizeFloweringFromAi(data);
  const sex_type = normalizeSexFromAi(data, flowering_type);
  const genetic_ratio =
    satP != null && indP != null ? formatGeneticRatioString(satP, indP) : data.genetic_ratio ?? null;

  return {
    ...data,
    strain_dominance: sd,
    sativa_percent: satP,
    indica_percent: indP,
    genetic_ratio,
    thc_percent: parseThcMax(data.thc_percent),
    cbd_percent: sanitizeCbd(data.cbd_percent),
    indica_ratio: indP,
    sativa_ratio: satP,
    flowering_type,
    sex_type,
  };
}

// ─── Unified Entry Point ──────────────────────────────────────────────────────

export async function extractProductSpecs(
  rawText: string,
  provider: AiProvider = "gemini",
  images: Base64Image[] = []
): Promise<ExtractionResult> {
  if (!rawText?.trim() && images.length === 0) {
    return { data: null, error: "ต้องมีข้อความหรือรูปภาพอย่างน้อย 1 อย่าง" };
  }

  try {
    const result =
      provider === "openai"
        ? await extractWithOpenAI(rawText, images)
        : await extractWithGemini(rawText, images);

    if (result.error) return result;
    if (!result.data) return { data: null, error: "AI ไม่ส่งข้อมูลกลับมา" };

    return { data: sanitize(result.data), error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// Backward-compat alias
export const extractProductData = (rawText: string) =>
  extractProductSpecs(rawText, "gemini", []);
