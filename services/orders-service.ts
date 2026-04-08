/**
 * Admin orders service — list, approve, reject, ship.
 */
import { getSql } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { sendShippingConfirmationEmail } from "@/services/email-service";
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
}

export type ServiceResult<T> = { data: T | null; error: string | null };

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
                 o.customer_phone, o.shipping_address, o.customer_note
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
                 o.customer_phone, o.shipping_address, o.customer_note
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

export async function approvePayment(orderId: number): Promise<ServiceResult<null>> {
  try {
    const sql = getSql();
    await sql`UPDATE orders SET status = 'PAID', reject_note = NULL WHERE id = ${orderId}`;
    return { data: null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders-service] approvePayment error:", msg);
    return { data: null, error: msg };
  }
}

export async function rejectPayment(orderId: number, note: string): Promise<ServiceResult<null>> {
  try {
    const sql = getSql();
    await sql`UPDATE orders SET status = 'CANCELLED', reject_note = ${note} WHERE id = ${orderId}`;
    return { data: null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders-service] rejectPayment error:", msg);
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
          order_number: string;
          order_line_uid: string | null;
          web_customer_line_uid: string | null;
          profile_line_id: string | null;
        }[]>`
          SELECT c.email,
                 c.full_name,
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

        const name = row.full_name ?? "คุณลูกค้า";
        const orderNumber = row.order_number;

        const lineTarget =
          row.order_line_uid?.trim() ||
          row.web_customer_line_uid?.trim() ||
          row.profile_line_id?.trim() ||
          null;

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

        // LINE: plain text (claim / profile / legacy customer line)
        if (lineTarget) {
          try {
            const lineText = `🌱 สินค้าของคุณถูกจัดส่งแล้ว! เลขพัสดุ: ${trackingNumber}`;
            const r = await pushTextToLineUser(lineTarget, lineText);
            if (!r.success) console.error("[orders-service] markShipped LINE push:", r.error);
          } catch (lineErr) {
            console.error("[orders-service] markShipped LINE error:", lineErr);
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
