import { getSiteOrigin } from "@/lib/get-url";
import { carrierLabelFromCode } from "@/lib/shipping-carriers";
import { getTrackingUrl } from "@/lib/shipping-tracking-url";
import {
  buildPromptPayIoQrUrl,
  generateOrderSummary,
  type OrderSummaryLang,
  type OrderSummaryLine,
} from "@/lib/utils/format-order";

export type { OrderSummaryLang };

/** Bilingual preset strings use `\n\n` between TH and EN blocks. */
export function pickBilingualBlock(text: string, lang: OrderSummaryLang): string {
  const idx = text.indexOf("\n\n");
  if (idx === -1) return text;
  const th = text.slice(0, idx).trim();
  const en = text.slice(idx + 2).trim();
  return lang === "en" ? en : th;
}

function formatTotalBaht(amount: number): string {
  return Number(amount).toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

export function adminOrderPaymentPageUrl(orderNumber: string): string {
  return `${getSiteOrigin()}/payment/${encodeURIComponent(orderNumber)}`;
}

/** Same copy as approvePayment LINE text — admin can send manually. */
export function buildAdminPaymentReceivedQuickMessage(
  totalAmount: number,
  lang?: OrderSummaryLang
): string {
  const totalStr = formatTotalBaht(totalAmount);
  const th =
    `ได้รับยอดโอนจำนวน ${totalStr} บาท เรียบร้อยแล้วครับ พรุ่งนี้เราจะจัดส่งของให้ และจะแจ้งเลขพัสดุ (tracking) ให้ทราบอัตโนมัติ ขอบคุณครับ 🙏`;
  const en = `Payment of ${totalStr} THB received. We'll ship tomorrow and send your tracking number here. Thank you! 🙏`;
  if (lang === "th") return th;
  if (lang === "en") return en;
  return `${th}\n\n${en}`;
}

export type AdminPaymentLinkOrderInput = {
  orderNumber: string;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  items: OrderSummaryLine[];
  customerName?: string | null;
  customerPhone?: string | null;
  paymentMethodLabel?: string | null;
  lang?: OrderSummaryLang;
  promptPayQrUrl?: string | null;
  bankLines?: string[];
};

/** Full order summary + payment page + PromptPay QR for LINE / manual send. */
export function buildAdminPaymentLinkQuickMessage(input: AdminPaymentLinkOrderInput): string {
  const lineSubtotal = input.items.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
  return generateOrderSummary({
    lang: input.lang ?? "th",
    orderNumber: input.orderNumber,
    items: input.items,
    subtotal: lineSubtotal,
    shippingFee: input.shippingFee,
    discountAmount: input.discountAmount,
    totalAmount: input.totalAmount,
    paymentMethodLabel: input.paymentMethodLabel ?? null,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    paymentPageUrl: adminOrderPaymentPageUrl(input.orderNumber),
    bankLines: input.bankLines,
    promptPayQrUrl: input.promptPayQrUrl,
  });
}

export async function fetchAdminPaymentLinkExtras(totalAmount: number): Promise<{
  promptPayQrUrl: string | null;
  bankLines: string[] | undefined;
}> {
  let promptPayQrUrl: string | null = null;
  let bankLines: string[] | undefined;
  try {
    const r = await fetch("/api/storefront/payment-settings");
    if (!r.ok) return { promptPayQrUrl, bankLines };
    const pay = (await r.json()) as {
      bank?: { name: string; accountNo: string; accountName: string } | null;
      promptPay?: { identifier: string } | null;
    };
    if (pay.bank) {
      bankLines = [String(pay.bank.name), `${pay.bank.accountName} · ${pay.bank.accountNo}`];
    }
    const envPp =
      typeof process !== "undefined" ? process.env.NEXT_PUBLIC_PROMPTPAY_ID?.trim() ?? "" : "";
    const ppId = pay.promptPay?.identifier?.trim() || envPp || null;
    if (ppId && totalAmount >= 0) {
      promptPayQrUrl = buildPromptPayIoQrUrl(ppId, totalAmount);
    }
  } catch {
    /* optional extras */
  }
  return { promptPayQrUrl, bankLines };
}

/** Manual LINE resend when auto ship notify was missed (no LINE at ship time). */
export function buildAdminTrackingQuickMessage(input: {
  orderNumber: string;
  trackingNumber: string;
  shippingProvider: string;
  lang?: OrderSummaryLang;
}): string {
  const orderNum = input.orderNumber.trim();
  const tn = input.trackingNumber.trim();
  const carrier = carrierLabelFromCode(input.shippingProvider);
  const trackUrl = getTrackingUrl(input.shippingProvider, tn);
  const lang = input.lang;

  const th = trackUrl
    ? `ออเดอร์ #${orderNum} จัดส่งแล้วครับ 🌿\nขนส่ง: ${carrier}\nเลขพัสดุ: ${tn}\n\nติดตามพัสดุได้ที่ลิงก์ด้านล่างครับ`
    : `ออเดอร์ #${orderNum} จัดส่งแล้วครับ 🌿\nขนส่ง: ${carrier}\nเลขพัสดุ: ${tn}`;

  const en = trackUrl
    ? `Order #${orderNum} has been shipped.\nCarrier: ${carrier}\nTracking: ${tn}\n\nTrack your parcel:`
    : `Order #${orderNum} has been shipped.\nCarrier: ${carrier}\nTracking: ${tn}`;

  if (lang === "th") return trackUrl ? `${th}\n\n${trackUrl}` : th;
  if (lang === "en") return trackUrl ? `${en}\n\n${trackUrl}` : en;
  return trackUrl ? `${th}\n\n${en}\n\n${trackUrl}` : `${th}\n\n${en}`;
}
