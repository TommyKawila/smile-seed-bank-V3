import { OrderStatusClient } from "@/components/storefront/OrderStatusClient";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = id?.trim() ?? "";
  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-zinc-50 to-white px-4 py-10 pb-16">
      <OrderStatusClient token={token} />
    </div>
  );
}
