import { lineTotal } from "@/lib/b2b-quote-calc";
import { applyBulkBookPrice } from "@/lib/b2b-quote-bulk-price";
import { normalizeBreederLabel } from "@/lib/b2b-quote-line";
import { defaultValidUntil, type B2BQuoteDraft } from "@/types/b2b-quote";
import type { BulkShareLeadRecord } from "@/types/bulk-share-lead";

export const BULK_LEAD_B2B_PREFILL_KEY = "ssb-bulk-lead-b2b-prefill";

export function stashBulkShareLeadForB2B(lead: BulkShareLeadRecord): void {
  sessionStorage.setItem(BULK_LEAD_B2B_PREFILL_KEY, JSON.stringify(lead));
}

export function consumeBulkShareLeadForB2B(): BulkShareLeadRecord | null {
  const raw = sessionStorage.getItem(BULK_LEAD_B2B_PREFILL_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(BULK_LEAD_B2B_PREFILL_KEY);
  try {
    return JSON.parse(raw) as BulkShareLeadRecord;
  } catch {
    return null;
  }
}

export function bulkShareLeadToB2BDraft(lead: BulkShareLeadRecord): B2BQuoteDraft {
  const invoiceDate = new Date().toISOString().slice(0, 10);
  const currency = "EUR" as const;
  const noteLines = [
    `Bulk lead: ${lead.refNumber}`,
    `Offer: ${lead.shareTitle}`,
    lead.lineId ? `LINE: ${lead.lineId}` : "",
    lead.phone ? `Tel: ${lead.phone}` : "",
    lead.note ?? "",
  ].filter(Boolean);

  const items = lead.items.map((it) =>
    applyBulkBookPrice(
      {
        id: `bl-${it.id}`,
        strainName: it.strainName,
        breederName: normalizeBreederLabel(it.supplierLabel || it.supplierSlug),
        quantity: it.qty,
        unitPrice: it.unitEur,
        lineTotal: lineTotal(it.qty, it.unitEur, currency),
      },
      currency
    )
  );

  return {
    clientName: lead.contactName,
    clientEmail: lead.email,
    shippingAddress: "",
    invoiceDate,
    validUntil: defaultValidUntil(invoiceDate),
    currency,
    discountAmount: 0,
    shippingFee: 0,
    paymentNotes: noteLines.join("\n"),
    items: items.length ? items : [],
  };
}
