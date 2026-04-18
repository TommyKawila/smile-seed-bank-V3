import { prisma } from "@/lib/prisma";

/** Parse user text e.g. "Order #ABC123", "order#ABC123", "ออเดอร์ #ABC123". */
export function extractOrderNumberFromLineMessage(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const patterns = [
    /Order\s*#?\s*([A-Za-z0-9-]+)/i,
    /ออเดอร์\s*#?\s*([A-Za-z0-9-]+)/i,
    /(?:^|\s)#([A-Za-z0-9-]{4,})(?:\s|$)/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/**
 * Webhook: user sends order ref → save `line_user_id` on `customers` (profile) and `orders`.
 */
export async function linkLineUserFromOrderChatMessage(
  lineUserId: string,
  messageText: string
): Promise<{ ok: boolean; orderNumber?: string; reason?: string }> {
  const uid = lineUserId.trim();
  if (!uid) return { ok: false, reason: "no_line_user" };

  const orderNum = extractOrderNumberFromLineMessage(messageText);
  if (!orderNum) return { ok: false, reason: "no_order_token" };

  const order = await prisma.orders.findFirst({
    where: { order_number: orderNum },
    select: { id: true, customer_id: true, line_user_id: true },
  });
  if (!order) return { ok: false, reason: "order_not_found" };

  await prisma.$transaction(async (tx) => {
    if (order.customer_id) {
      await tx.customers.update({
        where: { id: order.customer_id },
        data: {
          line_user_id: uid,
          is_linked: true,
          last_interaction_at: new Date(),
        },
      });
    }
    await tx.orders.update({
      where: { id: order.id },
      data: { line_user_id: uid },
    });
  });

  return { ok: true, orderNumber: orderNum };
}
