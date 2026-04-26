/**
 * Pending payment reminders (3 steps) + auto-cancel after L3 + 1h grace. `payment_slip` = `orders.slip_url`.
 * Stock restore: `autoCancelUnpaidOrderAfterReminders` → `restoreVariantStockForOrderItems` (same as admin cancel; storefront aggregate in `lib/product-stock` reflects variant sums).
 */

import { prisma } from "@/lib/prisma";
import { getSiteOrigin } from "@/lib/get-url";
import { createOrderLog } from "@/lib/order-logs";
import { sendPaymentReminderEmail } from "@/services/email-service";
import { autoCancelUnpaidOrderAfterReminders } from "@/services/orders-service";
import { pushTextToLineUser } from "@/services/line-messaging";

const MS_HOUR = 60 * 60 * 1000;
/** Level 1: notif 0, created_at &lt; now - 1h */
const FIRST_REMINDER_AFTER_MS = 1 * MS_HOUR;
/** Level 2: notif 1, last_notified_at &lt; now - 12h */
const LEVEL_1_TO_2_MS = 12 * MS_HOUR;
/** Level 3: notif 2, last_notified_at &lt; now - 10h (~23h total) */
const LEVEL_2_TO_3_MS = 10 * MS_HOUR;
/** "Executioner": notif 3 and last_notified_at older than 1h → cancel + restore */
const POST_L3_AUTO_CANCEL_MS = 1 * MS_HOUR;

const TEMPLATE_L1 =
  "ขอบคุณที่สั่งซื้อกับ Smile Seed Bank นะครับ! ออเดอร์ของคุณยังรอดำเนินการชำระเงินอยู่ หากต้องการความช่วยเหลือแจ้งแอดมินได้เลยครับ 🌱";
const TEMPLATE_L2 =
  "สินค้าที่คุณเลือกใกล้หมดแล้ว! เราจะล็อกสต็อกไว้ให้คุณอีกไม่นาน หากยังต้องการรับน้องไปดูแล รบกวนแจ้งโอนเงินได้เลยครับ 🚀";
const TEMPLATE_L3 =
  "แจ้งเตือนสุดท้าย! ออเดอร์จะถูกยกเลิกอัตโนมัติใน 1 ชม. เพื่อคืนสต็อกให้ลูกค้าท่านอื่น หากโอนไม่ทันต้องขออภัยด้วยนะครับ ⏳";

const AUTO_CANCEL_FINAL_MSG = (orderNumber: string) =>
  `ออเดอร์ #${orderNumber} ของคุณถูกยกเลิกเนื่องจากเกินกำหนดเวลาชำระเงิน ระบบได้คืนสินค้าเข้าคลังเรียบร้อยแล้ว หากยังสนใจสามารถกดสั่งซื้อใหม่ได้ตลอดเวลาครับ 🌱`;

export type PaymentReminderRunResult = {
  scanned: number;
  sent: number;
  skipped: number;
  autoCancelled: number;
  errors: { orderId: string; message: string }[];
};

type ReminderTier = 1 | 2 | 3;

function paymentPageUrl(orderNumber: string): string {
  return `${getSiteOrigin()}/payment/${encodeURIComponent(orderNumber)}`;
}

function tierTemplate(tier: ReminderTier): string {
  if (tier === 1) return TEMPLATE_L1;
  if (tier === 2) return TEMPLATE_L2;
  return TEMPLATE_L3;
}

function buildFullMessage(tier: ReminderTier, orderNumber: string, payUrl: string): string {
  return [tierTemplate(tier), "", `ออเดอร์ #${orderNumber}`, payUrl].join("\n");
}

function emailSubject(tier: ReminderTier): string {
  if (tier === 1) return "แจ้งเตือนชำระเงิน · Smile Seed Bank";
  if (tier === 2) return "ด่วน — รอชำระเงิน · Smile Seed Bank";
  return "แจ้งเตือนสุดท้าย — Smile Seed Bank";
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainMessageToEmailHtml(message: string): string {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:24px;color:#18181b"><p style="white-space:pre-line;line-height:1.6">${htmlEscape(
    message
  )}</p></body></html>`;
}

/** Wraps LINE Messaging API — use `pushTextToLineUser`. */
export async function sendLineMessage(
  lineUserId: string,
  message: string
): ReturnType<typeof pushTextToLineUser> {
  return pushTextToLineUser(lineUserId, message);
}

/** Resend — `sendPaymentReminderEmail` with tier subject + pre-line body. */
export async function sendEmail(
  toEmail: string,
  message: string,
  tier: ReminderTier
): ReturnType<typeof sendPaymentReminderEmail> {
  return sendPaymentReminderEmail({
    toEmail,
    subject: emailSubject(tier),
    html: plainMessageToEmailHtml(message),
  });
}

/**
 * L1: notification_level === 0, created_at &lt; (now - 1h)
 * L2: notification_level === 1, last_notified_at &lt; (now - 12h)
 * L3: notification_level === 2, last_notified_at &lt; (now - 10h)
 */
function computeNextTier(
  notificationLevel: number,
  createdAt: Date | null,
  lastNotifiedAt: Date | null,
  now: Date
): ReminderTier | null {
  const t = now.getTime();
  if (!createdAt) return null;

  if (notificationLevel === 0) {
    if (createdAt.getTime() >= t - FIRST_REMINDER_AFTER_MS) return null;
    return 1;
  }
  if (notificationLevel === 1) {
    if (!lastNotifiedAt) return null;
    if (lastNotifiedAt.getTime() >= t - LEVEL_1_TO_2_MS) return null;
    return 2;
  }
  if (notificationLevel === 2) {
    if (!lastNotifiedAt) return null;
    if (lastNotifiedAt.getTime() >= t - LEVEL_2_TO_3_MS) return null;
    return 3;
  }
  return null;
}

async function deliverReminder(opts: {
  lineUserId: string | null | undefined;
  email: string | null | undefined;
  tier: ReminderTier;
  orderNumber: string;
}): Promise<{ ok: boolean; channel: "line" | "email" | "none"; error?: string }> {
  const payUrl = paymentPageUrl(opts.orderNumber);
  const fullMessage = buildFullMessage(opts.tier, opts.orderNumber, payUrl);

  const line = opts.lineUserId?.trim();
  if (line) {
    const r = await sendLineMessage(line, fullMessage);
    if (r.success) return { ok: true, channel: "line" };
  }

  const mail = opts.email?.trim();
  if (mail) {
    const r = await sendEmail(mail, fullMessage, opts.tier);
    if (r.success) return { ok: true, channel: "email" };
    return { ok: false, channel: "none", error: r.error ?? "email failed" };
  }

  return { ok: false, channel: "none", error: "no LINE user id or email" };
}

async function deliverAutoCancelFinalNotice(opts: {
  lineUserId: string | null | undefined;
  email: string | null | undefined;
  orderNumber: string;
}): Promise<{ ok: boolean; channel: "line" | "email" | "none"; error?: string }> {
  const text = AUTO_CANCEL_FINAL_MSG(opts.orderNumber);
  const line = opts.lineUserId?.trim();
  if (line) {
    const r = await sendLineMessage(line, text);
    if (r.success) return { ok: true, channel: "line" };
  }
  const mail = opts.email?.trim();
  if (mail) {
    const r = await sendPaymentReminderEmail({
      toEmail: mail,
      subject: "ออเดอร์ถูกยกเลิก · Smile Seed Bank",
      html: plainMessageToEmailHtml(text),
    });
    if (r.success) return { ok: true, channel: "email" };
    return { ok: false, channel: "none", error: r.error ?? "email failed" };
  }
  return { ok: false, channel: "none", error: "no LINE user id or email" };
}

export async function runPaymentReminders(now: Date = new Date()): Promise<PaymentReminderRunResult> {
  const result: PaymentReminderRunResult = {
    scanned: 0,
    sent: 0,
    skipped: 0,
    autoCancelled: 0,
    errors: [],
  };

  const cancelCutoff = new Date(now.getTime() - POST_L3_AUTO_CANCEL_MS);
  const toCancel = await prisma.orders.findMany({
    where: {
      status: "PENDING_PAYMENT",
      notification_level: 3,
      last_notified_at: { not: null, lt: cancelCutoff },
      OR: [{ slip_url: null }, { slip_url: "" }],
    },
    include: {
      customers: { select: { email: true, line_user_id: true } },
    },
  });

  for (const order of toCancel) {
    if (order.slip_url?.trim()) continue;

    const cancelled = await autoCancelUnpaidOrderAfterReminders(Number(order.id));
    if (cancelled.error) {
      result.errors.push({ orderId: String(order.id), message: `auto-cancel: ${cancelled.error}` });
      continue;
    }

    result.autoCancelled += 1;

    const lineUid = order.line_user_id?.trim() || order.customers?.line_user_id?.trim() || null;
    const email = order.shipping_email?.trim() || order.customers?.email?.trim() || null;
    const n = await deliverAutoCancelFinalNotice({
      lineUserId: lineUid,
      email,
      orderNumber: order.order_number,
    });
    if (!n.ok) {
      result.errors.push({
        orderId: String(order.id),
        message: n.error ?? "auto-cancel final notify failed",
      });
    }

    await createOrderLog({
      orderId: Number(order.id),
      action: "PAYMENT_AUTO_CANCEL",
      messageContent: n.ok
        ? `cancelled; stock restored; final notice ${n.channel} @ ${now.toISOString()}`
        : `cancelled; stock restored; final notice failed: ${n.error ?? "?"}`,
    });
  }

  const rows = await prisma.orders.findMany({
    where: {
      status: "PENDING_PAYMENT",
      notification_level: { lt: 3 },
      OR: [{ slip_url: null }, { slip_url: "" }],
    },
    include: {
      customers: { select: { email: true, line_user_id: true } },
    },
  });

  for (const order of rows) {
    if (order.slip_url?.trim()) {
      result.skipped += 1;
      continue;
    }

    result.scanned += 1;

    const next = computeNextTier(
      order.notification_level,
      order.created_at,
      order.last_notified_at,
      now
    );
    if (!next) {
      result.skipped += 1;
      continue;
    }

    const lineUid = order.line_user_id?.trim() || order.customers?.line_user_id?.trim() || null;
    const email = order.shipping_email?.trim() || order.customers?.email?.trim() || null;

    const out = await deliverReminder({
      lineUserId: lineUid,
      email,
      tier: next,
      orderNumber: order.order_number,
    });

    if (!out.ok) {
      result.errors.push({
        orderId: String(order.id),
        message: out.error ?? "send failed",
      });
      continue;
    }

    const at = new Date();
    await prisma.orders.update({
      where: { id: order.id },
      data: {
        notification_level: next,
        last_notified_at: at,
      },
    });

    await createOrderLog({
      orderId: Number(order.id),
      action: "PAYMENT_REMINDER",
      messageContent: `tier ${next} via ${out.channel} @ ${at.toISOString()}`,
    });

    result.sent += 1;
  }

  return result;
}

export const processPaymentReminders = runPaymentReminders;
