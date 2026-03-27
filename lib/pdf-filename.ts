/** Safe segment for PDF filenames (hyphens allowed for doc numbers). */
export function sanitizePdfFilenamePart(raw: string, fallback: string): string {
  const t = raw
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9._-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return t.slice(0, 64) || fallback;
}

/** QT_SSB-QT-20260321-001_Tommy-Kawila.pdf */
export function quotationPdfFileName(quotationNumber: string, customerName: string | null | undefined): string {
  const doc = sanitizePdfFilenamePart(quotationNumber, "QT");
  const cust = sanitizePdfFilenamePart(customerName ?? "", "Customer");
  return `QT_${doc}_${cust}.pdf`;
}

/** RE_SSB-OR-20260321-001_Ref-SSB-QT-20260321-001_Tommy-Kawila.pdf */
export function receiptPdfFileName(
  orderNumber: string,
  customerName: string | null | undefined,
  sourceQuotationNumber?: string | null
): string {
  const ord = sanitizePdfFilenamePart(orderNumber, "Order");
  const cust = sanitizePdfFilenamePart(customerName ?? "", "Customer");
  const refRaw = sourceQuotationNumber?.trim();
  const refSeg = refRaw
    ? `Ref-${sanitizePdfFilenamePart(refRaw, "Ref")}`
    : "NoRef";
  return `RE_${ord}_${refSeg}_${cust}.pdf`;
}

/** SSB-QT-20260321-001 → SSB-OR-20260321-001; returns null if no -QT- segment. */
export function orderNumberFromQuotationNumber(quotationNumber: string): string | null {
  const t = quotationNumber.trim();
  if (!t) return null;
  if (!/-QT-/i.test(t)) return null;
  return t.replace(/-QT-/gi, "-OR-");
}
