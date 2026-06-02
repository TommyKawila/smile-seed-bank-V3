import { redirect } from "next/navigation";

/** Legacy `?order=` URLs → canonical `/order-success/[orderId]`. */
type SearchParams = Record<string, string | string[] | undefined>;

export default async function OrderSuccessLegacyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const raw = resolvedSearchParams.order;
  const order = typeof raw === "string" ? raw.trim() : "";
  if (order) {
    redirect(`/order-success/${encodeURIComponent(order)}`);
  }
  redirect("/shop");
}
