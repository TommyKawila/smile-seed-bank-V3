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
import { getTrackingUrl } from "@/lib/shipping-tracking-url";
import { createOrderLog } from "@/lib/order-logs";
import { pushTextToLineUser } from "@/services/line-messaging";
import type { AdminOrderLineItem } from "@/types/admin-order";

export type { AdminOrderLineItem };

export interface AdminOrderRow {
  id: number;
  order_number: string;
  customer_name: string | null;
  total_amount: number;
  payment_method: string | null;
  /** unpaid | paid */
  payment_status: string;
  status: string;
  slip_url: string | null;
  reject_note: string | null;
  tracking_number: string | null;
  shipping_provider: string | null;
  created_at: string;
  line_user_id: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  customer_note: string | null;
  customer_id: string | null;
  customer_email: string | null;
  discount_amount: number;
  points_discount_amount: number;
  promotion_discount_amount: number;
  line_items: AdminOrderLineItem[];
}

type RawOrderListRow = {
  id: unknown;
  order_number: string;
  customer_name: string | null;
  total_amount: unknown;
  payment_method: string | null;
  status: string;
  slip_url: string | null;
  reject_note: string | null;
  tracking_number: string | null;
  shipping_provider: string | null;
  created_at: string;
  line_user_id: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  customer_note: string | null;
  customer_id: string | null;
  customer_email: string | null;
  discount_amount: unknown;
  points_discount_amount: unknown;
  promotion_discount_amount: unknown;
  payment_status?: string | null;
};

function normalizeOrderListRow(r: RawOrderListRow): AdminOrderRow {
  return {
    id: Number(r.id),
    order_number: r.order_number,
    customer_name: r.customer_name,
    total_amount: Number(r.total_amount ?? 0),
    payment_method: r.payment_method,
    payment_status:
      (r.payment_status ?? "").toLowerCase() === "paid" ? "paid" : "unpaid",
    status: r.status,
    slip_url: r.slip_url,
    reject_note: r.reject_note,
    tracking_number: r.tracking_number,
    shipping_provider: r.shipping_provider,
    created_at: r.created_at,
    line_user_id: r.line_user_id,
    customer_phone: r.customer_phone,
    shipping_address: r.shipping_address,
    customer_note: r.customer_note,
    customer_id: r.customer_id,
    customer_email: r.customer_email,
    discount_amount: Number(r.discount_amount ?? 0),
    points_discount_amount: Number(r.points_discount_amount ?? 0),
    promotion_discount_amount: Number(r.promotion_discount_amount ?? 0),
    line_items: [],
  };
}

async function attachOrderLineItems(rows: AdminOrderRow[]): Promise<AdminOrderRow[]> {
  if (!rows.length) return rows;
  const sql = getSql();
  const ids = rows.map((r) => r.id);
  type LineSql = {
    order_id: unknown;
    quantity: number;
    unit_price: unknown;
    product_name: string;
    unit_label: string | null;
    variant_unit_label: string | null;
    subtotal: unknown;
    breeder_name: string | null;
    flowering_type: string | null;
  };
  const lines = await sql<LineSql[]>`
    SELECT
      oi.order_id,
      oi.quantity,
      oi.unit_price,
      oi.product_name,
      oi.unit_label,
      pv.unit_label AS variant_unit_label,
      oi.subtotal,
      COALESCE(b.name, '') AS breeder_name,
      p.flowering_type
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN breeders b ON b.id = p.breeder_id
    LEFT JOIN product_variants pv ON pv.id = oi.variant_id
    WHERE oi.order_id IN ${sql(ids)}
    ORDER BY oi.id ASC
  `;
  const map = new Map<number, AdminOrderLineItem[]>();
  for (const l of lines) {
    const oid = Number(l.order_id);
    const arr = map.get(oid) ?? [];
    arr.push({
      quantity: l.quantity,
      unit_price: Number(l.unit_price ?? 0),
      product_name: l.product_name,
      unit_label: l.unit_label,
      variant_unit_label: l.variant_unit_label,
      subtotal: l.subtotal != null ? Number(l.subtotal) : null,
      breeder_name: (l.breeder_name ?? "").trim() || "—",
      flowering_type: l.flowering_type,
    });
    map.set(oid, arr);
  }
  return rows.map((r) => ({ ...r, line_items: map.get(r.id) ?? [] }));
}

export type ServiceResult<T> = { data: T | null; error: string | null };

/**
 * Mobile /admin/m — tab keys (filter logic is SQL in `listOrders`: payment_status + status).
 */
export const ADMIN_ORDER_STATUS_TAB = {
  waiting: ["PENDING", "PENDING_INFO", "AWAITING_VERIFICATION"],
  paid: ["PENDING", "PROCESSING"],
  shipped: ["SHIPPED", "DELIVERED"],
  completed: ["COMPLETED"],
  cancelled: ["CANCELLED", "VOID", "VOIDED"],
} as const;

export type AdminOrderStatusTab = keyof typeof ADMIN_ORDER_STATUS_TAB;

export type AdminOrderDateRange = "week" | "month" | "year" | "all";

function lowerBoundForDateRange(range: AdminOrderDateRange): Date | null {
  if (range === "all") return null;
  const now = Date.now();
  if (range === "week") return new Date(now - 7 * 86400000);
  if (range === "month") return new Date(now - 30 * 86400000);
  if (range === "year") {
    const ymd = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const year = ymd.slice(0, 4);
    return new Date(`${year}-01-01T00:00:00+07:00`);
  }
  return null;
}

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

export async function countPaidReadyToShipOrders(dateRange: AdminOrderDateRange | string): Promise<number> {
  const sql = getSql();
  const drRaw = String(dateRange ?? "all").trim();
  const dr: AdminOrderDateRange =
    drRaw === "week" || drRaw === "month" || drRaw === "year" || drRaw === "all" ? drRaw : "all";
  const from = lowerBoundForDateRange(dr);
  if (from) {
    const rows = await sql<[{ c: string }]>`
      SELECT COUNT(*)::text AS c
      FROM orders o
      WHERE o.payment_status = 'paid'
        AND o.status IN ('PENDING', 'PROCESSING')
        AND o.created_at >= ${from.toISOString()}::timestamptz
    `;
    return parseInt(rows[0]?.c ?? "0", 10) || 0;
  }
  const rows = await sql<[{ c: string }]>`
    SELECT COUNT(*)::text AS c
    FROM orders o
    WHERE o.payment_status = 'paid' AND o.status IN ('PENDING', 'PROCESSING')
  `;
  return parseInt(rows[0]?.c ?? "0", 10) || 0;
}

export type OrderListTabCounts = {
  waiting: number;
  paid: number;
  shipped: number;
  completed: number;
  cancelled: number;
};

/** All-time counts for desktop order tabs (same WHERE as `listOrders` per tab). */
export async function countOrdersByListTabs(): Promise<OrderListTabCounts> {
  const sql = getSql();
  const [
    waitingRows,
    paidRows,
    shippedRows,
    completedRows,
    cancelledRows,
  ] = await Promise.all([
    sql<[{ c: string }]>`
      SELECT COUNT(*)::text AS c FROM orders o
      WHERE (o.payment_status IS NULL OR o.payment_status NOT ILIKE 'paid')
        AND o.status IN ('PENDING', 'PENDING_INFO', 'AWAITING_VERIFICATION')
    `,
    sql<[{ c: string }]>`
      SELECT COUNT(*)::text AS c FROM orders o
      WHERE o.payment_status = 'paid' AND o.status IN ('PENDING', 'PROCESSING')
    `,
    sql<[{ c: string }]>`
      SELECT COUNT(*)::text AS c FROM orders o
      WHERE o.status IN ('SHIPPED', 'DELIVERED')
    `,
    sql<[{ c: string }]>`
      SELECT COUNT(*)::text AS c FROM orders o WHERE o.status = 'COMPLETED'
    `,
    sql<[{ c: string }]>`
      SELECT COUNT(*)::text AS c FROM orders o
      WHERE o.status IN ('CANCELLED', 'VOID', 'VOIDED')
    `,
  ]);
  const n = (r: [{ c: string }]) => parseInt(r[0]?.c ?? "0", 10) || 0;
  return {
    waiting: n(waitingRows),
    paid: n(paidRows),
    shipped: n(shippedRows),
    completed: n(completedRows),
    cancelled: n(cancelledRows),
  };
}

export async function listOrders(opts?: {
  status?: string;
  /** Mobile dashboard: maps to multiple `orders.status` values */
  statusTab?: AdminOrderStatusTab | string;
  /** When set, filters `created_at >=` lower bound (Asia/Bangkok year for `year`) */
  dateRange?: AdminOrderDateRange | string;
}): Promise<ServiceResult<AdminOrderRow[]>> {
  try {
    const sql = getSql();
    const tabRaw = opts?.statusTab?.trim();
    const tab =
      tabRaw && tabRaw in ADMIN_ORDER_STATUS_TAB
        ? (tabRaw as AdminOrderStatusTab)
        : undefined;
    const legacyStatus = opts?.status?.trim();

    const drRaw = opts?.dateRange?.trim();
    const hasDateRangeParam = opts?.dateRange !== undefined && opts?.dateRange !== "";
    const dr: AdminOrderDateRange =
      drRaw === "week" || drRaw === "month" || drRaw === "year" || drRaw === "all"
        ? drRaw
        : "all";
    const from = hasDateRangeParam ? lowerBoundForDateRange(dr) : null;

    let whereFragment;
    if (tab) {
      switch (tab) {
        case "waiting":
          whereFragment = sql`(o.payment_status IS NULL OR o.payment_status NOT ILIKE 'paid') AND o.status IN ('PENDING', 'PENDING_INFO', 'AWAITING_VERIFICATION')`;
          break;
        case "paid":
          whereFragment = sql`o.payment_status = 'paid' AND o.status IN ('PENDING', 'PROCESSING')`;
          break;
        case "shipped":
          whereFragment = sql`o.status IN ('SHIPPED', 'DELIVERED')`;
          break;
        case "completed":
          whereFragment = sql`o.status = 'COMPLETED'`;
          break;
        case "cancelled":
          whereFragment = sql`o.status IN ('CANCELLED', 'VOID', 'VOIDED')`;
          break;
        default:
          whereFragment = sql`TRUE`;
      }
    } else if (legacyStatus) {
      if (legacyStatus === "PAID") {
        whereFragment = sql`o.payment_status = 'paid' AND o.status IN ('PENDING', 'PROCESSING')`;
      } else {
        whereFragment = sql`o.status = ${legacyStatus}`;
      }
    } else {
      whereFragment = sql`TRUE`;
    }

    const limit = tab || legacyStatus ? 500 : 200;

    const baseSelect = sql`
      SELECT o.id, o.order_number,
             COALESCE(c.full_name, o.customer_name) AS customer_name,
             o.total_amount, o.payment_method, o.payment_status, o.status, o.slip_url, o.reject_note,
             o.tracking_number, o.shipping_provider, o.created_at,
             o.customer_phone, o.shipping_address, o.customer_note,
             COALESCE(NULLIF(trim(o.line_user_id), ''), NULLIF(trim(c.line_user_id), '')) AS line_user_id,
             o.customer_id::text AS customer_id,
             c.email AS customer_email,
             o.discount_amount,
             o.points_discount_amount,
             o.promotion_discount_amount
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id`;

    const rawRows =
      from != null
        ? await sql<RawOrderListRow[]>`
      ${baseSelect}
      WHERE ${whereFragment}
        AND o.created_at >= ${from.toISOString()}::timestamptz
      ORDER BY o.created_at DESC
      LIMIT ${limit}
    `
        : await sql<RawOrderListRow[]>`
      ${baseSelect}
      WHERE ${whereFragment}
      ORDER BY o.created_at DESC
      LIMIT ${limit}
    `;

    const normalized = rawRows.map(normalizeOrderListRow);
    const withItems = await attachOrderLineItems(normalized);
    return { data: withItems, error: null };
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
        data: { status: "PENDING", payment_status: "paid", reject_note: null },
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
      const textBody = `${th}\n\n${en}`;
      console.log("Pushing to LINE:", lineUid);
      try {
        const pushResult = await pushTextToLineUser(lineUid, textBody);
        if (pushResult.success) {
          await createOrderLog({
            orderId,
            action: "AUTO_LINE_TEXT",
            messageContent: textBody,
          });
        } else {
          console.error("[approvePayment] LINE text push API:", pushResult.error);
        }
      } catch (e) {
        console.error("[approvePayment] LINE text push exception:", e);
      }
    } else {
      console.log(
        "[approvePayment] skip LINE payment text: no line_user_id on order or web customer profile"
      );
    }

    const email =
      before.customers?.email?.trim() || before.shipping_email?.trim() || null;
    const name =
      before.customer_name?.trim() || before.customers?.full_name?.trim() || "Customer";
    const sendPaymentEmail =
      !!email && (!lineUid || before.status === "AWAITING_VERIFICATION");
    if (sendPaymentEmail && email) {
      void sendPaymentReceivedEmail({
        toEmail: email,
        customerName: name,
        orderNumber: before.order_number,
        orderId,
      }).catch((e) => console.error("[approvePayment] email:", e));
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
      if (
        (order.status === "PENDING" || order.status === "PROCESSING") &&
        (order.payment_status ?? "").toLowerCase() === "paid"
      ) {
        throw new Error("Use void/cancel from paid queue — payment already confirmed");
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
      if ((order.payment_status ?? "").toLowerCase() === "paid") {
        throw new Error("Cannot cancel: payment already confirmed — use void if needed");
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

/** Undo mistaken approve: `PAID` → `AWAITING_VERIFICATION` if slip exists, else `PENDING`. Clears tracking. */
export async function revertApprovalToPending(orderId: number): Promise<ServiceResult<null>> {
  try {
    const oid = BigInt(orderId);
    await prisma.$transaction(async (tx) => {
      const o = await tx.orders.findUnique({
        where: { id: oid },
        select: { status: true, payment_status: true, slip_url: true },
      });
      if (!o) throw new Error("Order not found");
      const isPaidQueue =
        (o.status === "PENDING" || o.status === "PROCESSING") &&
        (o.payment_status ?? "").toLowerCase() === "paid";
      if (!isPaidQueue && o.status !== "PAID") {
        throw new Error(
          `Only paid, ready-to-ship orders can be reverted (current: ${o.status ?? "?"})`
        );
      }
      const next = o.slip_url?.trim() ? "AWAITING_VERIFICATION" : "PENDING";
      await tx.orders.update({
        where: { id: oid },
        data: {
          status: next,
          payment_status: "pending",
          tracking_number: null,
          shipping_provider: null,
        },
      });
    });
    return { data: null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders-service] revertApprovalToPending error:", msg);
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
    const oid = BigInt(orderId);
    const upd = await prisma.orders.updateMany({
      where: {
        id: oid,
        OR: [
          { status: "PENDING", payment_status: "paid" },
          { status: "PROCESSING", payment_status: "paid" },
          { status: "PAID" },
        ],
      },
      data: {
        status: "SHIPPED",
        tracking_number: trackingNumber,
        shipping_provider: shippingProvider,
      },
    });
    if (upd.count === 0) {
      return { data: null, error: "Order not in ready-to-ship state" };
    }

    let quotationSynced = false;
    try {
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
        } else if (!lineUid) {
          console.warn(
            `[markShipped] order ${orderId}: no email and no LINE id — cannot notify customer of shipment`
          );
        }

        if (tn && lineUid) {
          try {
            await sendLineFlexNotification(orderId, "ORDER_SHIPPED", {
              trackingNumber: tn,
              shippingProvider,
            });
          } catch (lineFlexErr) {
            console.error("[orders-service] markShipped LINE flex push error:", lineFlexErr);
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
