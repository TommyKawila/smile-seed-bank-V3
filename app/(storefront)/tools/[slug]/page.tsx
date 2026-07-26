import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGrowerTool } from "@/lib/grower-tools";
import { getGrowerToolsAiFlags } from "@/services/setting-service";
import { SoilMixerClient } from "@/components/storefront/tools/SoilMixerClient";
import { VpdCalculatorClient } from "@/components/storefront/tools/VpdCalculatorClient";
import { FertilizerAdvisorClient } from "@/components/storefront/tools/FertilizerAdvisorClient";
import { PlantDoctorClient } from "@/components/storefront/tools/PlantDoctorClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getGrowerTool(slug);
  if (!tool) return { title: "Grow Tool" };
  return {
    title: `${tool.labelEn} | Grower Tools | Smile Seed Bank`,
    description: tool.blurbEn,
    alternates: { canonical: `/tools/${slug}` },
  };
}

export default async function GrowerToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getGrowerTool(slug);
  if (!tool) notFound();

  const aiFlags = await getGrowerToolsAiFlags();

  switch (tool.slug) {
    case "soil-mixer":
      return <SoilMixerClient aiEnabled={aiFlags.soilMixer} />;
    case "vpd-calculator":
      return <VpdCalculatorClient />;
    case "fertilizer":
      return <FertilizerAdvisorClient aiEnabled={aiFlags.fertilizer} />;
    case "plant-doctor":
      return <PlantDoctorClient aiEnabled={aiFlags.plantDoctor} />;
    default:
      notFound();
  }
}
