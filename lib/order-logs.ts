import { prisma } from "@/lib/prisma";

export type OrderLogAction =
  | "MESSAGE_SENT"
  | "STATUS_UPDATED"
  | "AUTO_LINE_FLEX"
  | "AUTO_LINE_TEXT"
  | "AUTO_LINE_SKIPPED"
  | "MOBILE_DASH"
  | "PAYMENT_REMINDER"
  | "PAYMENT_AUTO_CANCEL";

export async function createOrderLog(input: {
  orderId: number;
  action: OrderLogAction | string;
  messageContent: string | null;
}): Promise<void> {
  try {
    await prisma.order_logs.create({
      data: {
        order_id: BigInt(input.orderId),
        action: String(input.action).slice(0, 64),
        message_content: input.messageContent,
      },
    });
  } catch (e) {
    console.error("[order_logs] create failed", e);
  }
}

export async function listOrderLogs(orderId: number): Promise<
  { id: string; orderId: number; action: string; messageContent: string | null; createdAt: string }[]
> {
  const rows = await prisma.order_logs.findMany({
    where: { order_id: BigInt(orderId) },
    orderBy: { created_at: "desc" },
    take: 200,
  });
  return rows.map((r) => ({
    id: String(r.id),
    orderId: Number(r.order_id),
    action: r.action,
    messageContent: r.message_content,
    createdAt: r.created_at.toISOString(),
  }));
}
