import { lineTotal, recalculateItem } from "@/lib/b2b-quote-calc";
import { normalizeBreederLabel } from "@/lib/b2b-quote-line";
import { B2B_BREEDER_SG, B2B_BREEDER_SGF, defaultValidUntil, type B2BQuoteDraft } from "@/types/b2b-quote";

const REF_RE = /^SSB-BL-\d{4}-\d{3}$/i;
const LEAD_ITEM_RE =
  /^(.+?) · (.+?) · ([\d,]+) · €([\d.]+)\/seed · ฿[\d,]+$/;
const INVOICE_ONE_LINE_RE =
  /^(.+?) · (.+?)\s+(\d[\d,]*)\s+€([\d.]+)(?:\s+€[\d.,]+)?$/;
const INVOICE_QTY_RE = /^(\d[\d,]*)\s+€([\d.]+)(?:\s+€[\d.,]+)?$/;

export type BulkLeadPasteResult =
  | { ok: true; draft: B2BQuoteDraft; warnings: string[] }
  | { ok: false; error: string };

type ParsedItem = {
  breederName: string;
  strainName: string;
  qty: number;
  unitEur: number;
  fromLead: boolean;
};

function parseQty(raw: string): number {
  return Math.floor(Number(raw.replace(/,/g, "")));
}

function isItemFence(line: string): boolean {
  return /^-{3,}$/.test(line) || /^_{3,}$/.test(line);
}

function fieldValue(line: string, prefix: string): string | null {
  if (!line.toLowerCase().startsWith(prefix.toLowerCase())) return null;
  return line.slice(prefix.length).trim();
}

function isKnownBreeder(raw: string): boolean {
  const n = normalizeBreederLabel(raw);
  return n === B2B_BREEDER_SGF || n === B2B_BREEDER_SG;
}

function splitStrainBreeder(left: string, right: string): { strainName: string; breederName: string } | null {
  const a = left.trim();
  const b = right.trim();
  if (isKnownBreeder(a) && !isKnownBreeder(b)) {
    return { strainName: b, breederName: normalizeBreederLabel(a) };
  }
  if (isKnownBreeder(b)) {
    return { strainName: a, breederName: normalizeBreederLabel(b) };
  }
  return null;
}

function parseLeadItem(line: string): ParsedItem | null {
  const m = line.trim().match(LEAD_ITEM_RE);
  if (!m) return null;
  const breederName = normalizeBreederLabel(m[1]!.trim());
  const strainName = m[2]!.trim();
  const qty = parseQty(m[3]!);
  const unitEur = Number(m[4]);
  if (!strainName || qty <= 0 || !Number.isFinite(unitEur) || unitEur <= 0) return null;
  return { breederName, strainName, qty, unitEur, fromLead: true };
}

function parseInvoiceOneLine(line: string): ParsedItem | null {
  const m = line.trim().match(INVOICE_ONE_LINE_RE);
  if (!m) return null;
  const pair = splitStrainBreeder(m[1]!, m[2]!);
  if (!pair) return null;
  const qty = parseQty(m[3]!);
  const unitEur = Number(m[4]);
  if (qty <= 0 || !Number.isFinite(unitEur) || unitEur <= 0) return null;
  return { ...pair, qty, unitEur, fromLead: false };
}

function parseInvoiceQtyLine(line: string): { qty: number; unitEur: number } | null {
  const m = line.trim().match(INVOICE_QTY_RE);
  if (!m) return null;
  const qty = parseQty(m[1]!);
  const unitEur = Number(m[2]);
  if (qty <= 0 || !Number.isFinite(unitEur) || unitEur <= 0) return null;
  return { qty, unitEur };
}

function parseInvoiceLabelLine(line: string): { strainName: string; breederName: string } | null {
  const trimmed = line.trim();
  if (trimmed.includes("€") || INVOICE_QTY_RE.test(trimmed)) return null;
  if (/^(total|subtotal|discount|from|bill to|invoice|amount|deposit|balance)/i.test(trimmed)) {
    return null;
  }
  const idx = trimmed.lastIndexOf(" · ");
  if (idx <= 0) return null;
  return splitStrainBreeder(trimmed.slice(0, idx), trimmed.slice(idx + 3));
}

function collectItemLines(rawLines: string[]): string[] {
  const fenced: string[] = [];
  let inItems = false;
  let sawFence = false;
  for (const line of rawLines) {
    if (isItemFence(line)) {
      inItems = !inItems;
      sawFence = true;
      continue;
    }
    if (inItems) fenced.push(line);
  }
  if (sawFence && fenced.length > 0) return fenced;
  return rawLines;
}

function parseItemLines(itemLines: string[]): ParsedItem[] {
  const items: ParsedItem[] = [];
  let pendingLabel: { strainName: string; breederName: string } | null = null;

  for (const line of itemLines) {
    const lead = parseLeadItem(line);
    if (lead) {
      pendingLabel = null;
      items.push(lead);
      continue;
    }
    const one = parseInvoiceOneLine(line);
    if (one) {
      pendingLabel = null;
      items.push(one);
      continue;
    }
    const qtyLine = parseInvoiceQtyLine(line);
    if (qtyLine && pendingLabel) {
      items.push({ ...pendingLabel, ...qtyLine, fromLead: false });
      pendingLabel = null;
      continue;
    }
    const label = parseInvoiceLabelLine(line);
    if (label) {
      pendingLabel = label;
    }
  }
  return items;
}

export function parseBulkLeadPaste(text: string): BulkLeadPasteResult {
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) {
    return { ok: false, error: "วางข้อความว่างเปล่า" };
  }

  let refNumber = "";
  let contactName = "";
  let clientEmail = "";
  let lineId = "";
  let phone = "";
  let offer = "";
  let note = "";
  let expectContactName = false;

  for (const line of rawLines) {
    if (REF_RE.test(line)) {
      refNumber = line.toUpperCase();
      continue;
    }
    if (isItemFence(line)) {
      expectContactName = false;
      continue;
    }
    const billTo = fieldValue(line, "BILL TO:");
    const client = fieldValue(line, "Client:");
    const contact = fieldValue(line, "Contact:");
    if (billTo !== null || client !== null || contact !== null) {
      const name = (billTo || client || contact || "").trim();
      if (name) {
        contactName = name;
        expectContactName = false;
      } else {
        expectContactName = true;
      }
      continue;
    }
    if (expectContactName && !line.includes(":") && !line.includes("€")) {
      contactName = line;
      expectContactName = false;
      continue;
    }
    const email = fieldValue(line, "Email:");
    if (email) {
      clientEmail = email;
      continue;
    }
    const lineVal = fieldValue(line, "LINE:");
    if (lineVal) {
      lineId = lineVal;
      continue;
    }
    const phoneVal = fieldValue(line, "Phone:");
    if (phoneVal) {
      phone = phoneVal;
      continue;
    }
    const offerVal = fieldValue(line, "Offer:");
    if (offerVal) {
      offer = offerVal;
      continue;
    }
    const noteVal = fieldValue(line, "Note:");
    if (noteVal) {
      note = noteVal;
      continue;
    }
  }

  const warnings: string[] = [];
  if (!refNumber) warnings.push("ไม่พบเลขอ้างอิง SSB-BL-…");
  if (!contactName) warnings.push("ไม่พบชื่อลูกค้า (Contact: / BILL TO:)");

  const currency = "EUR" as const;
  const parsed = parseItemLines(collectItemLines(rawLines));
  const items = parsed.map((p) => {
    const base = {
      id: `paste-${Math.random().toString(36).slice(2, 10)}`,
      strainName: p.strainName,
      breederName: p.breederName,
      quantity: p.qty,
      unitPrice: p.unitEur,
      lineTotal: lineTotal(p.qty, p.unitEur, currency),
    };
    return recalculateItem(base, currency);
  });

  if (items.length === 0) {
    return {
      ok: false,
      error: "ไม่พบรายการสายพันธุ์ — ใช้ --- หรือ ___ คั่น หรือบรรทัด Strain · Breeder + qty €unit",
    };
  }

  const invoiceDate = new Date().toISOString().slice(0, 10);
  const noteLines = [
    refNumber ? `Bulk lead: ${refNumber}` : "",
    offer ? `Offer: ${offer}` : "",
    lineId ? `LINE: ${lineId}` : "",
    phone ? `Tel: ${phone}` : "",
    note,
  ].filter(Boolean);

  const draft: B2BQuoteDraft = {
    clientName: contactName,
    clientEmail,
    shippingAddress: "",
    invoiceDate,
    validUntil: defaultValidUntil(invoiceDate),
    currency,
    discountAmount: 0,
    shippingFee: 0,
    paymentNotes: noteLines.join("\n"),
    items,
  };

  return { ok: true, draft, warnings };
}
