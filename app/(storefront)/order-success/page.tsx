import { redirect } from "next/navigation";

/** Legacy `?order=` URLs → canonical `/order-success/[orderId]`. */
export default function OrderSuccessLegacyPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams.order;
  const order = typeof raw === "string" ? raw.trim() : "";
  if (order) {
    redirect(`/order-success/${encodeURIComponent(order)}`);
  }
  redirect("/shop");
}
