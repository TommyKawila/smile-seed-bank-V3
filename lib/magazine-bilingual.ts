/** Storefront + metadata locale for magazine strings (matches cookie `locale`). */
export type MagLocale = "th" | "en";

export function magazineLocaleFromCookie(v: string | undefined): MagLocale {
  return v === "en" ? "en" : "th";
}

function tiptapPlainText(doc: unknown): string {
  if (doc == null) return "";
  if (typeof doc === "string") return doc;
  if (typeof doc !== "object") return "";
  const o = doc as Record<string, unknown>;
  if (typeof o.text === "string") return o.text;
  const c = o.content;
  if (Array.isArray(c)) return c.map(tiptapPlainText).join("");
  return "";
}

export function isTiptapDocEmpty(doc: unknown): boolean {
  return tiptapPlainText(doc).trim().length === 0;
}

export function magazineDisplayTitle(
  post: { title: string; title_en?: string | null },
  locale: MagLocale
): string {
  if (locale === "en") {
    const e = post.title_en?.trim();
    if (e) return e;
  }
  return post.title;
}

export function magazineDisplayExcerpt(
  post: { excerpt: string | null; excerpt_en?: string | null },
  locale: MagLocale
): string | null {
  if (locale === "en") {
    const e = post.excerpt_en?.trim();
    if (e) return e;
  }
  return post.excerpt;
}

export function magazineDisplayTagline(
  post: { tagline?: string | null; tagline_en?: string | null },
  locale: MagLocale
): string | null {
  if (locale === "en") {
    const e = post.tagline_en?.trim();
    if (e) return e;
  }
  return post.tagline?.trim() || null;
}

export function magazineDisplayContentJson(
  post: { content: unknown; content_en?: unknown | null },
  locale: MagLocale
): unknown {
  if (
    locale === "en" &&
    post.content_en != null &&
    !isTiptapDocEmpty(post.content_en)
  ) {
    return post.content_en;
  }
  return post.content;
}
