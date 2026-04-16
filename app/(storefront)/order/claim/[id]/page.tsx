import { OrderClaimClient } from "@/components/storefront/OrderClaimClient";

export default async function OrderClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = id?.trim() ?? "";
  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-zinc-50 to-white px-4 py-10 pb-16">
      <OrderClaimClient token={token} />
    </div>
  );
}
