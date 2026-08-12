import type { Metadata } from "next";
import { GacpLandingClient } from "@/components/storefront/wholesale/gacp/GacpLandingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GACP Seeds for Licensed Farms | Smile Seed Bank",
  description:
    "GACP-compliant cannabis seeds for licensed cultivators and export-grade farms in Thailand. Traceable genetics, COA, and phytosanitary documentation.",
  alternates: { canonical: "/wholesale/gacp" },
};

export default function GacpWholesalePage() {
  return <GacpLandingClient />;
}
