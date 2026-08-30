import type { Metadata } from "next";
import { WholesalePageClient } from "@/components/storefront/wholesale/WholesalePageClient";
import {
  GF_WHOLESALE_HERO_LEAD_EN,
  GF_WHOLESALE_HERO_LEAD_TH,
  GF_WHOLESALE_HERO_TITLE_EN,
  GF_WHOLESALE_HERO_TITLE_TH,
  gfWholesaleRobots,
} from "@/lib/green-future-approved-marketing";
import { DEFAULT_BULK_PRICING } from "@/lib/wholesale-bulk-pricing";
import {
  getBulkPricingConfig,
  listPublicWholesaleCatalog,
} from "@/services/wholesale-catalog-service";
import { getWholesaleHeroImageUrl } from "@/services/wholesale-hero-image";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SGF Seeds B2B Wholesale | Smile Seed Bank",
  description: `${GF_WHOLESALE_HERO_TITLE_TH} · ${GF_WHOLESALE_HERO_LEAD_TH} · ${GF_WHOLESALE_HERO_TITLE_EN}. ${GF_WHOLESALE_HERO_LEAD_EN}`,
  alternates: { canonical: "/wholesale" },
  robots: gfWholesaleRobots(),
};

export default async function WholesalePage() {
  const [catalog, bulkPricing, heroImageUrl] = await Promise.all([
    listPublicWholesaleCatalog().catch(() => []),
    getBulkPricingConfig().catch(() => DEFAULT_BULK_PRICING),
    getWholesaleHeroImageUrl(),
  ]);

  return (
    <WholesalePageClient
      catalog={catalog}
      bulkPricing={bulkPricing}
      heroImageUrl={heroImageUrl}
    />
  );
}
