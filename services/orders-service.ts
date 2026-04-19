/**
 * Admin orders service — list, approve, reject, ship.
 */
import { getSql } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import {
  REJECT_STOCK_RESTORE_STATUSES,
  restoreVariantStockForOrderItems,
} from "@/lib/order-inventory";
import {
  sendPaymentReceivedEmail,
  sendShippingConfirmationEmail,
} from "@/services/email-service";
import { sendLineFlexNotification } from "@/lib/order-line-notifications";
import { pushTextToLineUser } from "@/services/line-messaging";

export interface AdminOrderRow {
  id: number;
  order_number: string;
  customer_name: string | null;
  total_amount: number;
  payment_method: string | null;
  status: string;
  slip_url: string | null;
  reject_note: string | null;
  tracking_number: string | null;
  shipping_provider: string | null;
  created_at: string;
  line_user_id: string | null;
}

export type ServiceResult<T> = { data: T | null; error: string | null };

export type ApprovePaymentResult = {
  order: Exclude<Awaited<ReturnType<typeof prisma.orders.update>>, undefined>;
  before: {
    status: string | null;
    order_number: string;
    customer_name: string | null;
    shipping_email: string | null;
    line_user_id: string | null;
    total_amount: unknown;
    customers: {
      email: string | null;
      full_name: string | null;
      line_user_id: string | null;
    } | null;
  };
};

export async function listOrders(opts?: {
  status?: string;
}): Promise<ServiceResult<AdminOrderRow[]>> {
  try {
    const sql = getSql();
    const rows = opts?.status
      ? await sql<AdminOrderRow[]>`
          SELECT o.id, o.order_number,
                 COALESCE(c.full_name, o.customer_name) AS customer_name,
                 o.total_amount, o.payment_method, o.status, o.slip_url, o.reject_note,
                 o.tracking_number, o.shipping_provider, o.created_at,
                 o.customer_phone, o.shipping_address, o.customer_note,
                 o.line_user_id
          FROM orders o
          LEFT JOIN customers c ON c.id = o.customer_id
          WHERE o.status = ${opts.status}
          ORDER BY o.created_at DESC
          LIMIT 200
        `
      : await sql<AdminOrderRow[]>`
          SELECT o.id, o.order_number,
                 COALESCE(c.full_name, o.customer_name) AS customer_name,
                 o.total_amount, o.payment_method, o.status, o.slip_url, o.reject_note,
                 o.tracking_number, o.shipping_provider, o.created_at,
                 o.customer_phone, o.shipping_address, o.customer_note,
                 o.line_user_id
          FROM orders o
          LEFT JOIN customers c ON c.id = o.customer_id
          ORDER BY o.created_at DESC
          LIMIT 200
        `;
    return { data: rows, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders-service] listOrders error:", msg);
    return { data: null, error: msg };
  }
}

export async function approvePayment(
  orderId: number
): Promise<ServiceResult<ApprovePaymentResult>> {
  try {
    const oid = BigInt(orderId);

    const result = await prisma.$transaction(async (tx) => {
      const before = await tx.orders.findUnique({
        where: { id: oid },
        select: {
          status: true,
          order_number: true,
          customer_name: true,
          shipping_email: true,
          line_user_id: true,
          total_amount: true,
          source_quotation_number: true,
          customers: { select: { email: true, full_name: true, line_user_id: true } },
        },
      });
      if (!before) {
        throw new Error("Order not found");
      }

      const order = await tx.orders.update({
        where: { id: oid },
        data: { status: "PAID", reject_note: null },
      });

      // TODO: Loyalty — accrue points from `order.total_amount` / tier rules (100 THB = 1 pt per blueprint); run inside this transaction when implemented.

      const qn = before.source_quotation_number?.trim();
      const quotationPaidSync = {
        status: "CONVERTED" as const,
        updatedAt: new Date(),
      };
      let qTouch = await tx.quotations.updateMany({
        where: { convertedOrderId: oid, status: { not: "SHIPPED" } },
        data: quotationPaidSync,
      });
      if (qTouch.count === 0 && qn) {
        qTouch = await tx.quotations.updateMany({
          where: { quotationNumber: qn, status: { not: "SHIPPED" } },
          data: quotationPaidSync,
        });
      }

      return { before, order };
    });

    const { before, order } = result;

    console.log("LOG: DB Updated (transaction OK), attempting LINE notification...");
    try {
      await sendLineFlexNotification(orderId, "PAYMENT_CONFIRMED");
    } catch (lineErr) {
      console.error("LOG: LINE Notification failed internally:", lineErr);
    }

    const lineUid =
      order.line_user_id?.trim() ||
      before.line_user_id?.trim() ||
      before.customers?.line_user_id?.trim() ||
      "";
    const amountForMsg = order.total_amount ?? before.total_amount;
    const totalStr = Number(amountForMsg).toLocaleString("th-TH", {
      maximumFractionDigits: 0,
    });
    if (lineUid) {
      const th =
        `ได้รับยอดโอนจำนวน ${totalStr} บาท เรียบร้อยแล้วครับ พรุ่งนี้เราจะจัดส่งของให้ และจะแจ้งเลขพัสดุ (tracking) ให้ทราบอัตโนมัติ ขอบคุณครับ 🙏`;
      const en = `Payment of ${totalStr} THB received. We’ll ship tomorrow and send your tracking number here. Thank you! 🙏`;
      console.log("Pushing to LINE:", lineUid);
      void pushTextToLineUser(lineUid, `${th}\n\n${en}`)
        .then((pushResult) => {
          if (!pushResult.success) {
            console.error("[approvePayment] LINE text push API:", pushResult.error);
          }
        })
        .catch((e) => console.error("[approvePayment] LINE text push exception:", e));
    } else {
      console.log(
        "[approvePayment] skip LINE payment text: no line_user_id on order or web customer profile"
      );
    }

    if (before.status === "AWAITING_VERIFICATION") {
      const email =
        before.customers?.email?.trim() || before.shipping_email?.trim() || null;
      const name =
        before.customer_name?.trim() ||
        before.customers?.full_name?.trim() ||
        "Customer";
      if (email) {
        void sendPaymentReceivedEmail({
          toEmail: email,
          customerName: name,
          orderNumber: before.order_number,
          orderId,
        }).catch((e) => console.error("[approvePayment] email:", e));
      }
    }

    return { data: { order, before }, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("LOG: Main ApprovePayment process crashed:", err);
    return { data: null, error: msg };
  }
}

const REJECT_STOCK_NOTE_SUFFIX =
  " | Stock has been restored automatically upon cancellation.";

export async function rejectPayment(orderId: number, note: string): Promise<ServiceResult<null>> {
  try {
    const oid = BigInt(orderId);
    await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { id: oid },
        include: { order_items: true },
      });
      if (!order) {
        throw new Error("Order not found");
      }
      if (order.status === "CANCELLED") {
        throw new Error("Order is already cancelled");
      }
      const status = order.status ?? "";
      const canRestoreStock = (REJECT_STOCK_RESTORE_STATUSES as readonly string[]).includes(status);
      if (!canRestoreStock) {
        throw new Error(
          `Cannot reject/cancel order in status "${status}". Only ${REJECT_STOCK_RESTORE_STATUSES.join(", ")} are allowed.`
        );
      }
      await restoreVariantStockForOrderItems(tx, order.order_items);
      const trimmed = note.trim();
      const rejectNote = trimmed
        ? `${trimmed}${REJECT_STOCK_NOTE_SUFFIX}`
        : `Cancelled.${REJECT_STOCK_NOTE_SUFFIX}`;
      await tx.orders.update({
        where: { id: oid },
        data: { status: "CANCELLED", reject_note: rejectNote },
      });
    });
    return { data: null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders-service] rejectPayment error:", msg);
    return { data: null, error: msg };
  }
}

/** Cancel only `PENDING` / `PENDING_INFO` (e.g. abandoned manual claim); restores variant stock. */
export async function cancelPendingOrder(
  orderId: number,
  note?: string
): Promise<ServiceResult<null>> {
  try {
    const oid = BigInt(orderId);
    await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { id: oid },
        include: { order_items: true },
      });
      if (!order) throw new Error("Order not found");
      if (order.status === "CANCELLED") throw new Error("Order is already cancelled");
      const s = order.status ?? "";
      if (s !== "PENDING" && s !== "PENDING_INFO") {
        throw new Error(
          `Cannot cancel: only PENDING or PENDING_INFO orders (current: ${s})`
        );
      }
      await restoreVariantStockForOrderItems(tx, order.order_items);
      const trimmed = (note ?? "").trim();
      const rejectNote = trimmed
        ? `${trimmed}${REJECT_STOCK_NOTE_SUFFIX}`
        : `Cancelled by admin (pending order).${REJECT_STOCK_NOTE_SUFFIX}`;
      await tx.orders.update({
        where: { id: oid },
        data: { status: "CANCELLED", reject_note: rejectNote },
      });
    });
    return { data: null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders-service] cancelPendingOrder error:", msg);
    return { data: null, error: msg };
  }
}

export type MarkShippedResult = { quotationSynced: boolean };

/** Mark order as SHIPPED with tracking number and carrier, then email customer. */
export async function markShipped(
  orderId: number,
  trackingNumber: string,
  shippingProvider: string
): Promise<ServiceResult<MarkShippedResult>> {
  try {
    const sql = getSql();

    await sql`
      UPDATE orders
      SET status            = 'SHIPPED',
          tracking_number   = ${trackingNumber},
          shipping_provider = ${shippingProvider}
      WHERE id = ${orderId}
    `;

    let quotationSynced = false;
    try {
      const oid = BigInt(orderId);
      const byLink = await prisma.quotations.updateMany({
        where: { convertedOrderId: oid },
        data: { status: "SHIPPED" },
      });
      if (byLink.count > 0) quotationSynced = true;
      else {
        const ord = await prisma.orders.findUnique({
          where: { id: oid },
          select: { source_quotation_number: true },
        });
        const qn = ord?.source_quotation_number?.trim();
        if (qn) {
          const byNo = await prisma.quotations.updateMany({
            where: { quotationNumber: qn },
            data: { status: "SHIPPED" },
          });
          quotationSynced = byNo.count > 0;
        }
      }
    } catch (syncErr) {
      console.error("[orders-service] markShipped quotation sync:", syncErr);
    }

    // Fire-and-forget: fetch customer info then notify via email + LINE
    void (async () => {
      try {
        const rows = await sql<{
          email: string | null;
          full_name: string | null;
          customer_name: string | null;
          order_number: string;
          order_line_uid: string | null;
          web_customer_line_uid: string | null;
          profile_line_id: string | null;
        }[]>`
          SELECT COALESCE(NULLIF(TRIM(c.email), ''), NULLIF(TRIM(o.shipping_email), '')) AS email,
                 c.full_name,
                 o.customer_name,
                 o.order_number,
                 o.line_user_id AS order_line_uid,
                 c.line_user_id AS web_customer_line_uid,
                 cp.line_id AS profile_line_id
          FROM orders o
          LEFT JOIN customers c ON c.id = o.customer_id
          LEFT JOIN "Customer" cp ON cp.id = o.customer_profile_id
          WHERE o.id = ${orderId}
          LIMIT 1
        `;
        const row = rows[0];
        if (!row) return;

        const name =
          row.full_name?.trim() ||
          row.customer_name?.trim() ||
          "คุณลูกค้า";
        const orderNumber = row.order_number;
        const lineUid =
          row.order_line_uid?.trim() ||
          row.web_customer_line_uid?.trim() ||
          row.profile_line_id?.trim() ||
          "";
        const tn = trackingNumber.trim();

        // Email notification
        if (row.email) {
          try {
            await sendShippingConfirmationEmail({
              toEmail: row.email,
              customerName: name,
              orderNumber,
              orderId,
              trackingNumber,
              shippingProvider,
            });
          } catch (emailErr) {
            console.error("[orders-service] markShipped email error:", emailErr);
          }
        }

        if (tn && lineUid) {
          try {
            console.log("Pushing Tracking to LINE:", lineUid);
            const th = `ออเดอร์ ${orderNumber} จัดส่งแล้วครับ! 📦 เลขพัสดุของคุณคือ: ${tn} สามารถเช็คสถานะได้ในลิงก์ใบเสร็จครับ`;
            const en = `Order ${orderNumber} has been shipped! 📦 Your tracking number is: ${tn}`;
            void pushTextToLineUser(lineUid, `${th}\n\n${en}`)
              .then((pushResult) => {
                if (!pushResult.success) {
                  console.error("[orders-service] markShipped LINE text push API:", pushResult.error);
                }
              })
              .catch((e) => console.error("[orders-service] markShipped LINE text push exception:", e));
          } catch (lineTextErr) {
            console.error("[orders-service] markShipped LINE text push error:", lineTextErr);
          }
        }

      } catch (fetchErr) {
        console.error("[orders-service] markShipped notify error:", fetchErr);
      }
    })();

    return { data: { quotationSynced }, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders-service] markShipped error:", msg);
    return { data: null, error: msg };
  }
}
