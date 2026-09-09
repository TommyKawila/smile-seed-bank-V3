import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorageLogShareView } from "@/components/share/storage-log/StorageLogShareView";
import { getCabinetStoragePublicView } from "@/services/cabinet-storage-log-service";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Seed storage log · Smile Seed Bank",
    robots: { index: false, follow: false },
  };
}

export default async function ShareStorageLogPage({ params }: Props) {
  const { token } = await params;
  const data = await getCabinetStoragePublicView(token);
  if (!data) notFound();
  return <StorageLogShareView data={data} />;
}
