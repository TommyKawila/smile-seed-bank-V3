/**
 * Admin orders service — list, approve, reject, ship.
 */
import { getSql } from "@/lib/db";
import { sendShippingConfirmationEmail } from "@/services/email-service";
import { sendCustomerShippingAlert } from "@/services/line-messaging";

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
          SELECT o.id, o.order_number, c.full_name AS customer_name, o.total_amount,
                 o.payment_method, o.status, o.slip_url, o.reject_note,
                 o.tracking_number, o.shipping_provider, o.created_at
          FROM orders o
          LEFT JOIN customers c ON c.id = o.customer_id
          WHERE o.status = ${opts.status}
          ORDER BY o.created_at DESC
          LIMIT 200
        `
      : await sql<AdminOrderRow[]>`
          SELECT o.id, o.order_number, c.full_name AS customer_name, o.total_amount,
                 o.payment_method, o.status, o.slip_url, o.reject_note,
                 o.tracking_number, o.shipping_provider, o.created_at
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

/** Mark order as SHIPPED with tracking number and carrier, then email customer. */
export async function markShipped(
  orderId: number,
  trackingNumber: string,
  shippingProvider: string
): Promise<ServiceResult<null>> {
  try {
    const sql = getSql();

    await sql`
      UPDATE orders
      SET status            = 'SHIPPED',
          tracking_number   = ${trackingNumber},
          shipping_provider = ${shippingProvider}
      WHERE id = ${orderId}
    `;

    // Fire-and-forget: fetch customer info then notify via email + LINE
    void (async () => {
      try {
        const rows = await sql<{
          email: string | null;
          full_name: string | null;
          line_user_id: string | null;
          order_number: string;
        }[]>`
          SELECT c.email, c.full_name, c.line_user_id, o.order_number
          FROM orders o
          LEFT JOIN customers c ON c.id = o.customer_id
          WHERE o.id = ${orderId}
          LIMIT 1
        `;
        const row = rows[0];
        if (!row) return;

        const name = row.full_name ?? "คุณลูกค้า";
        const orderNumber = row.order_number;

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

        // LINE notification
        if (row.line_user_id) {
          try {
            await sendCustomerShippingAlert({
              lineUserId: row.line_user_id,
              orderNumber,
              orderId,
              trackingNumber,
              shippingProvider,
              customerName: name,
            });
          } catch (lineErr) {
            console.error("[orders-service] markShipped LINE error:", lineErr);
          }
        }
      } catch (fetchErr) {
        console.error("[orders-service] markShipped notify error:", fetchErr);
      }
    })();

    return { data: null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders-service] markShipped error:", msg);
    return { data: null, error: msg };
  }
}
