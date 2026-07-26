import type { Metadata } from "next";
import { GrowerToolsHubClient } from "@/components/storefront/tools/GrowerToolsHubClient";
import { getGrowerToolsAiFlags } from "@/services/setting-service";

export const metadata: Metadata = {
  title: "AI ช่วยปลูก | Grower Tools | Smile Seed Bank",
  description:
    "เครื่องมือ AI สำหรับมือปลูก — ผสมดินซุปเปอร์ซอย, คำนวณ VPD, แนะนำปุ๋ย, วิเคราะห์อาการพืช",
  alternates: { canonical: "/tools" },
};

export default async function GrowerToolsPage() {
  const aiFlags = await getGrowerToolsAiFlags();
  return <GrowerToolsHubClient aiFlags={aiFlags} />;
}
