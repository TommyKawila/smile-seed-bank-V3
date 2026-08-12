import { randomUUID } from "crypto";
import { embedTexts } from "@/lib/embeddings";
import { chunkText } from "@/lib/knowledge-chunk";
import { assistantDb } from "@/lib/ssb-assistant-db";

const TABLE = "long_term_memories";
const LIST_LIMIT = 100;
const PREVIEW_LEN = 160;

export type KnowledgeSource = "paste" | "upload";

export type KnowledgeMetadata = {
  title?: string;
  source: KnowledgeSource;
  filename?: string;
  chunkIndex: number;
  chunkTotal: number;
  groupId: string;
};

export type KnowledgeEntry = {
  id: string;
  content: string;
  preview: string;
  metadata: KnowledgeMetadata | Record<string, unknown>;
  created_at: string;
  title: string;
};

function previewOf(content: string): string {
  const oneLine = content.replace(/\s+/g, " ").trim();
  if (oneLine.length <= PREVIEW_LEN) return oneLine;
  return `${oneLine.slice(0, PREVIEW_LEN)}…`;
}

function titleFromMeta(
  meta: Record<string, unknown> | null | undefined,
  content: string
): string {
  const t = typeof meta?.title === "string" ? meta.title.trim() : "";
  if (t) return t;
  const fn = typeof meta?.filename === "string" ? meta.filename.trim() : "";
  if (fn) return fn;
  return previewOf(content).slice(0, 48) || "Untitled";
}

export async function listKnowledgeEntries(): Promise<KnowledgeEntry[]> {
  const { data, error } = await assistantDb()
    .from(TABLE)
    .select("id, content, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    throw new Error(error.message || "Failed to list knowledge");
  }

  return ((data ?? []) as Array<{
    id: string;
    content: string;
    metadata?: Record<string, unknown> | null;
    created_at: string;
  }>).map((row) => ({
    id: String(row.id),
    content: row.content,
    preview: previewOf(row.content ?? ""),
    metadata: row.metadata ?? {},
    created_at: row.created_at,
    title: titleFromMeta(row.metadata, row.content ?? ""),
  }));
}

export async function addKnowledgeFromText(opts: {
  title?: string;
  content: string;
  source: KnowledgeSource;
  filename?: string;
}): Promise<{ inserted: number; groupId: string }> {
  const content = opts.content.trim();
  if (!content) {
    throw new Error("content is required");
  }

  const chunks = chunkText(content);
  if (!chunks.length) {
    throw new Error("No content to store after chunking");
  }

  const embeddings = await embedTexts(chunks);
  if (embeddings.length !== chunks.length) {
    throw new Error("Embedding count mismatch");
  }

  const groupId = randomUUID();
  const title = opts.title?.trim() || undefined;
  const rows = chunks.map((chunk, i) => {
    const metadata: KnowledgeMetadata = {
      title,
      source: opts.source,
      filename: opts.filename?.trim() || undefined,
      chunkIndex: i,
      chunkTotal: chunks.length,
      groupId,
    };
    return {
      content: chunk,
      metadata,
      embedding: embeddings[i],
    };
  });

  const { error } = await assistantDb().from(TABLE).insert(rows);
  if (error) {
    throw new Error(error.message || "Failed to insert knowledge");
  }

  return { inserted: rows.length, groupId };
}

export async function deleteKnowledgeEntry(id: string): Promise<void> {
  const trimmed = id.trim();
  if (!trimmed) throw new Error("id is required");

  const { error } = await assistantDb().from(TABLE).delete().eq("id", trimmed);
  if (error) {
    throw new Error(error.message || "Failed to delete knowledge");
  }
}

function parseEmbedding(raw: unknown): number[] | null {
  if (Array.isArray(raw) && raw.every((n) => typeof n === "number")) {
    return raw as number[];
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
        return parsed as number[];
      }
    } catch {
      return null;
    }
  }
  return null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return -1;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return -1;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export type KnowledgeSearchHit = {
  id: string;
  content: string;
  score: number;
  title: string;
};

/** Top-k semantic search over long_term_memories (client-side cosine on recent rows). */
export async function searchKnowledge(
  query: string,
  topK = 5
): Promise<KnowledgeSearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  let queryEmbedding: number[];
  try {
    const [emb] = await embedTexts([q]);
    queryEmbedding = emb;
  } catch (err) {
    console.error("[knowledge] embed query failed:", err);
    return [];
  }

  const { data, error } = await assistantDb()
    .from(TABLE)
    .select("id, content, metadata, embedding")
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    console.error("[knowledge] search fetch failed:", error.message);
    return [];
  }

  const scored: KnowledgeSearchHit[] = [];
  for (const row of (data ?? []) as Array<{
    id: string;
    content: string;
    metadata?: Record<string, unknown> | null;
    embedding?: unknown;
  }>) {
    const emb = parseEmbedding(row.embedding);
    if (!emb) continue;
    const score = cosineSimilarity(queryEmbedding, emb);
    if (score < 0.2) continue;
    scored.push({
      id: String(row.id),
      content: row.content ?? "",
      score,
      title: titleFromMeta(row.metadata, row.content ?? ""),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.min(Math.max(topK, 1), 8));
}
