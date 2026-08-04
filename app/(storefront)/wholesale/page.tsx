import type { Metadata } from "next";
import { WholesalePageClient } from "@/components/storefront/wholesale/WholesalePageClient";
import {
  DEFAULT_WHOLESALE_TIERS,
  GACP_FEE_EUR,
  GACP_FEE_THB,
  WHOLESALE_PUBLIC_MOQ,
} from "@/lib/wholesale-public-pricing";
import {
  getWholesaleSettings,
  listPublicWholesaleCatalog,
} from "@/services/wholesale-catalog-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "B2B Wholesale | Smile Seed Bank",
  description:
    "Thailand's trusted B2B cannabis seed partner. Tiered wholesale pricing, local Bang Phli fulfillment, GACP documentation support.",
  alternates: { canonical: "/wholesale" },
};

export default async function WholesalePage() {
  const catalog = await listPublicWholesaleCatalog().catch(() => []);
  const settings = await getWholesaleSettings().catch(() => null);

  return (
    <WholesalePageClient
      catalog={catalog}
      tiers={settings?.tiers ?? DEFAULT_WHOLESALE_TIERS}
      moq={settings?.moq ?? WHOLESALE_PUBLIC_MOQ}
      gacpFeeThb={settings?.gacpFeeThb ?? GACP_FEE_THB}
      gacpFeeEur={settings?.gacpFeeEur ?? GACP_FEE_EUR}
    />
  );
}
