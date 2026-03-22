// AI Product Extraction Service
// Supports: Google Gemini 1.5 Flash | OpenAI GPT-4o-mini
// Both providers support multimodal input (text + images)
// Both return the same ExtractedProductData interface

export type AiProvider = "gemini" | "openai";

export type StrainDominanceValue = "Mostly Indica" | "Mostly Sativa" | "Hybrid 50/50";

export interface ExtractedProductData {
  name?: string;
  category?: string;
  genetics?: string;
  lineage?: string | null;
  genetic_ratio?: string | null;
  strain_dominance?: StrainDominanceValue | null;
  thc_percent?: number | null;
  cbd_percent?: number | null;
  indica_ratio?: number | null;
  sativa_ratio?: number | null;
  flowering_type?: "AUTO" | "PHOTO" | null;
  seed_type?: "FEMINIZED" | "REGULAR" | null;
  sex_type?: string | null;
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
  "genetic_ratio": "string — ratio like 'Sativa 70% / Indica 30%'. If Hybrid with no specific ratio use 'Sativa 50% / Indica 50%'. NEVER leave empty or just say 'Hybrid'. Use \"Unknown\" only if strain type is truly unidentifiable.",
  "strain_dominance": "Mostly Indica" | "Mostly Sativa" | "Hybrid 50/50" | null — REQUIRED. Infer from genetics, genetic_ratio, or keywords in text/images. Keywords: "Indica Dominant", "Mostly Indica", "Indica-leaning" → "Mostly Indica"; "Sativa Dominant", "Mostly Sativa", "Sativa-leaning" → "Mostly Sativa"; "50/50", "Hybrid", "Balanced", "Indica/Sativa" → "Hybrid 50/50". Use null only if truly unidentifiable.",
  "thc_percent": number | null (0-100, numbers only. Use null if not found — do NOT use \"Unknown\" for this field),
  "cbd_percent": number | null (0-100. Use null if not found),
  "indica_ratio": number | null (0-100 integer. Use null if not found),
  "sativa_ratio": number | null (0-100 integer, typically 100-indica_ratio. Use null if not found),
  "flowering_type": "AUTO" | "PHOTO" | null,
  "seed_type": "FEMINIZED" | "REGULAR" | null,
  "sex_type": "Feminized" | "Regular" | "Autoflower" | "Unknown",
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
1. FALLBACK: For any string field where data cannot be found or reasonably inferred, output the exact string "Unknown". For number fields (thc_percent, cbd_percent, indica_ratio, sativa_ratio) that cannot be found, output null.
2. STRAIN_DOMINANCE: Look for keywords like "Mostly Indica", "Indica Dominant", "Indica-leaning", "Sativa Dominant", "Mostly Sativa", "50/50 Hybrid", "Balanced Hybrid". Map to exactly one of: "Mostly Indica", "Mostly Sativa", or "Hybrid 50/50". Use genetic_ratio (e.g. Indica 70%+ → Mostly Indica, Sativa 70%+ → Mostly Sativa, ~50/50 → Hybrid 50/50) if no explicit keywords.
3. GENETIC RATIO: Always output a specific ratio like "Sativa 70% / Indica 30%". If the strain is identified as a Hybrid but no specific ratio is stated, you MUST output "Sativa 50% / Indica 50%". NEVER output just "Hybrid" alone.
4. LINEAGE: Use the × symbol between parent strains. Identify Father × Mother if mentioned.
5. TERPENES: Infer terpene names from flavor/aroma descriptions if not explicitly listed (e.g. citrus/lemon → Limonene, earthy/musky → Myrcene, spicy/pepper → Caryophyllene, pine → Pinene, floral → Linalool).
6. DESCRIPTION (ENGLISH): Write a rich narrative of 5-8 sentences synthesizing: strain character, lineage heritage, THC/CBD potency, effects experience, flavor/aroma profile, growing traits, and recommended use cases. Tone: premium cannabis seed bank catalog.
7. DESCRIPTION (THAI): Translate the English description into natural, fluent Thai. Write as if a native Thai speaker composed it — not a word-for-word translation.

Return ONLY a valid JSON object (no markdown, no code fences, no explanation) matching this schema:
${JSON_SCHEMA}`;

// ─── Gemini 1.5 Flash (Multimodal) ───────────────────────────────────────────

async function extractWithGemini(
  text: string,
  images: Base64Image[]
): Promise<ExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { data: null, error: "GEMINI_API_KEY ไม่ได้ตั้งค่าใน .env.local" };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }

  const result = await res.json();
  const rawJson: string | undefined =
    result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawJson) throw new Error("Gemini ไม่ส่งผลลัพธ์กลับมา");
  return { data: JSON.parse(rawJson) as ExtractedProductData, error: null };
}

// ─── OpenAI GPT-4o-mini (Multimodal Vision) ───────────────────────────────────

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
      model: "gpt-4o-mini",
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
  return { data: JSON.parse(rawJson) as ExtractedProductData, error: null };
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

function sanitize(data: ExtractedProductData): ExtractedProductData {
  const clampNum = (v: unknown): number | null => {
    if (v == null || v === "Unknown" || v === "") return null;
    const n = Number(v);
    if (isNaN(n)) return null;
    return Math.min(100, Math.max(0, n));
  };
  const sd = mapStrainDominance(data.strain_dominance) ?? (data.indica_ratio != null && data.sativa_ratio != null
    ? (data.indica_ratio >= 60 ? "Mostly Indica" : data.sativa_ratio >= 60 ? "Mostly Sativa" : "Hybrid 50/50")
    : mapStrainDominance(data.genetic_ratio) ?? mapStrainDominance(data.genetics));
  return {
    ...data,
    strain_dominance: sd,
    thc_percent: clampNum(data.thc_percent),
    cbd_percent: clampNum(data.cbd_percent),
    indica_ratio: clampNum(data.indica_ratio),
    sativa_ratio: clampNum(data.sativa_ratio),
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
