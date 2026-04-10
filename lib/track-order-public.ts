/** Public-facing labels for order tracking page (no DB secrets). */

export function trackStatusLabelEn(status: string | null | undefined): string {
  const s = (status ?? "").toUpperCase();
  if (s === "PENDING") return "Pending";
  if (s === "AWAITING_VERIFICATION") return "Verifying payment";
  if (s === "PAID" || s === "COMPLETED") return "Paid";
  if (s === "SHIPPED" || s === "DELIVERED") return "Shipped";
  if (s === "VOIDED") return "Voided (stock restored)";
  if (s === "CANCELLED") return "Cancelled";
  return status || "Unknown";
}

export function trackStatusLabelTh(status: string | null | undefined): string {
  const s = (status ?? "").toUpperCase();
  if (s === "PENDING") return "รอชำระเงิน";
  if (s === "AWAITING_VERIFICATION") return "รอตรวจสอบสลิป";
  if (s === "PAID" || s === "COMPLETED") return "ชำระแล้ว / ดำเนินการ";
  if (s === "SHIPPED" || s === "DELIVERED") return "จัดส่งแล้ว";
  if (s === "VOIDED") return "ยกเลิกและคืนสินค้า";
  if (s === "CANCELLED") return "ยกเลิกแล้ว";
  return status || "ไม่ทราบสถานะ";
}
