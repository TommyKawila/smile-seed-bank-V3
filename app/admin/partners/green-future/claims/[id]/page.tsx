import { GfClaimDetailClient } from "@/components/admin/partners/GfClaimDetailClient";

export const metadata = {
  title: "Claim detail | Green Future",
};

export default async function GfClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GfClaimDetailClient id={id} />;
}
