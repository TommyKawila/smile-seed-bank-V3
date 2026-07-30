import "server-only";

import { getSql } from "@/lib/db";
import { verifyOrderAccessQuery } from "@/lib/order-access-token";

/** True when HMAC access token is valid or session user owns the order. */
export async function orderAllowsAccess(
  orderNumber: string,
  opts: { userId?: string | null; t?: string | null; e?: string | null }
): Promise<boolean> {
  const no = orderNumber.trim();
  if (!no) return false;
  const t = opts.t?.trim() ?? "";
  const e = opts.e?.trim() ?? "";
  if (t && e && verifyOrderAccessQuery(no, t, e)) return true;
  const userId = opts.userId?.trim() ?? "";
  if (!userId) return false;
  try {
    const sql = getSql();
    const rows = await sql<{ customer_id: string | null }[]>`
      SELECT customer_id
      FROM orders
      WHERE order_number = ${no}
      LIMIT 1
    `;
    const cid = rows[0]?.customer_id;
    return cid != null && cid === userId;
  } catch {
    return false;
  }
}
