export type ArticleSegment =
  | { kind: "html"; html: string }
  | { kind: "affiliateId"; id: number }
  | { kind: "affiliateInline"; title: string; platform: string; url: string }
  | { kind: "productId"; id: number };

const AFF_PARAGRAPH = /<p>\s*\[AFFILIATE:\s*(\d+)\]\s*<\/p>/gi;
const AFF_INLINE = /\[AFFILIATE:\s*(\d+)\]/gi;
const INLINE_LEGACY_P =
  /<p>\s*\[Affiliate:\s*([^@]+?)\s*@\s*([^\]]+)\]\s*[—\-]\s*(https?:\/\/[^<\s]+)\s*<\/p>/gi;

function splitInlineAffiliateIds(html: string): ArticleSegment[] {
  const segments: ArticleSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(AFF_INLINE.source, AFF_INLINE.flags);
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) segments.push({ kind: "html", html: html.slice(last, m.index) });
    segments.push({ kind: "affiliateId", id: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < html.length) segments.push({ kind: "html", html: html.slice(last) });
  if (segments.length === 0) return [{ kind: "html", html }];
  return segments;
}

function splitByAffiliateParagraph(html: string): ArticleSegment[] {
  const out: ArticleSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(AFF_PARAGRAPH.source, AFF_PARAGRAPH.flags);
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) out.push({ kind: "html", html: html.slice(last, m.index) });
    out.push({ kind: "affiliateId", id: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < html.length) out.push({ kind: "html", html: html.slice(last) });
  if (out.length === 0) return [{ kind: "html", html }];
  return out;
}

function splitInlineAffiliateParagraphs(html: string): ArticleSegment[] {
  const segments: ArticleSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(INLINE_LEGACY_P.source, INLINE_LEGACY_P.flags);
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) segments.push({ kind: "html", html: html.slice(last, m.index) });
    segments.push({
      kind: "affiliateInline",
      title: m[1].trim(),
      platform: m[2].trim(),
      url: m[3].trim(),
    });
    last = m.index + m[0].length;
  }
  if (last < html.length) segments.push({ kind: "html", html: html.slice(last) });
  if (segments.length === 0) return [{ kind: "html", html }];
  return segments;
}

const PRODUCT_PARAGRAPH = /<p>\s*\[PRODUCT_CARD:\s*(\d+)\]\s*<\/p>/gi;
const PRODUCT_INLINE = /\[PRODUCT_CARD:\s*(\d+)\]/gi;

function splitByProductParagraph(html: string): ArticleSegment[] {
  const out: ArticleSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(PRODUCT_PARAGRAPH.source, PRODUCT_PARAGRAPH.flags);
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) out.push({ kind: "html", html: html.slice(last, m.index) });
    out.push({ kind: "productId", id: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < html.length) out.push({ kind: "html", html: html.slice(last) });
  if (out.length === 0) return [{ kind: "html", html }];
  return out;
}

function splitInlineProductIds(html: string): ArticleSegment[] {
  const segments: ArticleSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(PRODUCT_INLINE.source, PRODUCT_INLINE.flags);
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) segments.push({ kind: "html", html: html.slice(last, m.index) });
    segments.push({ kind: "productId", id: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < html.length) segments.push({ kind: "html", html: html.slice(last) });
  if (segments.length === 0) return [{ kind: "html", html }];
  return segments;
}

function parseProductSegments(html: string): ArticleSegment[] {
  const paraParts = splitByProductParagraph(html);
  const out: ArticleSegment[] = [];
  for (const p of paraParts) {
    if (p.kind !== "html") {
      out.push(p);
      continue;
    }
    out.push(...splitInlineProductIds(p.html));
  }
  return out;
}

export function parseArticleSegments(html: string): ArticleSegment[] {
  const paraParts = splitByAffiliateParagraph(html);
  const out: ArticleSegment[] = [];
  for (const p of paraParts) {
    if (p.kind !== "html") {
      out.push(p);
      continue;
    }
    const withInlineIds = splitInlineAffiliateIds(p.html);
    for (const q of withInlineIds) {
      if (q.kind !== "html") {
        out.push(q);
        continue;
      }
      const legacyParts = splitInlineAffiliateParagraphs(q.html);
      for (const r of legacyParts) {
        if (r.kind !== "html") {
          out.push(r);
          continue;
        }
        out.push(...parseProductSegments(r.html));
      }
    }
  }
  return out;
}

export function collectProductIdsFromSegments(segments: ArticleSegment[]): number[] {
  return segments.filter((s) => s.kind === "productId").map((s) => s.id);
}

function countClosingPs(html: string): number {
  return (html.match(/<\/p>/gi) || []).length;
}

/** Split after [SMART_TIE_IN], or after 3rd paragraph (or 2nd if fewer), else end. */
export function splitForSmartTieIn(html: string): [string, string] {
  const wrapped = html.match(/<p>\s*\[SMART_TIE_IN]\s*<\/p>/i);
  if (wrapped && wrapped.index !== undefined) {
    return [html.slice(0, wrapped.index), html.slice(wrapped.index + wrapped[0].length)];
  }
  const plain = "[SMART_TIE_IN]";
  const i = html.indexOf(plain);
  if (i !== -1) {
    return [html.slice(0, i), html.slice(i + plain.length)];
  }
  const n = countClosingPs(html);
  if (n === 0) return [html, ""];
  const target = n >= 3 ? 3 : n >= 2 ? 2 : 1;
  const matches = [...html.matchAll(/<\/p>/gi)];
  const hit = matches[target - 1];
  if (!hit || hit.index === undefined) return [html, ""];
  const pos = hit.index + hit[0].length;
  return [html.slice(0, pos), html.slice(pos)];
}
