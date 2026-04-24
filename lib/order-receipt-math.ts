import { allocateOrderDiscountToLines, type ReceiptItem } from "@/lib/receipt-pdf";
import { effectiveOrderItemUnitLabel } from "@/lib/order-receipt-line-format";

export type OrderReceiptLineInput = {
  productName: string;
  unitLabel: string;
  variantUnitLabel?: string | null;
  breederName: string | null;
  floweringType?: string | null;
  quantity: number;
  totalPrice: number;
};

export type OrderReceiptDetailInput = {
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  items: OrderReceiptLineInput[];
};

export type ComputedOrderReceipt = {
  receiptItems: ReceiptItem[];
  itemsGrossSubtotal: number;
  discountForPdf: number;
  netPayableItems: number;
  shippingFee: number;
  grandTotal: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Same rules as admin receipt PDF: gross lines, inferred discount when API is 0, proportional net→gross allocation.
 */
export function computeOrderReceiptFinancials(detail: OrderReceiptDetailInput): ComputedOrderReceipt {
  const shipping = detail.shippingFee ?? 0;
  const netPayableItems = detail.totalAmount - shipping;
  const lineTotals = detail.items.map((i) => i.totalPrice);
  const sumLine = lineTotals.reduce((a, b) => a + b, 0);
  const apiDisc = detail.discountAmount ?? 0;
  const inferredDisc = Math.max(0, sumLine - netPayableItems);
  const effectiveDisc = apiDisc > 0.005 ? apiDisc : inferredDisc;
  const treatAsGrossLines = inferredDisc > 0.005 && sumLine > netPayableItems + 0.01;

  const receiptItems: ReceiptItem[] = treatAsGrossLines
    ? detail.items.map((i) => {
        const qty = Math.max(1, i.quantity);
        const grossLine = round2(i.totalPrice);
        const grossUnit = round2(grossLine / qty);
        const pack = effectiveOrderItemUnitLabel(i.unitLabel, i.variantUnitLabel ?? null) || "—";
        return {
          productName: i.productName,
          breeder: i.breederName,
          unitLabel: pack,
          floweringType: i.floweringType ?? null,
          quantity: i.quantity,
          price: grossUnit,
          discount: 0,
          subtotal: grossLine,
        };
      })
    : (() => {
        const discShares = allocateOrderDiscountToLines(lineTotals, effectiveDisc);
        return detail.items.map((i, idx) => {
          const share = discShares[idx] ?? 0;
          const grossLine = round2(i.totalPrice + share);
          const qty = Math.max(1, i.quantity);
          const grossUnit = round2(grossLine / qty);
          const pack = effectiveOrderItemUnitLabel(i.unitLabel, i.variantUnitLabel ?? null) || "—";
          return {
            productName: i.productName,
            breeder: i.breederName,
            unitLabel: pack,
            floweringType: i.floweringType ?? null,
            quantity: i.quantity,
            price: grossUnit,
            discount: share,
            subtotal: grossLine,
          };
        });
      })();

  const itemsGrossSubtotal = receiptItems.reduce((s, r) => s + r.subtotal, 0);
  const discountForPdf =
    apiDisc > 0.005 ? apiDisc : Math.max(0, itemsGrossSubtotal - netPayableItems);

  return {
    receiptItems,
    itemsGrossSubtotal,
    discountForPdf,
    netPayableItems,
    shippingFee: shipping,
    grandTotal: detail.totalAmount,
  };
}
