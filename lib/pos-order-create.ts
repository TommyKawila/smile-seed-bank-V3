export type PosOrderStatus = "PENDING" | "PENDING_INFO" | "COMPLETED" | "CANCELLED";

export function parsePosCustomerProfileId(id: string | null | undefined): number | null {
  const raw = String(id ?? "").trim();
  if (!raw) return null;
  const numeric = raw.startsWith("pos-") ? raw.slice(4) : raw;
  if (!/^\d+$/.test(numeric)) return null;
  const parsed = Number(numeric);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function validatePosPointRedemption(input: {
  status: PosOrderStatus;
  pointsRedeemed: number;
  pointsDiscountAmount: number;
  customerProfileId: number | null | undefined;
}): string | null {
  const pointsRedeemed = Math.trunc(Number(input.pointsRedeemed) || 0);
  const pointsDiscountAmount = Math.trunc(Number(input.pointsDiscountAmount) || 0);
  if (pointsRedeemed <= 0 && pointsDiscountAmount <= 0) return null;
  if (input.status !== "COMPLETED") return "Points can only be redeemed on completed POS orders";
  if (!input.customerProfileId) return "Points redemption requires a POS customer profile";
  if (pointsRedeemed !== pointsDiscountAmount) {
    return "Points discount must match redeemed points";
  }
  return null;
}
