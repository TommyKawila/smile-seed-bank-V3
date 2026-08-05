import OpenAI from "openai";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      throw new Error("Missing OPENAI_API_KEY for embeddings.");
    }
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

/** Embed one or more texts with OpenAI text-embedding-3-small (1536-d). */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];

  const cleaned = texts.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!cleaned.length) return [];

  const res = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleaned,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  const byIndex = new Map(res.data.map((d) => [d.index, d.embedding]));
  return cleaned.map((_, i) => {
    const emb = byIndex.get(i);
    if (!emb) throw new Error(`Missing embedding for index ${i}`);
    return emb;
  });
}
