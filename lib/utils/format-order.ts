import { formatPrice } from "@/lib/utils";

export type OrderSummaryLang = "th" | "en";

export type OrderSummaryLine = {
  name: string;
  unitLabel?: string | null;
  quantity: number;
  lineTotal?: number;
  /** When set, line shows as `Breeder - Product (unit) × qty` */
  breederName?: string | null;
};

export type GenerateOrderSummaryInput = {
  lang?: OrderSummaryLang;
  orderNumber: string;
  items: OrderSummaryLine[];
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethodLabel?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  claimLink?: string | null;
  receiptPageUrl?: string | null;
  bankLines?: string[];
  promptPayQrUrl?: string | null;
};

const RULE = "━━━━━━━━━━━━━━━━━━━━";

/** Single closing block — avoid repeating brand lines in header + footer. */
const ORDER_SUMMARY_FOOTER_TH = `ขอบคุณที่ร่วมปลูกไปกับเราครับ 🙏✨

Smile Seed Bank — Premium Cannabis Seeds
แหล่งรวมเมล็ดพันธุ์กัญชาคุณภาพพรีเมียม จากแบรนด์ชั้นนำทั่วโลก`;

const ORDER_SUMMARY_FOOTER_EN = `Thanks for growing with us! 🙏✨

Smile Seed Bank — Premium Cannabis Seeds
Premium cannabis seed bank. Curated from the world's best breeders, delivered with care every step of the way.`;

/** `https://promptpay.io/{id}/{amount}.png` (amount in THB). */
export function buildPromptPayIoQrUrl(promptPayId: string, amountBaht: number): string {
  const id = encodeURIComponent(String(promptPayId).replace(/\s/g, ""));
  const amt = Math.round(Math.max(0, amountBaht) * 100) / 100;
  return `https://promptpay.io/${id}/${amt}.png`;
}

/** Maps `/order/claim/{token}` → `/order/receipt/{token}` (same origin). */
export function claimLinkToDigitalReceiptPageUrl(claimLink: string): string | null {
  try {
    const u = new URL(claimLink);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("claim");
    const tok = idx >= 0 ? parts[idx + 1] : null;
    if (!tok) return null;
    return `${u.origin}/order/receipt/${tok}`;
  } catch {
    return null;
  }
}

function L(lang: OrderSummaryLang, th: string, en: string): string {
  return lang === "en" ? en : th;
}

export function generateOrderSummary(input: GenerateOrderSummaryInput): string {
  const lang: OrderSummaryLang = input.lang ?? "th";
  const lines: string[] = [];

  lines.push(L(lang, "🌱 **สรุปรายการสั่งซื้อ**", "🌱 **Order summary**"));
  lines.push(RULE);
  lines.push("");
  lines.push(`${L(lang, "📦 **เลขออเดอร์:**", "📦 **Order #:**")} ${input.orderNumber}`);
  lines.push("");
  lines.push(L(lang, "🛒 **รายการสินค้า:**", "🛒 **Line items:**"));
  for (const row of input.items) {
    const breeder = row.breederName?.trim();
    const namePart = breeder ? `${breeder} - ${row.name}` : row.name;
    const unit = row.unitLabel ? ` (${row.unitLabel})` : "";
    const pricePart =
      row.lineTotal != null && Number.isFinite(row.lineTotal)
        ? ` — ${formatPrice(row.lineTotal)}`
        : "";
    lines.push(`  • ${namePart}${unit} × ${row.quantity}${pricePart}`);
  }
  lines.push("");
  lines.push(RULE);
  if (input.subtotal != null) {
    lines.push(`${L(lang, "📊 **ยอดรวมสินค้า:**", "📊 **Subtotal:**")} ${formatPrice(input.subtotal)}`);
  }
  if (input.shippingFee != null && input.shippingFee > 0) {
    lines.push(`${L(lang, "🚚 **ค่าจัดส่ง:**", "🚚 **Shipping:**")} ${formatPrice(input.shippingFee)}`);
  }
  if (input.discountAmount != null && input.discountAmount > 0) {
    lines.push(`${L(lang, "🏷️ **ส่วนลด:**", "🏷️ **Discount:**")} -${formatPrice(input.discountAmount)}`);
  }
  const shipNote =
    input.shippingFee != null && Number(input.shippingFee) === 0
      ? L(lang, " (ส่งฟรี)", " (free shipping)")
      : "";
  lines.push(
    `${L(lang, "💰 **ยอดชำระทั้งสิ้น:**", "💰 **Total:**")} ${formatPrice(input.totalAmount)}${shipNote}`,
  );
  lines.push(RULE);
  lines.push("");
  const cust = [input.customerName?.trim(), input.customerPhone?.trim()].filter(Boolean).join(" · ");
  if (cust) {
    lines.push(`${L(lang, "👤 **ลูกค้า:**", "👤 **Customer:**")} ${cust}`);
  }
  if (input.paymentMethodLabel) {
    lines.push(
      `${L(lang, "💳 **ช่องทางชำระเงิน:**", "💳 **Payment:**")} ${input.paymentMethodLabel}`,
    );
  }
  if (input.bankLines && input.bankLines.length > 0) {
    lines.push("");
    lines.push(L(lang, "🏦 **ช่องทางโอนเงิน:**", "🏦 **Bank transfer:**"));
    for (const b of input.bankLines) lines.push(`  ${b}`);
  }
  if (input.receiptPageUrl) {
    lines.push("");
    lines.push(
      L(
        lang,
        "📱 **สแกน QR เพื่อโอนเงิน คลิ๊กที่ link นี้:**",
        "📱 **Digital receipt (scan QR & pay):**",
      ),
    );
    lines.push(`  ${input.receiptPageUrl}`);
  } else if (input.promptPayQrUrl) {
    lines.push("");
    lines.push(
      L(
        lang,
        `📲 **PromptPay QR (${formatPrice(input.totalAmount)}):**`,
        `📲 **PromptPay QR (${formatPrice(input.totalAmount)}):**`,
      ),
    );
    lines.push(`  ${input.promptPayQrUrl}`);
  }
  if (input.claimLink) {
    lines.push("");
    lines.push(
      L(
        lang,
        "✉️ **ยืนยันที่อยู่และแนบสลิป:**",
        "✉️ **Confirm address & slip:**",
      ),
    );
    lines.push(`  ${input.claimLink}`);
  }
  lines.push("");
  lines.push(lang === "en" ? ORDER_SUMMARY_FOOTER_EN : ORDER_SUMMARY_FOOTER_TH);
  return lines.join("\n");
}
