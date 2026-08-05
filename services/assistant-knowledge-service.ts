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
