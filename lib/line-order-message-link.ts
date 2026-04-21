import { prisma } from "@/lib/prisma";

export type LinkOrderChatOutcome =
  | "linked"
  | "already_linked_you"
  | "already_linked_other"
  | "order_not_found"
  | "no_token";

export type LinkOrderChatResult = {
  outcome: LinkOrderChatOutcome;
  orderNumber?: string;
};

/** Legacy patterns: "Order #ABC123", "ออเดอร์ #…", standalone #TOKEN */
function extractOrderNumberToken(text: string): string | null {
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
 * Resolve order reference from chat: #SSB-12345, Order #XXX, digits-only order_number or DB id.
 */
export function extractOrderRefFromLineMessage(text: string): string | null {
  const t = text.trim();
  if (!t) return null;

  const ssb = t.match(/#?(SSB-\d+)/i);
  if (ssb?.[1]) return ssb[1].toUpperCase();

  if (/^\d{1,18}$/.test(t)) return t;

  return extractOrderNumberToken(text);
}

/** @deprecated use extractOrderRefFromLineMessage */
export function extractOrderNumberFromLineMessage(text: string): string | null {
  return extractOrderRefFromLineMessage(text);
}

async function findOrderByToken(token: string) {
  let order = await prisma.orders.findFirst({
    where: { order_number: token },
    select: { id: true, customer_id: true, line_user_id: true, order_number: true },
  });
  if (order) return order;

  if (/^SSB-\d+$/i.test(token)) {
    const digits = token.replace(/^SSB-/i, "");
    order = await prisma.orders.findFirst({
      where: { order_number: digits },
      select: { id: true, customer_id: true, line_user_id: true, order_number: true },
    });
    if (order) return order;
  }

  if (/^\d{1,18}$/.test(token)) {
    try {
      order = await prisma.orders.findUnique({
        where: { id: BigInt(token) },
        select: { id: true, customer_id: true, line_user_id: true, order_number: true },
      });
    } catch {
      /* invalid id */
    }
  }

  return order;
}

/**
 * Webhook: user sends order ref → save `line_user_id` on `customers` (if any) and `orders`
 * when `orders.line_user_id` is still empty.
 */
export async function linkLineUserFromOrderChatMessage(
  lineUserId: string,
  messageText: string
): Promise<LinkOrderChatResult> {
  const uid = lineUserId.trim();
  if (!uid) return { outcome: "no_token" };

  const token = extractOrderRefFromLineMessage(messageText);
  if (!token) return { outcome: "no_token" };

  const order = await findOrderByToken(token);
  if (!order) return { outcome: "order_not_found" };

  const existing = order.line_user_id?.trim() || null;
  if (existing) {
    if (existing === uid) {
      return { outcome: "already_linked_you", orderNumber: order.order_number };
    }
    return { outcome: "already_linked_other" };
  }

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

  return { outcome: "linked", orderNumber: order.order_number };
}
