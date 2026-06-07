import { getSiteOrigin } from "@/lib/get-url";
import { carrierLabelFromCode } from "@/lib/shipping-carriers";
import { getTrackingUrl } from "@/lib/shipping-tracking-url";

function formatTotalBaht(amount: number): string {
  return Number(amount).toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

export function adminOrderPaymentPageUrl(orderNumber: string): string {
  return `${getSiteOrigin()}/payment/${encodeURIComponent(orderNumber)}`;
}

/** Same copy as approvePayment LINE text — admin can send manually. */
export function buildAdminPaymentReceivedQuickMessage(totalAmount: number): string {
  const totalStr = formatTotalBaht(totalAmount);
  const th =
    `ได้รับยอดโอนจำนวน ${totalStr} บาท เรียบร้อยแล้วครับ พรุ่งนี้เราจะจัดส่งของให้ และจะแจ้งเลขพัสดุ (tracking) ให้ทราบอัตโนมัติ ขอบคุณครับ 🙏`;
  const en = `Payment of ${totalStr} THB received. We'll ship tomorrow and send your tracking number here. Thank you! 🙏`;
  return `${th}\n\n${en}`;
}

/** Storefront payment page — same URL as web checkout reminders. */
export function buildAdminPaymentLinkQuickMessage(
  orderNumber: string,
  totalAmount: number
): string {
  const totalStr = formatTotalBaht(totalAmount);
  const url = adminOrderPaymentPageUrl(orderNumber);
  const th =
    `ขอบคุณสำหรับคำสั่งซื้อ #${orderNumber} ยอดรวม ${totalStr} บาท\nกรุณาชำระเงินและอัปโหลดสลิปโอนเงินผ่านลิงก์ด้านล่างครับ 🌿`;
  const en =
    `Thank you for order #${orderNumber} (THB ${totalStr}).\nPlease complete payment and upload your transfer slip:`;
  return `${th}\n\n${en}\n\n${url}`;
}

/** Manual LINE resend when auto ship notify was missed (no LINE at ship time). */
export function buildAdminTrackingQuickMessage(input: {
  orderNumber: string;
  trackingNumber: string;
  shippingProvider: string;
}): string {
  const orderNum = input.orderNumber.trim();
  const tn = input.trackingNumber.trim();
  const carrier = carrierLabelFromCode(input.shippingProvider);
  const trackUrl = getTrackingUrl(input.shippingProvider, tn);

  const th = trackUrl
    ? `ออเดอร์ #${orderNum} จัดส่งแล้วครับ 🌿\nขนส่ง: ${carrier}\nเลขพัสดุ: ${tn}\n\nติดตามพัสดุได้ที่ลิงก์ด้านล่างครับ`
    : `ออเดอร์ #${orderNum} จัดส่งแล้วครับ 🌿\nขนส่ง: ${carrier}\nเลขพัสดุ: ${tn}`;

  const en = trackUrl
    ? `Order #${orderNum} has been shipped.\nCarrier: ${carrier}\nTracking: ${tn}\n\nTrack your parcel:`
    : `Order #${orderNum} has been shipped.\nCarrier: ${carrier}\nTracking: ${tn}`;

  return trackUrl ? `${th}\n\n${en}\n\n${trackUrl}` : `${th}\n\n${en}`;
}
