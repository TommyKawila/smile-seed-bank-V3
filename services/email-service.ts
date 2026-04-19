// Email Service — Resend (https://resend.com)
// Handles transactional emails: order confirmation, tracking update

import { getSiteOrigin } from "@/lib/get-url";
import { buildNewsletterWelcomeHtml } from "@/lib/email-newsletter-welcome-html";
import { CARRIER_LABELS, carrierTrackingUrl } from "@/lib/shipping-carriers";
import {
  buildOrderConfirmationHtml,
  loadPaymentBlocksForEmail,
} from "@/lib/email-order-confirmation-html";
import { promptPayAmountQrDataUrl } from "@/lib/promptpay-qr-node";
import type { EmailItem } from "@/lib/services/order-service";

/** Official PromptPay ID for transactional emails (amount-encoded QR). */
const PROMPTPAY_ID_ORDER_EMAIL = "0897553362";

const RESEND_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Smile Seed Bank <orders@smileseedbank.com>";
const SITE_URL = getSiteOrigin();

type ServiceResult = { success: boolean; error: string | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchLogoUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${SITE_URL}/api/storefront/site-settings`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json() as Record<string, string>;
    return data.logo_main_url ?? null;
  } catch {
    return null;
  }
}

function L(locale: string, th: string, en: string) {
  return locale === "en" ? en : th;
}

// ─── Send Order Confirmation ───────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(opts: {
  toEmail: string;
  toName: string;
  orderNumber: string;
  orderId?: number;
  paymentMethod?: string;
  orderStatus?: string;
  items: EmailItem[];
  freeGiftCount?: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  locale?: string;
}): Promise<ServiceResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "RESEND_API_KEY ไม่ได้ตั้งค่า" };
  if (!opts.toEmail) return { success: false, error: "ไม่มีอีเมลลูกค้า" };

  const locale = opts.locale ?? "th";
  const logoUrl = await fetchLogoUrl();
  const payment = await loadPaymentBlocksForEmail();
  const pm = opts.paymentMethod ?? "TRANSFER";
  const st = opts.orderStatus ?? "PENDING";
  const transferPending =
    pm === "TRANSFER" && ["PENDING", "PENDING_PAYMENT"].includes(st);
  const promptPayQrDataUrl =
    transferPending && opts.total > 0
      ? await promptPayAmountQrDataUrl(PROMPTPAY_ID_ORDER_EMAIL, opts.total)
      : null;

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [opts.toEmail],
        subject: L(locale,
          `✅ ยืนยันออเดอร์ #${opts.orderNumber} — Smile Seed Bank`,
          `✅ Order Confirmed #${opts.orderNumber} — Smile Seed Bank`
        ),
        html: buildOrderConfirmationHtml({
          orderNumber: opts.orderNumber,
          orderId: opts.orderId,
          customerName: opts.toName,
          paymentMethod: pm,
          orderStatus: st,
          items: opts.items,
          payment,
          freeGiftCount: opts.freeGiftCount ?? 0,
          subtotal: opts.subtotal,
          discount: opts.discount,
          shipping: opts.shipping,
          total: opts.total,
          shippingAddress: opts.shippingAddress,
          locale,
          logoUrl,
          promptPayQrDataUrl,
          promptPayDisplayId: PROMPTPAY_ID_ORDER_EMAIL,
        }),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Payment received (admin approved transfer) ───────────────────────────────

export async function sendPaymentReceivedEmail(opts: {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  orderId?: number;
}): Promise<ServiceResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "RESEND_API_KEY ไม่ได้ตั้งค่า" };
  const to = opts.toEmail?.trim();
  if (!to) return { success: false, error: "ไม่มีอีเมลลูกค้า" };

  const safeName = opts.customerName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const year = new Date().getFullYear();
  const profileOrders =
    opts.orderId != null
      ? `${SITE_URL}/profile?tab=orders&open=${opts.orderId}`
      : `${SITE_URL}/profile?tab=orders`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
  <tr><td align="center">
    <table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(21,128,61,0.08)">
      <tr>
        <td style="background:linear-gradient(135deg,#15803d,#166534);padding:28px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800">Payment received</h1>
          <p style="margin:8px 0 0;color:#bbf7d0;font-size:13px">ยอดชำระเงินได้รับแล้ว — เรากำลังเตรียมจัดส่งให้คุณ</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px">
          <p style="margin:0 0 12px;color:#18181b;font-size:15px">Hi ${safeName},</p>
          <p style="margin:0 0 20px;color:#52525b;font-size:14px;line-height:1.7">
            <strong style="color:#15803d">Payment Received!</strong> Your order is being prepared for shipment.
          </p>
          <p style="margin:0 0 8px;color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase">Order</p>
          <p style="margin:0 0 24px;font-family:ui-monospace,monospace;font-size:18px;font-weight:700;color:#14532d">#${opts.orderNumber}</p>
          <div style="text-align:center">
            <a href="${profileOrders}" style="display:inline-block;background:#15803d;color:#fff;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none">View order status</a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background:#f0fdf4;padding:14px;text-align:center;border-top:1px solid #d1fae5">
          <p style="margin:0;color:#6b7280;font-size:12px">Smile Seed Bank · © ${year}</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: `Payment Received — Order #${opts.orderNumber} · Smile Seed Bank`,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Shipping Confirmation Email ──────────────────────────────────────────────

export interface ShippingEmailInput {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  orderId?: number;
  trackingNumber: string;
  shippingProvider: string;
}

export async function sendShippingConfirmationEmail(
  input: ShippingEmailInput
): Promise<ServiceResult> {
  const { toEmail, customerName, orderNumber, trackingNumber, shippingProvider } = input;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "RESEND_API_KEY ไม่ได้ตั้งค่า" };
  if (!toEmail) return { success: false, error: "ไม่มีอีเมลลูกค้า" };

  const trackUrl = carrierTrackingUrl(trackingNumber, shippingProvider);
  const carrierLabel = CARRIER_LABELS[shippingProvider] ?? shippingProvider;
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>พัสดุของคุณถูกส่งออกแล้ว</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:32px 16px">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(21,128,61,0.10)">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#15803d 0%,#166534 100%);padding:32px 28px;text-align:center">
          <p style="margin:0;font-size:36px">🚚</p>
          <h1 style="margin:10px 0 0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px">
            พัสดุของคุณถูกส่งออกแล้ว!
          </h1>
          <p style="margin:6px 0 0;color:#bbf7d0;font-size:13px">Your package is on its way</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:28px 28px 8px">

          <!-- Greeting -->
          <p style="margin:0 0 8px;color:#18181b;font-size:15px;font-weight:600">
            สวัสดีคุณ ${customerName} 👋
          </p>
          <p style="margin:0 0 24px;color:#52525b;font-size:14px;line-height:1.7">
            ออเดอร์ <strong style="color:#15803d">#${orderNumber}</strong> ของคุณถูกส่งออกจากคลังสินค้าแล้วนะครับ
            ขณะนี้พัสดุกำลังเดินทางมาหาคุณ 🌿 คาดว่าจะได้รับภายใน 2–5 วันทำการ
          </p>

          <!-- Carrier Badge -->
          <p style="margin:0 0 10px;color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">
            ผู้ให้บริการขนส่ง
          </p>
          <div style="display:inline-block;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:999px;padding:6px 16px;margin-bottom:20px">
            <span style="color:#065f46;font-size:13px;font-weight:700">${carrierLabel}</span>
          </div>

          <!-- Tracking Number Box -->
          <div style="background:#f0fdf4;border:2px solid #6ee7b7;border-radius:16px;padding:20px 24px;text-align:center;margin-bottom:24px">
            <p style="margin:0 0 8px;color:#166534;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px">
              เลขพัสดุ / Tracking Number
            </p>
            <p style="margin:0;color:#14532d;font-size:28px;font-weight:900;letter-spacing:4px;word-break:break-all">
              ${trackingNumber}
            </p>
            <p style="margin:8px 0 0;color:#a1a1aa;font-size:11px">
              คัดลอกเลขนี้เพื่อติดตามพัสดุบนเว็บไซต์ขนส่ง
            </p>
          </div>

          <!-- CTA: Track Button -->
          <div style="text-align:center;margin-bottom:20px">
            <a href="${trackUrl}"
               target="_blank"
               rel="noopener noreferrer"
               style="display:inline-block;background:#15803d;color:#ffffff;padding:14px 36px;border-radius:999px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.3px">
              🔍 ติดตามพัสดุ
            </a>
          </div>

          <!-- Secondary CTA: View Order -->
          <div style="text-align:center;margin-bottom:28px">
            <a href="${SITE_URL}/profile?tab=orders${input.orderId ? `&open=${input.orderId}` : ""}"
               style="color:#15803d;font-size:13px;font-weight:600;text-decoration:underline">
              ดูรายละเอียดออเดอร์ทั้งหมด →
            </a>
          </div>

          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 20px">

          <!-- Help Text -->
          <p style="margin:0 0 28px;color:#a1a1aa;font-size:12px;line-height:1.6;text-align:center">
            หากมีปัญหาเกี่ยวกับการจัดส่ง กรุณาติดต่อเราผ่าน LINE หรือ Facebook<br>
            พร้อมแจ้งเลขออเดอร์ <strong>#${orderNumber}</strong>
          </p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f0fdf4;border-top:1px solid #d1fae5;padding:16px 28px;text-align:center">
          <p style="margin:0 0 4px;color:#6b7280;font-size:12px;font-weight:600">Smile Seed Bank 🌿</p>
          <p style="margin:0;color:#a1a1aa;font-size:11px">© ${year} All rights reserved.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: `🚚 ออเดอร์ #${orderNumber} จัดส่งแล้ว! — Smile Seed Bank`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Welcome + WELCOME10 code after newsletter signup (storefront). */
export async function sendNewsletterWelcomeEmail(opts: {
  toEmail: string;
  locale?: "th" | "en";
}): Promise<ServiceResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "RESEND_API_KEY ไม่ได้ตั้งค่า" };
  const locale = opts.locale === "en" ? "en" : "th";
  const storeUrl = `${getSiteOrigin()}/shop`;
  const subject =
    locale === "en"
      ? "Welcome! Here is your 10% discount code from Smile Seed Bank"
      : "ยินดีต้อนรับ! นี่คือโค้ดส่วนลด 10% ของคุณจาก Smile Seed Bank 🌱";
  const html = buildNewsletterWelcomeHtml(locale, storeUrl);
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [opts.toEmail],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
