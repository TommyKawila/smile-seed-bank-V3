export type B2BCurrency = "EUR" | "THB" | "USD";
export type B2BQuoteStatus = "DRAFT" | "SENT";

export const B2B_CURRENCIES = ["EUR", "THB", "USD"] as const;

export function parseB2BCurrency(raw: string | null | undefined): B2BCurrency {
  if (raw === "THB" || raw === "USD" || raw === "EUR") return raw;
  return "EUR";
}

export type B2BQuoteLineItem = {
  id: string;
  strainName: string;
  /** Partner / brand — kept separate from strain name (e.g. SGF Seeds, Seeds Genetics). */
  breederName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type B2BQuoteDraft = {
  clientName: string;
  clientEmail: string;
  shippingAddress: string;
  invoiceDate: string;
  validUntil: string;
  currency: B2BCurrency;
  items: B2BQuoteLineItem[];
  discountAmount: number;
  shippingFee: number;
  paymentNotes?: string | null;
};

export type B2BQuoteTotals = {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
};

export type B2BQuoteRecord = B2BQuoteDraft &
  B2BQuoteTotals & {
    id: string;
    quoteNumber: string;
    status: B2BQuoteStatus;
    sentAt: string | null;
    createdAt: string;
    updatedAt: string;
  };

export type B2BQuoteDispatchInput = B2BQuoteDraft & {
  quoteId?: string | null;
  quoteNumber?: string | null;
};

export const B2B_DEFAULT_QTY = 50;
export const B2B_DEFAULT_UNIT_PRICE_EUR = 1.35;

/** Canonical breeder labels on bulk / B2B quotes. */
export const B2B_BREEDER_SGF = "SGF Seeds";
export const B2B_BREEDER_SG = "Seeds Genetics";
export const B2B_KNOWN_BREEDERS = [B2B_BREEDER_SGF, B2B_BREEDER_SG, "Green Future"] as const;

export function defaultValidUntil(invoiceDateIso: string, days = 30): string {
  const d = new Date(`${invoiceDateIso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return invoiceDateIso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function emptyB2BLineItem(): B2BQuoteLineItem {
  return {
    id: `tmp-${Math.random().toString(36).slice(2, 10)}`,
    strainName: "",
    breederName: "",
    quantity: B2B_DEFAULT_QTY,
    unitPrice: B2B_DEFAULT_UNIT_PRICE_EUR,
    lineTotal: B2B_DEFAULT_QTY * B2B_DEFAULT_UNIT_PRICE_EUR,
  };
}

