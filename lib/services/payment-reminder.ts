/**
 * `PENDING_PAYMENT` | `PENDING` | `PENDING_INFO`, ไม่มีสลิป, ยังไม่ paid.
 * แจ้งเตือน: L1=2h / L2=12h / L3=22h จาก `created_at` — ใช้ `notification_level` 1..3 บันทึกขั้นล่าสุด.
 * 24h+ จาก `created_at` → ยกเลิก + คืน stock; ไม่ส่งข้อความลูกค้า.
 * ออเดอร์ <24h เท่านั้นที่อยู่ในรอบ reminder; ≥24h อยู่รอบ auto-cancel อย่างเดียว.
 */

import { prisma } from "@/lib/prisma";
import { getSiteOrigin } from "@/lib/get-url";
import { createOrderLog } from "@/lib/order-logs";
import { sendPaymentReminderEmail } from "@/services/email-service";
import { autoCancelUnpaidOrder24hStale } from "@/services/orders-service";
import { pushTextToLineUser } from "@/services/line-messaging";

const MS_HOUR = 60 * 60 * 1000;
const L1_AGE_MS = 2 * MS_HOUR;
const L2_AGE_MS = 12 * MS_HOUR;
const L3_AGE_MS = 22 * MS_HOUR;
const STALE_24H_MS = 24 * MS_HOUR;

export const CRON_ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PENDING",
  "PENDING_INFO",
] as const;

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

function reminderCopy(tier: ReminderTier, orderNumber: string): string {
  const id = orderNumber;
  if (tier === 1) {
    return `ออเดอร์ #${id} ของคุณยังรอชำระเงินอยู่นะคะ หากติดปัญหาแจ้งแอดมินได้เลยค่ะ\n\nYour order #${id} is awaiting payment. Please let us know if you need any assistance!`;
  }
  if (tier === 2) {
    return `คุณลูกค้าติดปัญหาในการโอนเงินหรือเปล่าคะ? สอบถามหรือขอความช่วยเหลือจากแอดมินได้ตลอดนะคะ\n\nAre you having any trouble completing your payment? We're here to help if you need anything!`;
  }
  return `ประกาศเตือนสุดท้าย! ออเดอร์ #${id} จะถูกยกเลิกในอีก 2 ชม. เพื่อคืนสต็อก หากยังต้องการสินค้า รบกวนชำระเงินก่อนระบบตัดอัตโนมัตินะคะ\n\nFinal Notice! Order #${id} will be cancelled in 2 hours to release stock. Please complete your payment to secure your items.`;
}

function buildReminderMessage(tier: ReminderTier, orderNumber: string): string {
  return `${reminderCopy(tier, orderNumber)}\n\n${paymentPageUrl(orderNumber)}`;
}

function emailSubject(tier: ReminderTier): string {
  if (tier === 1) return "แจ้งเตือนออเดอร์ · Smile Seed Bank";
  if (tier === 2) return "สอบถามการชำระเงิน · Smile Seed Bank";
  return "แจ้งเตือนครั้งสุดท้าย · Smile Seed Bank";
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

export async function sendLineMessage(
  lineUserId: string,
  message: string
): ReturnType<typeof pushTextToLineUser> {
  return pushTextToLineUser(lineUserId, message);
}

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
 * จาก `created_at` อย่างเดียว: L1 หลัง 2h, L2 หลัง 12h, L3 หลัง 22h; ตรง `notification_level` ก่อน send ถัดไป
 */
function computeNextTier(
  notificationLevel: number,
  createdAt: Date | null,
  now: Date
): ReminderTier | null {
  if (!createdAt) return null;
  const age = now.getTime() - createdAt.getTime();
  if (notificationLevel === 0) {
    if (age < L1_AGE_MS) return null;
    return 1;
  }
  if (notificationLevel === 1) {
    if (age < L2_AGE_MS) return null;
    return 2;
  }
  if (notificationLevel === 2) {
    if (age < L3_AGE_MS) return null;
    return 3;
  }
  return null;
}

function resolveContact(order: {
  line_user_id: string | null;
  shipping_email: string | null;
  customers: { email: string | null; line_user_id: string | null } | null;
}) {
  const line =
    order.line_user_id?.trim() || order.customers?.line_user_id?.trim() || null;
  const email = order.shipping_email?.trim() || order.customers?.email?.trim() || null;
  return { line, email };
}

async function deliverReminder(opts: {
  lineUserId: string | null;
  email: string | null;
  tier: ReminderTier;
  orderNumber: string;
}): Promise<{ ok: boolean; channel: "line" | "email" | "none"; error?: string }> {
  const fullMessage = buildReminderMessage(opts.tier, opts.orderNumber);
  if (opts.lineUserId?.trim()) {
    const r = await sendLineMessage(opts.lineUserId.trim(), fullMessage);
    if (r.success) return { ok: true, channel: "line" };
  }
  if (opts.email) {
    const r = await sendEmail(opts.email, fullMessage, opts.tier);
    if (r.success) return { ok: true, channel: "email" };
    return { ok: false, channel: "none", error: r.error ?? "email failed" };
  }
  return { ok: false, channel: "none", error: "no contact" };
}

function unpaidFilter<T extends { payment_status: string | null }>(o: T): boolean {
  return (o.payment_status ?? "").toLowerCase() !== "paid";
}

export async function runPaymentReminders(now: Date = new Date()): Promise<PaymentReminderRunResult> {
  const result: PaymentReminderRunResult = {
    scanned: 0,
    sent: 0,
    skipped: 0,
    autoCancelled: 0,
    errors: [],
  };

  const cutoff24h = new Date(now.getTime() - STALE_24H_MS);

  const rows = await prisma.orders.findMany({
    where: {
      status: { in: [...CRON_ORDER_STATUSES] },
      notification_level: { lt: 3 },
      created_at: { gte: cutoff24h },
      OR: [{ slip_url: null }, { slip_url: "" }],
    },
    include: {
      customers: { select: { email: true, line_user_id: true } },
    },
  });

  for (const order of rows) {
    if (order.slip_url?.trim() || !unpaidFilter(order)) {
      result.skipped += 1;
      continue;
    }

    result.scanned += 1;

    const { line, email } = resolveContact(order);
    if (!line && !email) {
      result.skipped += 1;
      continue;
    }

    const next = computeNextTier(order.notification_level, order.created_at, now);
    if (!next) {
      result.skipped += 1;
      continue;
    }

    const out = await deliverReminder({
      lineUserId: line,
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
      messageContent: `L${next} (notification_level=${next}) via ${out.channel} @ ${at.toISOString()}`,
    });

    result.sent += 1;
  }

  const staleBatch = await prisma.orders.findMany({
    where: {
      status: { in: [...CRON_ORDER_STATUSES] },
      created_at: { lt: cutoff24h },
      OR: [{ slip_url: null }, { slip_url: "" }],
    },
    include: {
      customers: { select: { email: true, line_user_id: true } },
    },
  });

  for (const order of staleBatch) {
    if (order.slip_url?.trim() || !unpaidFilter(order)) {
      continue;
    }

    result.scanned += 1;
    const cancelled = await autoCancelUnpaidOrder24hStale(Number(order.id), now);
    if (cancelled.error) {
      result.errors.push({ orderId: String(order.id), message: `24h auto-cancel: ${cancelled.error}` });
      continue;
    }

    result.autoCancelled += 1;

    await createOrderLog({
      orderId: Number(order.id),
      action: "PAYMENT_AUTO_CANCEL",
      messageContent: `24h; stock restored; CANCELLED (no customer message) @ ${now.toISOString()}`,
    });
  }

  return result;
}

export const processPaymentReminders = runPaymentReminders;
