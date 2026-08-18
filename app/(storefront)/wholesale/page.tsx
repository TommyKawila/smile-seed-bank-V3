import type { Metadata } from "next";
import { WholesalePageClient } from "@/components/storefront/wholesale/WholesalePageClient";
import { DEFAULT_BULK_PRICING } from "@/lib/wholesale-bulk-pricing";
import {
  getBulkPricingConfig,
  listPublicWholesaleCatalog,
} from "@/services/wholesale-catalog-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SGF Seeds B2B Wholesale | Smile Seed Bank",
  description:
    "SGF Seeds documented bulk program — tiered B2B pricing, Bang Phli fulfillment, lot documentation support for licensed partners.",
  alternates: { canonical: "/wholesale" },
};

export default async function WholesalePage() {
  const catalog = await listPublicWholesaleCatalog().catch(() => []);
  const bulkPricing = await getBulkPricingConfig().catch(
    () => DEFAULT_BULK_PRICING
  );

  return (
    <WholesalePageClient catalog={catalog} bulkPricing={bulkPricing} />
  );
}
