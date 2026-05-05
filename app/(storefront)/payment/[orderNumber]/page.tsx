import { PaymentPageClient } from "@/components/storefront/payment/PaymentPageClient";
import { fetchCheckoutPaymentSettings } from "@/lib/payment-settings-public";
import { getOrderByNumber } from "@/lib/services/order-service";

export const dynamic = "force-dynamic";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber: raw } = await params;
  let orderNumber = typeof raw === "string" ? raw.trim() : "";
  try {
    orderNumber = decodeURIComponent(orderNumber);
  } catch {
    /* keep raw */
  }

  const [{ settings, error: paymentSettingsError, lineId }, orderRes] = await Promise.all([
    fetchCheckoutPaymentSettings(),
    orderNumber.length >= 4 ? getOrderByNumber(orderNumber) : Promise.resolve({ data: null, error: "Invalid" }),
  ]);

  const order = orderRes.data;
  const orderUnavailable = Boolean(orderRes.error) || !order;

  return (
    <PaymentPageClient
      orderNumber={orderNumber}
      paymentSettings={settings}
      paymentSettingsError={paymentSettingsError}
      lineId={lineId}
      initialOrder={
        order
          ? {
              total_amount: Number(order.total_amount),
              payment_method: order.payment_method,
            }
          : null
      }
      orderUnavailable={orderUnavailable}
    />
  );
}
