import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Invalidate customer profile + order-success page after admin changes order status. */
export async function revalidateAfterOrderStatusChange(
  orderId: number,
  orderNumberHint?: string | null
): Promise<void> {
  revalidatePath("/profile");
  revalidatePath("/account");
  const orderNumber =
    orderNumberHint?.trim() ||
    (
      await prisma.orders.findUnique({
        where: { id: BigInt(orderId) },
        select: { order_number: true },
      })
    )?.order_number;
  if (orderNumber) {
    revalidatePath(`/order-success/${orderNumber}`);
  }
}
