import { loadAdminOrderDetail } from "@/lib/load-admin-order-detail";
import { getSiteOrigin } from "@/lib/get-url";
import {
  generateOrderShippedFlexMessage,
  generatePaymentConfirmedFlexMessage,
  type OrderFlexMessageInput,
} from "@/lib/line-flex";
import { createReceiptDownloadQuery } from "@/lib/receipt-download-token";
import { getTrackingUrl } from "@/lib/shipping-tracking-url";
import { pushFlexMessageToLineUser } from "@/services/line-messaging";

const CARRIER_LABELS: Record<string, string> = {
  THAILAND_POST: "ไปรษณีย์ไทย",
  KERRY_EXPRESS: "Kerry Express",
  FLASH_EXPRESS: "Flash Express",
  "J&T_EXPRESS": "J&T Express",
};

function receiptDownloadUriForOrder(orderNumber: string): string | null {
  const origin = getSiteOrigin();
  const on = encodeURIComponent(orderNumber);
  const q = createReceiptDownloadQuery(orderNumber);
  if (q.t && q.e) {
    return `${origin}/api/storefront/orders/${on}/receipt?t=${encodeURIComponent(q.t)}&e=${encodeURIComponent(q.e)}`;
  }
  return `${origin}/api/storefront/orders/${on}/receipt`;
}

function detailToFlexInput(detail: NonNullable<Awaited<ReturnType<typeof loadAdminOrderDetail>>>): OrderFlexMessageInput {
  return {
    orderNumber: detail.orderNumber,
    customerName: detail.customerName,
    customerPhone: detail.customerPhone,
    shippingAddress: detail.shippingAddress,
    receiptDownloadUri: receiptDownloadUriForOrder(detail.orderNumber),
    totalAmount: detail.totalAmount,
    shippingFee: detail.shippingFee,
    discountAmount: detail.discountAmount,
    items: detail.items.map((i) => ({
      productName: i.productName,
      unitLabel: i.unitLabel,
      breederName: i.breederName,
      quantity: i.quantity,
      totalPrice: i.totalPrice,
    })),
  };
}

/**
 * Automated OA Flex: payment confirmed or shipped. Only sends when `orders.line_user_id` is set.
 */
export async function sendLineFlexNotification(
  orderId: number,
  kind: "PAYMENT_CONFIRMED" | "ORDER_SHIPPED",
  ship?: { trackingNumber: string; shippingProvider: string }
): Promise<void> {
  try {
    console.log("LINE_DEBUG: Fetching order:", orderId);
    const detail = await loadAdminOrderDetail(orderId);
    if (!detail) {
      console.warn(`[LINE flex notify] orderId=${orderId} kind=${kind} skipped: order not found`);
      return;
    }

    console.log("LINE_DEBUG: Order Line ID:", detail.lineUserId ?? null);
    console.log("LINE_DEBUG: Token Length:", process.env.LINE_CHANNEL_ACCESS_TOKEN?.length || 0);

    const lineUid = detail.lineUserId?.trim();
    if (!lineUid) {
      console.warn(`[LINE flex notify] orderId=${orderId} kind=${kind} skipped: no line_user_id`);
      return;
    }

    const origin = getSiteOrigin();
    const detailUrl = `${origin}/order-success/${encodeURIComponent(detail.orderNumber)}`;

    if (kind === "PAYMENT_CONFIRMED") {
      const flex = generatePaymentConfirmedFlexMessage(detailToFlexInput(detail));
      const result = await pushFlexMessageToLineUser(lineUid, flex);
      if (result.success) {
        console.log(`[LINE flex notify] orderId=${orderId} kind=PAYMENT_CONFIRMED ok`);
      } else {
        console.error(`[LINE flex notify] orderId=${orderId} kind=PAYMENT_CONFIRMED fail:`, result.error);
      }
      return;
    }

    if (kind === "ORDER_SHIPPED") {
      if (!ship?.trackingNumber?.trim() || !ship.shippingProvider?.trim()) {
        console.warn(`[LINE flex notify] orderId=${orderId} kind=ORDER_SHIPPED skipped: missing tracking/provider`);
        return;
      }
      const tn = ship.trackingNumber.trim();
      const prov = ship.shippingProvider.trim();
      const trackingUrl = getTrackingUrl(prov, tn);
      const label = CARRIER_LABELS[prov] ?? prov;
      const flex = generateOrderShippedFlexMessage({
        orderNumber: detail.orderNumber,
        trackingNumber: tn,
        shippingProviderLabel: label,
        detailUrl,
        trackingUrl,
      });
      const result = await pushFlexMessageToLineUser(lineUid, flex);
      if (result.success) {
        console.log(`[LINE flex notify] orderId=${orderId} kind=ORDER_SHIPPED ok`);
      } else {
        console.error(`[LINE flex notify] orderId=${orderId} kind=ORDER_SHIPPED fail:`, result.error);
      }
    }
  } catch (err) {
    console.error(`[LINE flex notify] orderId=${orderId} kind=${kind} error:`, err);
  }
}
