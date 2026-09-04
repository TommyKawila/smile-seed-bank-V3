import { notFound } from "next/navigation";
import { VisualPreview } from "@/components/mockup/VisualPreview";
import { getMockupById } from "@/services/mockupService";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = await getMockupById(id).catch(() => null);
  return {
    title: data?.strainName
      ? `${data.strainName} · Label Mockup`
      : "Label Mockup",
  };
}

export default async function ShareMockupPage({ params }: Props) {
  const { id } = await params;
  const data = await getMockupById(id);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-sm space-y-4">
        <header className="space-y-1 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Shared label mockup
          </p>
          <h1 className="text-lg font-semibold text-slate-900">
            {data.strainName || "Untitled strain"}
          </h1>
          <p className="text-sm text-slate-500">{data.species}</p>
        </header>
        <VisualPreview data={data} interactive={false} />
      </div>
    </main>
  );
}
