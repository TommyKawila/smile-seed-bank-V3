import { DEFAULT_EUR_THB } from "@/lib/bulk-seeds-labels";
import type {
  B2BCurrency,
  B2BQuoteDraft,
  B2BQuoteLineItem,
  B2BQuoteTotals,
} from "@/types/b2b-quote";

export function roundMoney(n: number, currency: B2BCurrency = "EUR"): number {
  const decimals = currency === "THB" ? 2 : 2;
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function lineTotal(quantity: number, unitPrice: number, currency: B2BCurrency = "EUR"): number {
  return roundMoney(Math.max(0, quantity) * Math.max(0, unitPrice), currency);
}

export function recalculateItem(
  item: B2BQuoteLineItem,
  currency: B2BCurrency = "EUR"
): B2BQuoteLineItem {
  return {
    ...item,
    lineTotal: lineTotal(item.quantity, item.unitPrice, currency),
  };
}

export function calculateB2BQuoteTotals(
  items: B2BQuoteLineItem[],
  discountAmount: number,
  shippingFee: number,
  currency: B2BCurrency = "EUR"
): B2BQuoteTotals {
  const subtotal = roundMoney(
    items.reduce((sum, it) => sum + lineTotal(it.quantity, it.unitPrice, currency), 0),
    currency
  );
  const discount = roundMoney(Math.max(0, discountAmount), currency);
  const shipping = roundMoney(Math.max(0, shippingFee), currency);
  const totalAmount = roundMoney(Math.max(0, subtotal - discount + shipping), currency);
  return {
    subtotal,
    discountAmount: discount,
    shippingFee: shipping,
    totalAmount,
  };
}

export function formatB2BMoney(amount: number, currency: B2BCurrency): string {
  if (currency === "THB") {
    return `฿${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `€${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatB2BUnitPrice(amount: number, currency: B2BCurrency): string {
  if (currency === "THB") {
    return `฿${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  }
  return `€${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

/** Convert draft money fields when toggling EUR ↔ THB (unit + discount + shipping). */
export function convertB2BDraftCurrency(
  draft: B2BQuoteDraft,
  nextCurrency: B2BCurrency,
  eurThb: number = DEFAULT_EUR_THB
): B2BQuoteDraft {
  if (draft.currency === nextCurrency) return draft;
  const fx = eurThb > 0 ? eurThb : DEFAULT_EUR_THB;
  const factor = draft.currency === "EUR" && nextCurrency === "THB" ? fx : 1 / fx;
  const convert = (n: number) => roundMoney(Math.max(0, n) * factor, nextCurrency);
  return {
    ...draft,
    currency: nextCurrency,
    discountAmount: convert(draft.discountAmount),
    shippingFee: convert(draft.shippingFee),
    items: draft.items.map((it) =>
      recalculateItem(
        {
          ...it,
          unitPrice: convert(it.unitPrice),
        },
        nextCurrency
      )
    ),
  };
}
