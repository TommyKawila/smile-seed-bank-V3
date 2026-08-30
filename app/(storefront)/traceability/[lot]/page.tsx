import type { Metadata } from "next";
import { TraceabilityLotResult } from "@/components/storefront/traceability/TraceabilityLotResult";
import { isGfTraceabilityPreview } from "@/lib/green-future-traceability";
import { lookupPublicTraceabilityLot } from "@/services/traceability-lot-service";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ lot: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lot } = await params;
  const lookup = lookupPublicTraceabilityLot(decodeURIComponent(lot));
  const label = lookup.kind === "invalid" ? "lot" : lookup.kind === "found" ? lookup.record.lot : lookup.lot;
  return {
    title: `${label} · Traceability | Smile Seed Bank`,
    robots: isGfTraceabilityPreview()
      ? { index: false, follow: false }
      : { index: false, follow: true },
    alternates: { canonical: `/traceability/${encodeURIComponent(label)}` },
  };
}

export default async function TraceabilityLotPage({ params }: PageProps) {
  const { lot } = await params;
  const lookup = lookupPublicTraceabilityLot(decodeURIComponent(lot));
  return <TraceabilityLotResult lookup={lookup} />;
}
