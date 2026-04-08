/** Public-facing labels for order tracking page (no DB secrets). */

export function trackStatusLabelEn(status: string | null | undefined): string {
  const s = (status ?? "").toUpperCase();
  if (s === "PENDING") return "Pending";
  if (s === "PAID" || s === "COMPLETED") return "Paid";
  if (s === "SHIPPED" || s === "DELIVERED") return "Shipped";
  if (s === "CANCELLED" || s === "VOIDED") return "Cancelled";
  return status || "Unknown";
}

export function trackStatusLabelTh(status: string | null | undefined): string {
  const s = (status ?? "").toUpperCase();
  if (s === "PENDING") return "รอชำระเงิน";
  if (s === "PAID" || s === "COMPLETED") return "ชำระแล้ว / ดำเนินการ";
  if (s === "SHIPPED" || s === "DELIVERED") return "จัดส่งแล้ว";
  if (s === "CANCELLED" || s === "VOIDED") return "ยกเลิก";
  return status || "ไม่ทราบสถานะ";
}
