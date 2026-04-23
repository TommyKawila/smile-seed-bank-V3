import type { Prisma } from "@prisma/client";

/** Prisma filter: business “payment confirmed / revenue” (includes legacy `PAID` + PENDING+paid). */
export const prismaWhereOrderPaymentConfirmed: Prisma.ordersWhereInput = {
  OR: [
    { status: { in: ["PAID", "SHIPPED", "DELIVERED", "COMPLETED"] } },
    { status: { in: ["PENDING", "PROCESSING"] }, payment_status: "paid" },
  ],
};

/**
 * "Payment received" in DB: legacy `status = PAID` or `PENDING`/`PROCESSING` + `payment_status = paid` (fulfillment queue).
 */
export function orderIsPaymentReceived(
  status: string | null | undefined,
  paymentStatus: string | null | undefined
): boolean {
  const s = (status ?? "").toUpperCase();
  if ((s === "PENDING" || s === "PROCESSING") && paymentStatus === "paid")
    return true;
  if (["PAID", "SHIPPED", "DELIVERED", "COMPLETED"].includes(s)) return true;
  return false;
}

export function orderIsReadyToShip(
  status: string | null | undefined,
  paymentStatus: string | null | undefined
): boolean {
  const s = (status ?? "").toUpperCase();
  if (s === "PAID") return true;
  return (
    (s === "PENDING" || s === "PROCESSING") && paymentStatus === "paid"
  );
}

export function isReceiptEligibleStatus(
  status: string,
  paymentStatus?: string | null
): boolean {
  const s = (status ?? "").toUpperCase();
  if (["PAID", "COMPLETED", "SHIPPED", "DELIVERED"].includes(s)) return true;
  if ((s === "PENDING" || s === "PROCESSING") && paymentStatus === "paid")
    return true;
  return false;
}
