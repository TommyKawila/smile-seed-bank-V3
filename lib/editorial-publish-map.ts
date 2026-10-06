export type EditorialPublishJob = {
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: unknown;
  title_en: string | null;
  excerpt_en: string | null;
  content_en: unknown;
  featured_image: string | null;
  tags: string[];
  category_id: bigint | number | null;
  research_summary: string | null;
  source_prompt: string | null;
  sources: unknown;
};

export type MappedBlogPostFields = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: unknown;
  title_en: string | null;
  excerpt_en: string | null;
  content_en: unknown;
  featured_image: string | null;
  tags: string[];
  category_id: bigint | null;
  status: "PUBLISHED";
  raw_input: string | null;
};

type SourceTrace = {
  id?: unknown;
  title?: unknown;
  url?: unknown;
  publisher?: unknown;
  source_type?: unknown;
};

const SECRET_ENV_KEYS = [
  "EDITORIAL_API_KEY",
  "OPENAI_API_KEY",
  "DATABASE_URL",
  "DIRECT_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function redactResearchSecrets(text: string): string {
  let out = text.replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
  for (const name of SECRET_ENV_KEYS) {
    const value = process.env[name]?.trim();
    if (!value || value.length < 8) continue;
    out = out.split(value).join("[redacted]");
  }
  return out;
}

function sourceTraceList(sources: unknown): SourceTrace[] {
  if (!Array.isArray(sources)) return [];
  return sources.slice(0, 50).map((row) => {
    if (!row || typeof row !== "object") return {};
    const o = row as Record<string, unknown>;
    return {
      id: typeof o.id === "string" ? o.id : undefined,
      title: typeof o.title === "string" ? o.title : undefined,
      url: typeof o.url === "string" ? o.url : undefined,
      publisher: typeof o.publisher === "string" ? o.publisher : undefined,
      source_type:
        typeof o.source_type === "string" ? o.source_type : undefined,
    };
  });
}

export function buildResearchTrace(job: EditorialPublishJob): string | null {
  const parts: string[] = [];
  const prompt = job.source_prompt?.trim();
  if (prompt) parts.push(`Source prompt:\n${prompt}`);
  const summary = job.research_summary?.trim();
  if (summary) parts.push(`Research summary:\n${summary}`);
  const sources = sourceTraceList(job.sources);
  if (sources.length > 0) {
    parts.push(`Sources:\n${JSON.stringify(sources, null, 2)}`);
  }
  if (parts.length === 0) return null;
  return redactResearchSecrets(parts.join("\n\n"));
}

export function buildBlogPostMappedFields(
  job: EditorialPublishJob,
  slug: string
): MappedBlogPostFields {
  const title = job.title?.trim() ?? "";
  return {
    title,
    slug,
    excerpt: job.excerpt?.trim() || null,
    content: job.content,
    title_en: job.title_en?.trim() || null,
    excerpt_en: job.excerpt_en?.trim() || null,
    content_en: job.content_en,
    featured_image: job.featured_image?.trim() || null,
    tags: job.tags ?? [],
    category_id:
      job.category_id != null ? BigInt(job.category_id) : null,
    status: "PUBLISHED",
    raw_input: buildResearchTrace(job),
  };
}

export function isUpdateExistingPost(publishedPostId: bigint | null): boolean {
  return publishedPostId != null;
}
