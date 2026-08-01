export type B2BCurrency = "EUR" | "THB";
export type B2BQuoteStatus = "DRAFT" | "SENT";

export type B2BQuoteLineItem = {
  id: string;
  strainName: string;
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

export const B2B_MOQ_SEEDS = 500;
export const B2B_MOQ_WARNING = "Standard B2B MOQ is 500 seeds/strain";

export const B2B_PRESET_STRAINS = [
  "White Widow",
  "Northern Lights",
  "Pineapple Express Auto",
  "Do-Si-Dos Auto",
  "Bubba Kush",
] as const;

export const B2B_DEFAULT_UNIT_PRICE_EUR = 1.35;

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
    quantity: B2B_MOQ_SEEDS,
    unitPrice: B2B_DEFAULT_UNIT_PRICE_EUR,
    lineTotal: B2B_MOQ_SEEDS * B2B_DEFAULT_UNIT_PRICE_EUR,
  };
}

export function createMalikhaOptionA(): B2BQuoteDraft {
  const invoiceDate = new Date().toISOString().slice(0, 10);
  const unit = B2B_DEFAULT_UNIT_PRICE_EUR;
  const qty = B2B_MOQ_SEEDS;
  const strains = ["White Widow", "Northern Lights"];
  return {
    clientName: "Malikha",
    clientEmail: "",
    shippingAddress: "Bangkok, Thailand",
    invoiceDate,
    validUntil: defaultValidUntil(invoiceDate),
    currency: "EUR",
    discountAmount: 0,
    shippingFee: 0,
    items: strains.map((strainName, i) => ({
      id: `opt-a-${i}`,
      strainName,
      quantity: qty,
      unitPrice: unit,
      lineTotal: qty * unit,
    })),
  };
}

export function createMalikhaOptionB(): B2BQuoteDraft {
  const base = createMalikhaOptionA();
  const unit = B2B_DEFAULT_UNIT_PRICE_EUR;
  const qty = B2B_MOQ_SEEDS;
  return {
    ...base,
    items: B2B_PRESET_STRAINS.map((strainName, i) => ({
      id: `opt-b-${i}`,
      strainName,
      quantity: qty,
      unitPrice: unit,
      lineTotal: qty * unit,
    })),
  };
}
