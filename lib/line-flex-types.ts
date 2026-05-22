import type { OrderReceiptDetailInput } from "@/lib/order-receipt-math";

export type OrderFlexMessageInput = OrderReceiptDetailInput & {
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  /** Signed storefront URL to download PDF (from admin line-flex route). */
  receiptDownloadUri?: string | null;
};
