import { fetchCheckoutPaymentSettings } from "@/lib/payment-settings-public";
import { lineOaUrlWithOrderHint } from "@/lib/line-oa-url";
import type { EmailItem } from "@/lib/services/order-service";
import { getSiteOrigin } from "@/lib/get-url";

const SITE_URL = getSiteOrigin();

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function L(locale: string, th: string, en: string) {
  return locale === "en" ? en : th;
}

function baht(n: number, locale: string) {
  return n.toLocaleString(locale === "en" ? "en-US" : "th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });
}

function moneySpan(amount: number, locale: string): string {
  return `<span style="font-variant-numeric:tabular-nums">${baht(amount, locale)}</span>`;
}

export type PaymentBlocks = {
  bank: { name: string; accountNo: string; accountName: string } | null;
  promptPay: { identifier: string | null; qrUrl: string | null } | null;
};

export async function loadPaymentBlocksForEmail(): Promise<PaymentBlocks> {
  const { settings } = await fetchCheckoutPaymentSettings();
  const bankRow = settings.find((s) => s.source === "bank" && s.bank_name);
  const bank = bankRow
    ? {
        name: bankRow.bank_name ?? "",
        accountNo: bankRow.account_number?.trim() ?? "",
        accountName: bankRow.account_name?.trim() ?? "",
      }
    : null;
  const pp = settings.find((s) => s.source === "promptpay");
  const promptPay = pp
    ? { identifier: pp.account_number?.trim() ?? null, qrUrl: pp.qr_code_url?.trim() ?? null }
    : null;
  return { bank, promptPay };
}

export function buildOrderConfirmationHtml(opts: {
  orderNumber: string;
  orderId?: number;
  customerName: string;
  paymentMethod: string;
  orderStatus: string;
  items: EmailItem[];
  payment: PaymentBlocks;
  freeGiftCount?: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  locale: string;
  logoUrl: string | null;
}): string {
  const { locale, paymentMethod } = opts;
  const isTransfer = paymentMethod === "TRANSFER";
  const pendingPayment = ["PENDING", "PENDING_PAYMENT"].includes(opts.orderStatus);
  const hasPaymentData =
    opts.payment.bank ||
    opts.payment.promptPay?.identifier ||
    opts.payment.promptPay?.qrUrl;
  const showPaymentBlock = isTransfer && pendingPayment && hasPaymentData;

  const itemRows = opts.items
    .map((i) => {
      const lineTotal = i.price * i.qty;
      const breeder = i.breederName ? esc(i.breederName) : "—";
      const gen = i.genetics ? esc(i.genetics) : "—";
      const typ = esc(i.typeLabel);
      const pack = i.unitLabel ? esc(i.unitLabel) : "";
      return `
    <tr>
      <td style="padding:14px 8px 14px 0;border-bottom:1px solid #e4e4e7;vertical-align:top">
        <div style="font-weight:600;color:#18181b;font-size:14px;line-height:1.35">${esc(i.productName)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:8px;font-size:12px;color:#52525b;line-height:1.5">
          <tr>
            <td style="padding:0 8px 4px 0;vertical-align:top;width:33%">${L(locale, "ผู้ปลูก", "Breeder")}</td>
            <td style="padding:0 0 4px;vertical-align:top">${breeder}</td>
          </tr>
          <tr>
            <td style="padding:0 8px 4px 0;vertical-align:top">${L(locale, "พันธุ์", "Genetics")}</td>
            <td style="padding:0 0 4px;vertical-align:top">${gen}</td>
          </tr>
          <tr>
            <td style="padding:0 8px 0 0;vertical-align:top">${L(locale, "ประเภท", "Type")}</td>
            <td style="padding:0;vertical-align:top">${typ}</td>
          </tr>
        </table>
        ${pack ? `<p style="margin:8px 0 0;color:#a1a1aa;font-size:11px">${L(locale, "แพ็ก", "Pack")}: ${pack}</p>` : ""}
      </td>
      <td style="padding:14px 8px;border-bottom:1px solid #e4e4e7;text-align:center;color:#52525b;font-size:14px;vertical-align:top;font-variant-numeric:tabular-nums">${i.qty}</td>
      <td style="padding:14px 0 14px 8px;border-bottom:1px solid #e4e4e7;text-align:right;color:#18181b;font-size:14px;font-weight:600;vertical-align:top">${moneySpan(lineTotal, locale)}</td>
    </tr>`;
    })
    .join("");

  const freeGiftRow =
    (opts.freeGiftCount ?? 0) > 0
      ? `<tr>
        <td style="padding:14px 8px 14px 0;border-bottom:1px solid #e4e4e7;color:#52525b;font-size:14px">${L(locale, "ของแถม", "Free gift")}</td>
        <td style="padding:14px 8px;border-bottom:1px solid #e4e4e7;text-align:center;color:#52525b;font-size:14px;font-variant-numeric:tabular-nums">${opts.freeGiftCount}</td>
        <td style="padding:14px 0 14px 8px;border-bottom:1px solid #e4e4e7;text-align:right;color:#52525b;font-size:14px;font-weight:600">${L(locale, "ฟรี", "Free")}</td>
      </tr>`
      : "";

  const logoHtml = opts.logoUrl
    ? `<img src="${esc(opts.logoUrl)}" alt="Smile Seed Bank" style="max-height:52px;max-width:180px;object-fit:contain;display:block;margin:0 auto 10px">`
    : `<span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Smile Seed Bank</span>`;

  let paymentSection = "";
  if (showPaymentBlock) {
    const rows: string[] = [];
    if (opts.payment.bank) {
      rows.push(`
        <tr>
          <td style="padding:8px 12px 8px 0;color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;width:36%">${L(locale, "ธนาคาร", "Bank")}</td>
          <td style="padding:8px 0;color:#18181b;font-size:14px;font-weight:600">${esc(opts.payment.bank.name)}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px 8px 0;color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;border-top:1px solid #e4e4e7">${L(locale, "เลขบัญชี", "Account no.")}</td>
          <td style="padding:8px 0;color:#18181b;font-size:15px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:0.5px;border-top:1px solid #e4e4e7">${esc(opts.payment.bank.accountNo)}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px 8px 0;color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;border-top:1px solid #e4e4e7">${L(locale, "ชื่อบัญชี", "Account name")}</td>
          <td style="padding:8px 0;color:#27272a;font-size:14px;border-top:1px solid #e4e4e7">${esc(opts.payment.bank.accountName)}</td>
        </tr>`);
    }
    if (opts.payment.promptPay?.identifier) {
      rows.push(`
        <tr>
          <td style="padding:8px 12px 0 0;color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;vertical-align:top;border-top:1px solid #e4e4e7">PromptPay</td>
          <td style="padding:8px 0 0;color:#18181b;font-size:15px;font-weight:700;font-variant-numeric:tabular-nums;border-top:1px solid #e4e4e7">${esc(opts.payment.promptPay.identifier)}</td>
        </tr>`);
    }

    const qrBlock =
      opts.payment.promptPay?.qrUrl && opts.payment.promptPay.qrUrl.startsWith("http")
        ? `
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e4e4e7;text-align:center">
        <p style="margin:0 0 8px;color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase">${L(locale, "สแกน PromptPay", "Scan PromptPay")}</p>
        <img src="${esc(opts.payment.promptPay.qrUrl)}" alt="PromptPay QR" width="200" height="200" style="max-width:200px;height:auto;border-radius:8px;border:1px solid #e4e4e7;display:inline-block">
      </div>`
        : "";

    paymentSection = `
  <div style="margin:24px 0;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;background:#fafafa">
    <div style="padding:12px 16px;border-bottom:1px solid #e4e4e7;background:#f4f4f5">
      <p style="margin:0;color:#52525b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">
        ${L(locale, "ชำระเงิน", "Payment")}
      </p>
    </div>
    <div style="padding:16px 18px;color:#27272a;font-size:13px">
      <p style="margin:0 0 12px;color:#52525b;font-size:13px;line-height:1.5">
        ${L(locale, "โอนตามรายละเอียดด้านล่าง แล้วอัปโหลดสลิปที่หน้าชำระเงิน", "Please transfer using the details below, then upload your slip on the payment page.")}
      </p>
      <table style="width:100%;border-collapse:collapse">${rows.join("")}</table>
      <p style="margin:14px 0 0;color:#52525b;font-size:13px">
        ${L(locale, "ยอดที่ต้องโอน", "Amount due")}: <strong style="font-size:17px;color:#18181b;font-variant-numeric:tabular-nums">${moneySpan(opts.total, locale)}</strong>
      </p>
      ${qrBlock}
    </div>
  </div>`;
  } else if (isTransfer && pendingPayment && !hasPaymentData) {
    paymentSection = `
  <div style="margin:24px 0;border:1px solid #e4e4e7;border-radius:12px;padding:16px;background:#fafafa">
    <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5">
      ${L(locale, "รายละเอียดบัญชีรับโอนจะแสดงที่หน้าชำระเงินหลังสั่งซื้อ", "Bank details are shown on the payment page after checkout.")}
    </p>
  </div>`;
  }

  const lineHref = lineOaUrlWithOrderHint(opts.orderNumber);

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${L(locale, `ยืนยันออเดอร์ #${opts.orderNumber}`, `Order confirmed #${opts.orderNumber}`)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7">

    <div style="background:linear-gradient(135deg,#15803d 0%,#166534 100%);padding:32px 28px 24px;text-align:center">
      ${logoHtml}
      <p style="margin:10px 0 0;color:rgba(255,255,255,0.88);font-size:13px;letter-spacing:0.2px">
        ${L(locale, "ยืนยันการสั่งซื้อ", "Order confirmation")}
      </p>
    </div>

    <div style="background:#fafafa;border-bottom:1px solid #e4e4e7;padding:18px 28px;text-align:center">
      <p style="margin:0 0 4px;color:#71717a;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px">
        ${L(locale, "เลขออเดอร์", "Order number")}
      </p>
      <p style="margin:0;color:#18181b;font-size:30px;font-weight:800;letter-spacing:2px;line-height:1;font-variant-numeric:tabular-nums">
        #${esc(opts.orderNumber)}
      </p>
      <p style="margin:8px 0 0;color:#a1a1aa;font-size:11px">
        ${L(locale, "สถานะ", "Status")}: <span style="color:#52525b;font-weight:600">${esc(opts.orderStatus)}</span>
      </p>
    </div>

    <div style="padding:24px 28px 28px">

      <p style="margin:0 0 20px;color:#27272a;font-size:15px;line-height:1.65">
        ${L(locale, `สวัสดีคุณ <strong>${esc(opts.customerName)}</strong><br>ขอบคุณที่ไว้วางใจ Smile Seed Bank — เราได้รับคำสั่งซื้อของคุณแล้ว`, `Hello <strong>${esc(opts.customerName)}</strong>,<br>Thank you for your order with Smile Seed Bank.`)}
      </p>

      <div style="border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;margin-bottom:18px;background:#fff">
        <div style="background:#f4f4f5;padding:10px 14px;border-bottom:1px solid #e4e4e7">
          <p style="margin:0;color:#52525b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">
            ${L(locale, "รายการสินค้า", "Order items")}
          </p>
        </div>
        <div style="padding:0 14px 8px">
          <table style="width:100%;border-collapse:collapse;table-layout:fixed">
            <thead>
              <tr>
                <th style="text-align:left;padding:10px 8px 8px 0;color:#71717a;font-size:10px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e4e4e7">${L(locale, "สินค้า", "Product")}</th>
                <th style="text-align:center;padding:10px 6px 8px;width:52px;color:#71717a;font-size:10px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e4e4e7">${L(locale, "จำนวน", "Qty")}</th>
                <th style="text-align:right;padding:10px 0 8px 8px;width:96px;color:#71717a;font-size:10px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e4e4e7">${L(locale, "ราคา", "Amount")}</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              ${freeGiftRow}
            </tbody>
          </table>
        </div>
      </div>

      <div style="border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;margin-bottom:18px;background:#fafafa">
        ${opts.subtotal > 0 && opts.subtotal !== opts.total ? `
        <div style="display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #e4e4e7">
          <span style="color:#71717a;font-size:13px">${L(locale, "ยอดสินค้า", "Subtotal")}</span>
          <span style="color:#27272a;font-size:13px;font-variant-numeric:tabular-nums">${moneySpan(opts.subtotal, locale)}</span>
        </div>` : ""}
        ${opts.discount > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #e4e4e7;background:#f4f4f5">
          <span style="color:#52525b;font-size:13px">${L(locale, "ส่วนลด", "Discount")}</span>
          <span style="color:#52525b;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">− ${moneySpan(opts.discount, locale)}</span>
        </div>` : ""}
        ${opts.shipping > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #e4e4e7">
          <span style="color:#71717a;font-size:13px">${L(locale, "ค่าจัดส่ง", "Shipping")}</span>
          <span style="color:#27272a;font-size:13px;font-variant-numeric:tabular-nums">${moneySpan(opts.shipping, locale)}</span>
        </div>` : `
        <div style="display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #e4e4e7">
          <span style="color:#71717a;font-size:13px">${L(locale, "ค่าจัดส่ง", "Shipping")}</span>
          <span style="color:#52525b;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">${L(locale, "ฟรี", "Free")}</span>
        </div>`}
        <div style="display:flex;justify-content:space-between;padding:14px 14px;background:#f4f4f5">
          <span style="color:#18181b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px">${L(locale, "ยอดสุทธิ", "Total")}</span>
          <span style="color:#15803d;font-size:20px;font-weight:800;font-variant-numeric:tabular-nums">${moneySpan(opts.total, locale)}</span>
        </div>
      </div>

      ${paymentSection}

      <div style="margin-bottom:20px;border:1px solid #e4e4e7;border-radius:12px;padding:14px 16px;background:#fff">
        <p style="margin:0 0 6px;color:#71717a;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">
          ${L(locale, "ที่อยู่จัดส่ง", "Shipping address")}
        </p>
        <p style="margin:0;color:#27272a;font-size:14px;line-height:1.65;white-space:pre-line">${esc(opts.shippingAddress)}</p>
      </div>

      <div style="text-align:center;margin-bottom:4px">
        <a href="${SITE_URL}/profile?tab=orders${opts.orderId ? `&open=${opts.orderId}` : ""}"
           style="display:inline-block;background:#15803d;color:#ffffff;padding:13px 28px;border-radius:999px;font-size:14px;font-weight:700;text-decoration:none;margin-bottom:10px">
          ${L(locale, "ดูรายละเอียดออเดอร์", "View order details")}
        </a>
        <br>
        <a href="${lineHref}"
           style="display:inline-block;background:#06C755;color:#ffffff;padding:12px 24px;border-radius:999px;font-size:13px;font-weight:700;text-decoration:none">
          ${L(locale, "เช็คเลข Tracking Order ผ่าน Line", "Check tracking on LINE")}
        </a>
      </div>
    </div>

    <div style="background:#f4f4f5;border-top:1px solid #e4e4e7;padding:18px 28px;text-align:center">
      <p style="margin:0 0 4px;color:#52525b;font-size:12px;font-weight:600">Smile Seed Bank</p>
      <p style="margin:0;color:#a1a1aa;font-size:11px;line-height:1.5">
        ${L(locale, "ขอบคุณที่ไว้วางใจ", "Thank you for your trust")}
      </p>
      <p style="margin:8px 0 0;color:#a1a1aa;font-size:10px">
        © ${new Date().getFullYear()} Smile Seed Bank
      </p>
    </div>

  </div>
</body>
</html>`;
}
