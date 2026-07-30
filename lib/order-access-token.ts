import "server-only";

import { getSiteOrigin } from "@/lib/get-url";
import { orderSuccessPathWithAccess } from "@/lib/order-access-url";
import {
  createReceiptDownloadQuery,
  verifyReceiptDownloadQuery,
} from "@/lib/receipt-download-token";

export { orderSuccessPathWithAccess };

/** Capability token for payment / slip / success / checkout-pending (same HMAC as receipt). */
export function createOrderAccessQuery(orderNumber: string): { t: string; e: string } {
  return createReceiptDownloadQuery(orderNumber);
}

export function verifyOrderAccessQuery(orderNumber: string, t: string, e: string): boolean {
  return verifyReceiptDownloadQuery(orderNumber, t, e);
}

export function orderAccessQueryString(orderNumber: string): string {
  const { t, e } = createOrderAccessQuery(orderNumber);
  if (!t || !e) return "";
  return new URLSearchParams({ t, e }).toString();
}

/** Absolute storefront payment URL with access token. */
export function buildOrderPaymentUrl(orderNumber: string): string {
  const base = `${getSiteOrigin()}/payment/${encodeURIComponent(orderNumber)}`;
  const q = orderAccessQueryString(orderNumber);
  return q ? `${base}?${q}` : base;
}

/** Absolute order-success URL with access token. */
export function buildOrderSuccessUrl(orderNumber: string): string {
  const base = `${getSiteOrigin()}/order-success/${encodeURIComponent(orderNumber)}`;
  const q = orderAccessQueryString(orderNumber);
  return q ? `${base}?${q}` : base;
}
