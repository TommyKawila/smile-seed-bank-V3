import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QUOTATION_SHIPPING_FREE_THRESHOLD } from "@/lib/order-financials";
import type { CustomerOrderSummary } from "@/services/customer-service";

function formatBaht(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function statusLabel(status: string, paymentStatus: string): string {
  const key = status === "PENDING" && paymentStatus === "paid" ? "PAID" : status;
  const labels: Record<string, string> = {
    PAID: "Paid",
    SHIPPED: "Shipped",
    COMPLETED: "Completed",
    DELIVERED: "Delivered",
    PENDING: "Pending",
    CANCELLED: "Cancelled",
  };
  return labels[key] ?? key.replace(/_/g, " ");
}

function statusClass(status: string, paymentStatus: string): string {
  const key = status === "PENDING" && paymentStatus === "paid" ? "PAID" : status;
  if (key === "PAID" || key === "COMPLETED" || key === "DELIVERED") {
    return "border-primary/15 bg-primary/10 text-primary";
  }
  if (key === "SHIPPED") return "border-secondary/80 bg-secondary/60 text-secondary-foreground";
  if (key === "CANCELLED") return "border-zinc-200 bg-zinc-100 text-zinc-500";
  return "border-zinc-200 bg-white text-zinc-600";
}

export function OrderHistoryList({ orders }: { orders: CustomerOrderSummary[] }) {
  return (
    <Card className="min-h-[360px] border-zinc-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-zinc-900">Order History</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 text-center text-sm text-zinc-500">
            Your orders will appear here after checkout.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const freeShippingEarned =
                order.shippingFee === 0 || order.totalAmount >= QUOTATION_SHIPPING_FREE_THRESHOLD;
              const remaining = Math.max(0, QUOTATION_SHIPPING_FREE_THRESHOLD - order.totalAmount);

              return (
                <article
                  key={order.id}
                  className="min-h-[128px] rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                        {order.createdAt
                          ? new Intl.DateTimeFormat("th-TH", {
                              dateStyle: "medium",
                            }).format(new Date(order.createdAt))
                          : "Order"}
                      </p>
                      <h3 className="mt-1 font-semibold text-zinc-900">{order.orderNumber}</h3>
                      {order.trackingNumber ? (
                        <p className="mt-1 text-xs text-zinc-500">
                          Tracking: {order.shippingProvider ?? "Carrier"} / {order.trackingNumber}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-zinc-500">Tracking will appear after shipping.</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge className={statusClass(order.status, order.paymentStatus)} variant="outline">
                        {statusLabel(order.status, order.paymentStatus)}
                      </Badge>
                      <span className="font-semibold tabular-nums text-zinc-900">
                        {formatBaht(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                    {freeShippingEarned ? (
                      <span className="font-medium text-primary">Free Shipping unlocked for this order.</span>
                    ) : (
                      <span>
                        Add {formatBaht(remaining)} more next time to unlock Free Shipping at{" "}
                        {formatBaht(QUOTATION_SHIPPING_FREE_THRESHOLD)}.
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
