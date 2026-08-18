export type FormattedBusinessLetter = {
  subject: string;
  bodyPlain: string;
  /** Safe HTML fragment (paragraphs + strong) for email/print */
  bodyHtml: string;
};

const FOUNDER_LINE = "Founder, Smile Seed Bank";
const PARA_BREAK_MARKERS =
  /\b(However,|When\s|We appreciate|Thank you|After a|Looking forward|To move forward|Please let)/g;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateLabel(isoDate: string, locale: string = "en-GB"): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export type LetterPlaceholderValues = {
  recipientName?: string;
  senderName?: string;
  senderTitle?: string;
  companyEmail?: string;
  companyPhone?: string;
  documentDate?: string;
};

/** Replace [placeholder] tokens from dispatcher form fields before formatting. */
export function applyLetterPlaceholders(
  raw: string,
  values: LetterPlaceholderValues
): string {
  const recipient = values.recipientName?.trim() ?? "";
  const sender = values.senderName?.trim() ?? "";
  const title = values.senderTitle?.trim() || "Founder";
  const email = values.companyEmail?.trim() ?? "";
  const phone = values.companyPhone?.trim() ?? "";
  const dateEn = values.documentDate
    ? formatDateLabel(values.documentDate, "en-GB")
    : "";
  const dateTh = values.documentDate
    ? formatDateLabel(values.documentDate, "th-TH")
    : "";

  const pairs: [RegExp, string][] = [
    [/\[ชื่อผู้ติดต่อ\]/g, recipient],
    [/\[Contact Name\]/gi, recipient],
    [/\[ชื่อผู้ลงนาม\]/g, sender],
    [/\[Your Name\]/gi, sender],
    [/\[Name\]/g, sender],
    [/\[ตำแหน่ง\]/g, title],
    [/\[Title\]/gi, title],
    [/\[email\]/gi, email],
    [/\[phone\]/gi, phone],
    [/\[วันที่\]/g, dateTh || dateEn],
    [/\[date\]/gi, dateEn || dateTh],
    [/\[Date\]/g, dateEn || dateTh],
  ];

  let out = raw;
  for (const [pattern, replacement] of pairs) {
    if (replacement) out = out.replace(pattern, replacement);
  }
  return out;
}

function normalizeWhitespace(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
}

/** Collapse blob into single-spaced text keeping intentional newlines when present. */
function flattenBlob(raw: string): string {
  const n = normalizeWhitespace(raw);
  const newlineCount = (n.match(/\n/g) ?? []).length;
  if (newlineCount >= 2) {
    return n.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  }
  return n.replace(/\s+/g, " ").trim();
}

function extractSubject(text: string): { subject: string; rest: string } {
  const th = text.match(/^เรื่อง:\s*(.+?)(?=\n|$)/s);
  if (th) {
    const subject = th[1]!.trim().replace(/\s+/g, " ");
    const rest = text.slice(th[0].length).trim();
    return { subject, rest };
  }
  const en = text.match(/^Subject:\s*(.+?)(?=\s*Dear\s|\s*เรียน\s|\s*$)/is);
  if (en) {
    const subject = en[1]!.trim().replace(/\s+/g, " ");
    const rest = text.slice(en[0].length).trim();
    return { subject, rest };
  }
  return { subject: "", rest: text };
}

function extractGreeting(text: string): { greeting: string; rest: string } {
  const th = text.match(/^(เรียน\s+[^\n]+)\n?/);
  if (th) {
    return { greeting: th[1]!.trim(), rest: text.slice(th[0].length).trim() };
  }
  const en = text.match(/^(Dear\s+[^,]+,)\s*/i);
  if (en) {
    return { greeting: en[1]!.trim(), rest: text.slice(en[0].length).trim() };
  }
  return { greeting: "", rest: text };
}

function extractSignOff(text: string): {
  body: string;
  signOff: string;
  signatureLines: string[];
} {
  const en = text.match(/\b(Best regards|Sincerely|Kind regards|Warm regards),?\s*/i);
  const th = text.match(/(ขอแสดงความนับถือ)\s*/);
  const m = en ?? th;
  if (!m || m.index == null) {
    return { body: text, signOff: "", signatureLines: [] };
  }
  const body = text.slice(0, m.index).trim();
  const after = text.slice(m.index + m[0].length).trim();
  const signOff = th
    ? m[1]!.trim()
    : `${m[1]},`;
  const signatureLines = after
    ? after.split(/\n+/).map((l) => l.trim()).filter(Boolean)
    : [];
  // Blob: "Best regards,[Your Name]Founder, Smile Seed Bank"
  if (signatureLines.length === 0 && after) {
    const founderIdx = after.search(/Founder,\s*Smile Seed Bank/i);
    if (founderIdx >= 0) {
      const namePart = after.slice(0, founderIdx).trim().replace(/,\s*$/, "");
      signatureLines.push(namePart || "[Your Name]", FOUNDER_LINE);
    } else {
      signatureLines.push(after);
    }
  } else if (signatureLines.length === 1) {
    const line = signatureLines[0]!;
    const founderIdx = line.search(/Founder,\s*Smile Seed Bank/i);
    if (founderIdx > 0) {
      signatureLines.length = 0;
      signatureLines.push(line.slice(0, founderIdx).trim(), FOUNDER_LINE);
    }
  }
  return { body, signOff, signatureLines };
}

function isMarkdownTableSeparator(line: string): boolean {
  const t = line.trim();
  return /^\|?[\s\-:|]+\|?$/.test(t) && /-{2,}/.test(t);
}

function isMarkdownTableBlock(block: string): boolean {
  const lines = block
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return false;
  const pipeLines = lines.filter((l) => l.includes("|"));
  if (pipeLines.length < 2) return false;
  return lines.some(isMarkdownTableSeparator) || pipeLines.length >= 2;
}

function isTsvTableBlock(block: string): boolean {
  const lines = block
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return false;
  if (lines.some((l) => l.includes("|"))) return false;
  const tabLines = lines.filter((l) => l.includes("\t"));
  if (tabLines.length < 2) return false;
  const cols = tabLines[0]!.split("\t").length;
  return cols >= 2 && tabLines.every((l) => l.split("\t").length === cols);
}

function isBulletListBlock(block: string): boolean {
  const lines = block
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length >= 1 && lines.every((l) => /^[-•*]\s+/.test(l));
}

function parseMarkdownTableRow(line: string): string[] {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|")) row = row.slice(0, -1);
  return row.split("|").map((c) => c.trim());
}

function tableToHtml(rows: string[][]): string {
  if (rows.length === 0) return "";
  const [header, ...bodyRows] = rows;
  const ths = header!
    .map(
      (c) =>
        `<th style="border:1px solid #cbd5e1;padding:6px 8px;background:#f1f5f9;font-weight:600;color:#12463e;text-align:left;">${escapeHtml(c)}</th>`
    )
    .join("");
  const trs = bodyRows
    .map((row) => {
      const cells = header!.map((_, i) => {
        const val = row[i] ?? "";
        return `<td style="border:1px solid #cbd5e1;padding:6px 8px;vertical-align:top;">${escapeHtml(val)}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table class="doc-table" style="width:100%;border-collapse:collapse;margin:12px 0 16px;font-size:10pt;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function structuredTableToHtml(block: string): string {
  const trimmed = block.trim();
  if (isMarkdownTableBlock(trimmed)) {
    const rows = trimmed
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !isMarkdownTableSeparator(l))
      .map(parseMarkdownTableRow);
    return tableToHtml(rows);
  }
  if (isTsvTableBlock(trimmed)) {
    const rows = trimmed
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.split("\t").map((c) => c.trim()));
    return tableToHtml(rows);
  }
  return `<p>${escapeHtml(trimmed.replace(/\s*\n\s*/g, " "))}</p>`;
}

function structuredBlockToHtml(block: string): string {
  const trimmed = block.trim();
  if (isMarkdownTableBlock(trimmed) || isTsvTableBlock(trimmed)) {
    return structuredTableToHtml(trimmed);
  }
  if (isBulletListBlock(trimmed)) {
    const items = trimmed
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^[-•*]\s+/, ""));
    return `<ul class="doc-list">${items
      .map((i) => `<li>${applyBoldHtml(escapeHtml(i))}</li>`)
      .join("")}</ul>`;
  }
  const lines = trimmed.split("\n").map((l) => l.trim());
  const joined = lines.join("\n");
  const withBreaks = lines.map((l) => escapeHtml(l)).join("<br>");
  return `<p>${applyBoldHtml(withBreaks)}</p>`;
}

function isBulletLine(line: string): boolean {
  return /^[-•*]\s+/.test(line.trim());
}

function isTableLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (isMarkdownTableSeparator(t)) return true;
  return t.includes("|");
}

function isTsvLine(line: string): boolean {
  return line.trim().includes("\t");
}

function isSectionHeadingLine(line: string): boolean {
  const t = line.trim();
  return /^\d+\)\s/.test(t) || /^[A-Z]\)\s/.test(t) || /^---+$/.test(t);
}

type LineBlockKind = "para" | "table" | "list" | "tsv";

function lineBlockKind(trimmed: string): LineBlockKind | "heading" {
  if (isTableLine(trimmed)) return "table";
  if (isBulletLine(trimmed)) return "list";
  if (isTsvLine(trimmed)) return "tsv";
  if (isSectionHeadingLine(trimmed)) return "heading";
  return "para";
}

/** Scan body line-by-line; preserve markdown tables, lists, and section headings. */
export function splitLetterBodyIntoBlocks(body: string): string[] {
  const normalized = normalizeWhitespace(body);
  if (!normalized) return [];

  const blocks: string[] = [];
  let buf: string[] = [];
  let bufKind: LineBlockKind | null = null;

  const flush = () => {
    if (buf.length === 0) return;
    blocks.push(buf.join("\n").trim());
    buf = [];
    bufKind = null;
  };

  for (const raw of normalized.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) {
      flush();
      continue;
    }

    const kind = lineBlockKind(trimmed);
    if (kind === "heading") {
      flush();
      blocks.push(trimmed);
      continue;
    }

    if (kind === "table" || kind === "tsv") {
      const tableKind: LineBlockKind = kind === "tsv" ? "tsv" : "table";
      if (bufKind && bufKind !== tableKind && bufKind !== "table" && bufKind !== "tsv") {
        flush();
      }
      bufKind = tableKind;
      buf.push(trimmed);
      continue;
    }

    if (kind === "list") {
      if (bufKind && bufKind !== "list") flush();
      bufKind = "list";
      buf.push(trimmed);
      continue;
    }

    if (bufKind && bufKind !== "para") flush();
    bufKind = "para";
    buf.push(trimmed);
  }

  flush();
  return blocks.filter(Boolean);
}

function isSectionHeadingBlock(block: string): boolean {
  return isSectionHeadingLine(block.trim());
}

function letterBlockToHtml(block: string): string {
  const trimmed = block.trim();
  if (!trimmed) return "";

  if (isMarkdownTableBlock(trimmed) || isTsvTableBlock(trimmed)) {
    return structuredTableToHtml(trimmed);
  }
  if (isBulletListBlock(trimmed)) {
    return structuredBlockToHtml(trimmed);
  }

  const lines = trimmed.split("\n").map((l) => l.trim());
  const joined = lines.join("\n");

  if (/^Subject:/i.test(joined)) {
    const rest = joined.replace(/^Subject:\s*/i, "");
    return `<p class="doc-subject"><strong>Subject:</strong> ${escapeHtml(rest)}</p>`;
  }
  if (/^เรื่อง:/.test(joined)) {
    const rest = joined.replace(/^เรื่อง:\s*/, "");
    return `<p class="doc-subject"><strong>เรื่อง:</strong> ${escapeHtml(rest)}</p>`;
  }
  if (
    /^(Best regards|Sincerely|Kind regards|Warm regards|ขอแสดงความนับถือ),?\s*$/i.test(
      joined
    )
  ) {
    return `<p class="doc-signoff"><strong>${escapeHtml(joined.replace(/,?$/, joined.includes("ขอแสดง") ? "" : ","))}</strong></p>`;
  }
  if (
    lines.length >= 2 &&
    (lines.some((l) => /Founder,\s*Smile Seed Bank/i.test(l)) ||
      lines.some((l) =>
        /ห้างหุ้นส่วนจำกัด|T\.M\.Y Agro Trade|Smile Seed Bank/i.test(l)
      ))
  ) {
    return `<p class="doc-signature">${lines.map((l) => escapeHtml(l)).join("<br>")}</p>`;
  }
  if (
    lines.length === 1 &&
    /^(?:\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4})$/.test(joined)
  ) {
    return `<p class="doc-date">${escapeHtml(joined)}</p>`;
  }
  if (isSectionHeadingBlock(trimmed)) {
    return `<p class="doc-heading"><strong>${escapeHtml(trimmed)}</strong></p>`;
  }

  if (lines.length === 1) {
    return `<p>${applyBoldHtml(escapeHtml(lines[0]!))}</p>`;
  }
  const withBreaks = lines.map((l) => escapeHtml(l)).join("<br>");
  return `<p>${applyBoldHtml(withBreaks)}</p>`;
}

function splitParagraphs(body: string): string[] {
  const blocks = splitLetterBodyIntoBlocks(body);
  if (blocks.length > 0) return blocks;

  let working = body.trim();
  if (!working) return [];

  working = working.replace(PARA_BREAK_MARKERS, "\n\n$1");
  working = working.replace(/([.!?])\s+(?=[A-Z])/g, "$1\n\n");

  return working
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function boldInlinePlain(text: string): string {
  // Title-case Label: at start of paragraph
  return text.replace(
    /^([A-Z][A-Za-z0-9 /&-]{1,48}:)(\s)/,
    "**$1**$2"
  );
}

function applyBoldHtml(escapedParagraph: string): string {
  let html = escapedParagraph;
  // Label: at start
  html = html.replace(
    /^([A-Z][A-Za-z0-9 /&amp;-]{1,48}:)(\s)/,
    "<strong>$1</strong>$2"
  );
  // Smile Seed Bank
  html = html.replace(/\bSmile Seed Bank\b/g, "<strong>Smile Seed Bank</strong>");
  // Best regards / Sincerely lines handled separately
  return html;
}

function resolveSignature(
  signatureLines: string[],
  senderName: string
): string[] {
  const sender = senderName.trim() || "[Your Name]";
  if (signatureLines.length >= 2) {
    return signatureLines.map((l) =>
      l === "[Your Name]" || /^\[Your Name\]/i.test(l) ? sender : l
    );
  }
  let lines = [...signatureLines];
  if (lines.length === 0) {
    return [sender, FOUNDER_LINE];
  }
  lines = lines.map((l) =>
    l === "[Your Name]" || /^\[Your Name\]/i.test(l) ? sender : l
  );
  if (!lines.some((l) => /Founder,\s*Smile Seed Bank/i.test(l))) {
    lines.push(FOUNDER_LINE);
  }
  if (lines[0] === FOUNDER_LINE) {
    lines = [sender, ...lines];
  }
  return lines;
}

export type FormatRawLetterOptions = LetterPlaceholderValues & {
  /** Include formatted date line under subject */
  includeDate?: boolean;
};

/**
 * Turn pasted raw B2B letter blob into formatted plain text + HTML body.
 */
export function formatRawBusinessLetter(
  raw: string,
  opts: FormatRawLetterOptions
): FormattedBusinessLetter {
  const thaiSubjectLine = /^เรื่อง:/m.test(raw);
  const withPlaceholders = applyLetterPlaceholders(raw, opts);
  const flat = flattenBlob(withPlaceholders);
  const { subject: extractedSubject, rest: afterSubject } = extractSubject(flat);
  const { greeting, rest: afterGreeting } = extractGreeting(afterSubject);
  const { body, signOff, signatureLines } = extractSignOff(afterGreeting);
  const paragraphs = splitParagraphs(body);
  const sig = resolveSignature(signatureLines, opts.senderName ?? "");
  const dateLabel = opts.documentDate
    ? formatDateLabel(opts.documentDate, "en-GB")
    : "";
  const includeDate =
    opts.includeDate !== false &&
    Boolean(dateLabel) &&
    !/วันที่\s*:/.test(withPlaceholders);

  const subject = extractedSubject.trim();

  const plainParts: string[] = [];
  if (subject) {
    plainParts.push(
      thaiSubjectLine ? `เรื่อง: ${subject}` : `Subject: ${subject}`,
      ""
    );
  }
  if (includeDate) plainParts.push(dateLabel, "");
  if (greeting) plainParts.push(greeting, "");
  for (const p of paragraphs) {
    plainParts.push(boldInlinePlain(p).replace(/\*\*/g, ""), "");
  }
  if (signOff) {
    plainParts.push(signOff.endsWith(",") ? signOff : `${signOff}`, "");
  } else {
    plainParts.push("Best regards,", "");
  }
  plainParts.push(...sig);

  const bodyPlain = plainParts.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";

  const htmlParts: string[] = [];
  if (subject) {
    htmlParts.push(
      thaiSubjectLine
        ? `<p class="doc-subject"><strong>เรื่อง:</strong> ${escapeHtml(subject)}</p>`
        : `<p class="doc-subject"><strong>Subject:</strong> ${escapeHtml(subject)}</p>`
    );
  }
  if (includeDate) {
    htmlParts.push(`<p class="doc-date">${escapeHtml(dateLabel)}</p>`);
  }
  if (greeting) {
    htmlParts.push(`<p>${escapeHtml(greeting)}</p>`);
  }
  for (const p of paragraphs) {
    htmlParts.push(letterBlockToHtml(p));
  }
  htmlParts.push(
    `<p class="doc-signoff"><strong>${escapeHtml(signOff || "Best regards,")}</strong></p>`
  );
  htmlParts.push(
    `<p class="doc-signature">${sig.map((l) => escapeHtml(l)).join("<br>")}</p>`
  );

  return {
    subject,
    bodyPlain,
    bodyHtml: htmlParts.join("\n"),
  };
}

/** Convert already-formatted plain letter body into HTML paragraphs + bold. */
export function plainLetterBodyToHtml(bodyText: string): string {
  const text = normalizeWhitespace(bodyText);
  if (!text) return "";

  const blocks = splitLetterBodyIntoBlocks(text);
  if (blocks.length === 0) {
    return `<div class="doc-body-fallback" style="white-space:pre-wrap">${escapeHtml(text)}</div>`;
  }

  return blocks.map((block) => letterBlockToHtml(block)).join("\n");
}
