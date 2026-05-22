export type ReceiptItem = {
  productName: string;
  breeder?: string | null;
  unitLabel?: string | null;
  floweringType?: string | null;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
};

export const RECEIPT_ELIGIBLE_STATUSES = [
  "PAID",
  "COMPLETED",
  "SHIPPED",
  "DELIVERED",
] as const;

export { isReceiptEligibleStatus } from "./order-paid";

/** Split order-level discount across lines by line total (for receipt transparency). */
export function allocateOrderDiscountToLines(lineTotals: number[], orderDiscount: number): number[] {
  const n = lineTotals.length;
  if (n === 0 || orderDiscount <= 0) return lineTotals.map(() => 0);
  const sum = lineTotals.reduce((a, b) => a + b, 0);
  if (sum <= 0) return lineTotals.map(() => 0);
  const shares: number[] = [];
  let allocated = 0;
  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      shares.push(Math.round((orderDiscount - allocated) * 100) / 100);
    } else {
      const v = Math.round(((orderDiscount * lineTotals[i]) / sum) * 100) / 100;
      shares.push(v);
      allocated += v;
    }
  }
  return shares;
}

export function formatPaymentMethodForPdf(m: string | null | undefined): string | null {
  if (!m) return null;
  const map: Record<string, string> = {
    CASH: "เงินสด / Cash",
    BANK_TRANSFER: "โอนธนาคาร / Bank Transfer",
    TRANSFER: "โอนเงิน / Bank Transfer",
    PROMPT_PAY: "พร้อมเพย์ / PromptPay",
    COD: "เก็บเงินปลายทาง / COD",
    CREDIT_CARD: "บัตรเครดิต / Credit Card",
  };
  return map[m] ?? m;
}
