import type { Metadata } from "next";
import { WholesalePageClient } from "@/components/storefront/wholesale/WholesalePageClient";

export const metadata: Metadata = {
  title: "B2B Wholesale | Smile Seed Bank",
  description:
    "Thailand's trusted B2B cannabis seed partner. Tiered wholesale pricing, local Bang Phli fulfillment, GACP documentation support.",
  alternates: { canonical: "/wholesale" },
};

export default function WholesalePage() {
  return <WholesalePageClient />;
}
