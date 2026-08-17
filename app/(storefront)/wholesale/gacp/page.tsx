import type { Metadata } from "next";
import { GacpLandingClient } from "@/components/storefront/wholesale/gacp/GacpLandingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Controlled seeds & lot documents for licensed farms | Smile Seed Bank",
  description:
    "Controlled cannabis seeds for licensed Thai farms, with lot traceability documents that support the customer’s GACP file. Not a GACP certificate or DTAM document. External lab tests billed separately.",
  alternates: { canonical: "/wholesale/gacp" },
};

export default function GacpWholesalePage() {
  return <GacpLandingClient />;
}
