import { lineTotal, recalculateItem } from "@/lib/b2b-quote-calc";
import { defaultValidUntil, type B2BQuoteDraft } from "@/types/b2b-quote";

const REF_RE = /^SSB-BL-\d{4}-\d{3}$/i;
const ITEM_RE =
  /^(.+?) · (.+?) · ([\d,]+) · €([\d.]+)\/seed · ฿[\d,]+$/;

export type BulkLeadPasteResult =
  | { ok: true; draft: B2BQuoteDraft; warnings: string[] }
  | { ok: false; error: string };

function parseQty(raw: string): number {
  return Math.floor(Number(raw.replace(/,/g, "")));
}

function fieldValue(line: string, prefix: string): string | null {
  if (!line.toLowerCase().startsWith(prefix.toLowerCase())) return null;
  return line.slice(prefix.length).trim();
}

function parseLineItem(line: string): { strainName: string; qty: number; unitEur: number } | null {
  const m = line.trim().match(ITEM_RE);
  if (!m) return null;
  const strainName = m[2]!.trim();
  const qty = parseQty(m[3]!);
  const unitEur = Number(m[4]);
  if (!strainName || qty <= 0 || !Number.isFinite(unitEur) || unitEur <= 0) return null;
  return { strainName, qty, unitEur };
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
  const itemLines: string[] = [];
  let inItems = false;

  for (const line of rawLines) {
    if (REF_RE.test(line)) {
      refNumber = line.toUpperCase();
      continue;
    }
    if (line === "---") {
      inItems = !inItems;
      continue;
    }
    if (inItems) {
      itemLines.push(line);
      continue;
    }
    const contact = fieldValue(line, "Contact:");
    if (contact) {
      contactName = contact;
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
  if (!contactName) warnings.push("ไม่พบชื่อลูกค้า (Contact:)");

  const currency = "EUR" as const;
  const items = itemLines
    .map((line) => {
      const parsed = parseLineItem(line);
      if (!parsed) return null;
      return recalculateItem(
        {
          id: `paste-${Math.random().toString(36).slice(2, 10)}`,
          strainName: parsed.strainName,
          quantity: parsed.qty,
          unitPrice: parsed.unitEur,
          lineTotal: lineTotal(parsed.qty, parsed.unitEur, currency),
        },
        currency
      );
    })
    .filter((it): it is NonNullable<typeof it> => Boolean(it));

  if (items.length === 0) {
    return {
      ok: false,
      error: "ไม่พบรายการสายพันธุ์ — ต้องมีบรรทัดระหว่าง ---",
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
