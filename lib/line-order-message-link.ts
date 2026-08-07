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
  // Resolve by public order_number only — never by sequential DB PK (IDOR).
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

  return order;
}

/**
 * Webhook: user sends order ref → save `line_user_id` on `orders` when empty.
 * Never bind by DB id. Never overwrite a different customers.line_user_id.
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

  const linked = await prisma.$transaction(async (tx) => {
    const claimed = await tx.orders.updateMany({
      where: {
        id: order.id,
        OR: [{ line_user_id: null }, { line_user_id: "" }],
      },
      data: { line_user_id: uid },
    });
    if (claimed.count !== 1) {
      const again = await tx.orders.findUnique({
        where: { id: order.id },
        select: { line_user_id: true, order_number: true },
      });
      const againUid = again?.line_user_id?.trim() || null;
      if (againUid === uid) {
        return "already_linked_you" as const;
      }
      return "already_linked_other" as const;
    }

    if (order.customer_id) {
      // Only set customer LINE when unset — never steal an existing profile link.
      await tx.customers.updateMany({
        where: {
          id: order.customer_id,
          OR: [{ line_user_id: null }, { line_user_id: "" }],
        },
        data: {
          line_user_id: uid,
          is_linked: true,
          last_interaction_at: new Date(),
        },
      });
    }

    return "linked" as const;
  });

  if (linked === "linked") {
    return { outcome: "linked", orderNumber: order.order_number };
  }
  if (linked === "already_linked_you") {
    return { outcome: "already_linked_you", orderNumber: order.order_number };
  }
  return { outcome: "already_linked_other" };
}
