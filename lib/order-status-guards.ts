export const SLIP_UPLOAD_ELIGIBLE_STATUSES = [
  "PENDING",
  "PENDING_PAYMENT",
  "PENDING_INFO",
] as const;

export const PAYMENT_APPROVAL_ELIGIBLE_STATUSES = [
  "AWAITING_VERIFICATION",
] as const;

function normalizedStatus(status: string | null | undefined): string {
  return (status ?? "").trim().toUpperCase();
}

function isPaid(paymentStatus: string | null | undefined): boolean {
  return (paymentStatus ?? "").trim().toLowerCase() === "paid";
}

export function isSlipUploadEligibleOrder(
  status: string | null | undefined,
  paymentStatus: string | null | undefined
): boolean {
  return (
    (SLIP_UPLOAD_ELIGIBLE_STATUSES as readonly string[]).includes(normalizedStatus(status)) &&
    !isPaid(paymentStatus)
  );
}

export function isPaymentApprovalEligibleOrder(
  status: string | null | undefined,
  paymentStatus: string | null | undefined
): boolean {
  return (
    (PAYMENT_APPROVAL_ELIGIBLE_STATUSES as readonly string[]).includes(normalizedStatus(status)) &&
    !isPaid(paymentStatus)
  );
}
