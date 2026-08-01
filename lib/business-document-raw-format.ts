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

function formatDateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function normalizeWhitespace(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
}

/** Collapse blob into single-spaced text keeping intentional newlines as spaces if sparse. */
function flattenBlob(raw: string): string {
  const n = normalizeWhitespace(raw);
  const newlineCount = (n.match(/\n/g) ?? []).length;
  if (newlineCount >= 4) {
    return n.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  }
  return n.replace(/\s+/g, " ").trim();
}

function extractSubject(text: string): { subject: string; rest: string } {
  const m = text.match(/^Subject:\s*(.+?)(?=\s*Dear\s|\s*$)/i);
  if (m) {
    const subject = m[1]!.trim().replace(/\s+/g, " ");
    const rest = text.slice(m[0].length).trim();
    return { subject, rest };
  }
  return { subject: "", rest: text };
}

function extractGreeting(text: string): { greeting: string; rest: string } {
  const m = text.match(/^(Dear\s+[^,]+,)\s*/i);
  if (m) {
    return { greeting: m[1]!.trim(), rest: text.slice(m[0].length).trim() };
  }
  return { greeting: "", rest: text };
}

function extractSignOff(text: string): {
  body: string;
  signOff: string;
  signatureLines: string[];
} {
  const m = text.match(/\b(Best regards|Sincerely|Kind regards|Warm regards),?\s*/i);
  if (!m || m.index == null) {
    return { body: text, signOff: "", signatureLines: [] };
  }
  const body = text.slice(0, m.index).trim();
  const after = text.slice(m.index + m[0].length).trim();
  const signOff = `${m[1]},`;
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

function splitParagraphs(body: string): string[] {
  let working = body.trim();
  if (!working) return [];

  // Prefer existing double newlines
  if (/\n\s*\n/.test(working)) {
    return working
      .split(/\n\s*\n+/)
      .map((p) => p.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  // Insert breaks before known connectors
  working = working.replace(PARA_BREAK_MARKERS, "\n\n$1");

  // Break after sentence end before capital (avoid abbreviations carefully)
  working = working.replace(/([.!?])\s+(?=[A-Z])/g, "$1\n\n");

  return working
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
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

export type FormatRawLetterOptions = {
  documentDate: string;
  senderName: string;
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
  const flat = flattenBlob(raw);
  const { subject: extractedSubject, rest: afterSubject } = extractSubject(flat);
  const { greeting, rest: afterGreeting } = extractGreeting(afterSubject);
  const { body, signOff, signatureLines } = extractSignOff(afterGreeting);
  const paragraphs = splitParagraphs(body);
  const sig = resolveSignature(signatureLines, opts.senderName);
  const dateLabel = formatDateLabel(opts.documentDate);
  const includeDate = opts.includeDate !== false;

  const subject =
    extractedSubject ||
    "Business Correspondence — Smile Seed Bank";

  const plainParts: string[] = [];
  if (subject) plainParts.push(`Subject: ${subject}`, "");
  if (includeDate) plainParts.push(dateLabel, "");
  if (greeting) plainParts.push(greeting, "");
  for (const p of paragraphs) {
    plainParts.push(boldInlinePlain(p).replace(/\*\*/g, ""), "");
  }
  if (signOff) {
    plainParts.push(signOff, "");
  } else {
    plainParts.push("Best regards,", "");
  }
  plainParts.push(...sig);

  const bodyPlain = plainParts.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";

  const htmlParts: string[] = [];
  htmlParts.push(
    `<p class="doc-subject"><strong>Subject:</strong> ${escapeHtml(subject)}</p>`
  );
  if (includeDate) {
    htmlParts.push(`<p class="doc-date">${escapeHtml(dateLabel)}</p>`);
  }
  if (greeting) {
    htmlParts.push(`<p>${escapeHtml(greeting)}</p>`);
  }
  for (const p of paragraphs) {
    htmlParts.push(`<p>${applyBoldHtml(escapeHtml(p))}</p>`);
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

  const blocks = text.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length === 0) {
    return `<div class="doc-body" style="white-space:pre-wrap">${escapeHtml(text)}</div>`;
  }

  return blocks
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim());
      const joined = lines.join("\n");
      if (/^Subject:/i.test(joined)) {
        const rest = joined.replace(/^Subject:\s*/i, "");
        return `<p class="doc-subject"><strong>Subject:</strong> ${escapeHtml(rest)}</p>`;
      }
      if (/^(Best regards|Sincerely|Kind regards|Warm regards),?\s*$/i.test(joined)) {
        return `<p class="doc-signoff"><strong>${escapeHtml(joined.replace(/,?$/, ","))}</strong></p>`;
      }
      if (
        lines.length >= 2 &&
        lines.some((l) => /Founder,\s*Smile Seed Bank/i.test(l))
      ) {
        return `<p class="doc-signature">${lines.map((l) => escapeHtml(l)).join("<br>")}</p>`;
      }
      // Date-only short line
      if (
        lines.length === 1 &&
        /^(?:\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4})$/.test(joined)
      ) {
        return `<p class="doc-date">${escapeHtml(joined)}</p>`;
      }
      const withBreaks = lines.map((l) => escapeHtml(l)).join("<br>");
      return `<p>${applyBoldHtml(withBreaks)}</p>`;
    })
    .join("\n");
}
