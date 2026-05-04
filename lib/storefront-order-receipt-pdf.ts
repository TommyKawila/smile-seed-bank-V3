import type { OrderSuccessView } from "@/lib/services/order-service";
import { computeOrderReceiptFinancials } from "@/lib/order-receipt-math";
import type { PdfSettings } from "@/lib/pdf-settings";
import type { OrderDisplayLocale } from "@/lib/order-receipt-line-format";
import { generateReceiptPDF, formatPaymentMethodForPdf } from "@/lib/receipt-pdf";

/** YYYY-MM-DD for PDF; falls back to Bangkok “today” if missing/invalid. */
export function normalizeReceiptOrderDate(raw: string | undefined): string {
  const s = (raw ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const ms = Date.parse(s);
  if (!Number.isNaN(ms)) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(ms));
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function buildOrderReceiptPdfDocument(
  order: OrderSuccessView,
  pdfSettings: PdfSettings,
  options?: { locale?: OrderDisplayLocale }
) {
  const discountAmount =
    Number(order.discount_amount ?? 0) +
    Number(order.promotion_discount_amount ?? 0) +
    Number(order.points_discount_amount ?? 0);
  const { receiptItems, discountForPdf } = computeOrderReceiptFinancials({
    totalAmount: order.total_amount,
    shippingFee: Number(order.shipping_fee ?? 0),
    discountAmount,
    items: order.items.map((i) => ({
      productName: i.product_name,
      unitLabel: i.unit_label ?? "",
      variantUnitLabel: i.variant_unit_label ?? null,
      breederName: i.breeder_name,
      floweringType: i.flowering_type,
      quantity: i.quantity,
      totalPrice: i.line_total,
    })),
  });
  const receiptLocale = options?.locale ?? "th";

  const orderDate = normalizeReceiptOrderDate(order.order_date);

  return await generateReceiptPDF({
    docType: "receipt",
    orderNumber: order.order_number,
    orderDate,
    customerName: order.customer_name?.trim() ?? "",
    customerEmail: null,
    customerPhone: order.customer_phone ?? null,
    customerAddress: order.shipping_address ?? null,
    customerNote: null,
    items: receiptItems,
    grandTotal: order.total_amount,
    logoDataUrl: pdfSettings.logoDataUrl,
    companyName: pdfSettings.companyName,
    companyAddress: pdfSettings.companyAddress,
    companyEmail: pdfSettings.companyEmail,
    companyPhone: pdfSettings.companyPhone,
    companyLineId: pdfSettings.companyLineId,
    bankName: pdfSettings.bankName,
    bankAccountName: pdfSettings.bankAccountName,
    bankAccountNo: pdfSettings.bankAccountNo,
    socialLinks: pdfSettings.socialLinks ?? [],
    legalSeedLicenseNumber: pdfSettings.legalSeedLicenseNumber ?? null,
    legalBusinessRegistrationNumber: pdfSettings.legalBusinessRegistrationNumber ?? null,
    orderFinancials: {
      shippingFee: Number(order.shipping_fee ?? 0),
      discountAmount: discountForPdf,
    },
    paymentDate: orderDate,
    paymentMethod: formatPaymentMethodForPdf(order.payment_method),
    receiptLocale,
  });
}
