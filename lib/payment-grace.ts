export const PAYMENT_AUTO_CANCEL_MS = 24 * 60 * 60 * 1000;

export const PAYMENT_GRACE_HOUR_OPTIONS = [48, 72, 168] as const;
export type PaymentGraceHours = (typeof PAYMENT_GRACE_HOUR_OPTIONS)[number];

export function isOrderOnPaymentGrace(
  now: Date,
  paymentGraceUntil: Date | null | undefined
): boolean {
  if (!paymentGraceUntil) return false;
  return paymentGraceUntil.getTime() > now.getTime();
}

export function effectivePaymentCancelDeadline(
  createdAt: Date,
  paymentGraceUntil: Date | null | undefined
): Date {
  const base = createdAt.getTime() + PAYMENT_AUTO_CANCEL_MS;
  const grace = paymentGraceUntil?.getTime() ?? 0;
  return new Date(Math.max(base, grace));
}

export function shouldAutoCancelUnpaidOrder(
  createdAt: Date | null,
  paymentGraceUntil: Date | null | undefined,
  asOf: Date
): boolean {
  if (!createdAt) return false;
  if (isOrderOnPaymentGrace(asOf, paymentGraceUntil)) return false;
  return (
    asOf.getTime() >=
    effectivePaymentCancelDeadline(createdAt, paymentGraceUntil).getTime()
  );
}
