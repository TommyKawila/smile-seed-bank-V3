/**
 * Parse draft-only blocks from assistant replies.
 */

export type DraftBlocks = {
  hasDraft: boolean;
  th: string | null;
  en: string | null;
  /** Prefer TH, else EN, for one-click copy. */
  primary: string | null;
};

function between(text: string, start: string, endMarkers: string[]): string | null {
  const i = text.indexOf(start);
  if (i < 0) return null;
  const from = i + start.length;
  let end = text.length;
  for (const m of endMarkers) {
    const j = text.indexOf(m, from);
    if (j >= 0 && j < end) end = j;
  }
  const body = text.slice(from, end).trim();
  return body || null;
}

export function extractDraftBlocks(content: string): DraftBlocks {
  const text = content ?? "";
  const th =
    between(text, "---DRAFT_TH---", ["---DRAFT_EN---", "---END_DRAFT---"]) ??
    between(text, "### Draft (TH)", ["### Draft (EN)", "---END_DRAFT---", "### "]);
  const en =
    between(text, "---DRAFT_EN---", ["---END_DRAFT---", "---DRAFT_TH---"]) ??
    between(text, "### Draft (EN)", ["---END_DRAFT---", "### Draft (TH)", "### "]);

  const primary = th || en || null;
  return {
    hasDraft: Boolean(primary),
    th,
    en,
    primary,
  };
}
