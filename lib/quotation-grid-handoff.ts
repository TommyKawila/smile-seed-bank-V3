export const QUOTATION_GRID_HANDOFF_KEY = "ssb_quotation_grid_prefill_v1";

export type QuotationHandoffPack = {
  variantId: number;
  stock: number;
  price: number;
  unitLabel: string;
};

export type QuotationHandoffItem = {
  productId: number;
  masterSku: string;
  name: string;
  imageUrl?: string | null;
  packs: number[];
  byPack: Record<string, QuotationHandoffPack>;
  breederName?: string;
};

export type QuotationHandoffCustomer = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
};

/** Line from duplicate quotation (prices + qty clamped to live stock on save). */
export type QuotationDuplicateLine = {
  productId: number;
  variantId: number;
  productName: string;
  unitLabel: string;
  packSize: number;
  unitPrice: number;
  quantity: number;
  discount: number;
  lineTotal: number;
  breederName?: string | null;
  masterSku?: string;
  stock: number;
};

export type QuotationHandoffPayload =
  | { v: 1; source?: "grid"; items: QuotationHandoffItem[] }
  | { v: 2; source: "duplicate"; customer: QuotationHandoffCustomer; lines: QuotationDuplicateLine[] };

export function saveQuotationHandoff(payload: QuotationHandoffPayload): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(QUOTATION_GRID_HANDOFF_KEY, JSON.stringify(payload));
}

export function consumeQuotationHandoff(): QuotationHandoffPayload | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(QUOTATION_GRID_HANDOFF_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(QUOTATION_GRID_HANDOFF_KEY);
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (p?.v === 2 && p.source === "duplicate" && Array.isArray(p.lines)) {
      return p as QuotationHandoffPayload;
    }
    if (Array.isArray(p?.items)) {
      return { v: 1, source: "grid", items: p.items as QuotationHandoffItem[] };
    }
    return null;
  } catch {
    return null;
  }
}
