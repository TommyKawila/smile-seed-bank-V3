import { redirect } from "next/navigation";

/** Legacy `?order=` URLs → canonical `/order-success/[orderId]`. */
export default async function OrderSuccessLegacyPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const raw = sp.order;
  const order = typeof raw === "string" ? raw.trim() : "";
  if (order) {
    redirect(`/order-success/${encodeURIComponent(order)}`);
  }
  redirect("/shop");
}
