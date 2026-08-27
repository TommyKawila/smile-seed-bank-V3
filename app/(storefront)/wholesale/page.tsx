import type { Metadata } from "next";
import { WholesalePageClient } from "@/components/storefront/wholesale/WholesalePageClient";
import { gfWholesaleRobots } from "@/lib/green-future-approved-marketing";
import { DEFAULT_BULK_PRICING } from "@/lib/wholesale-bulk-pricing";
import {
  getBulkPricingConfig,
  listPublicWholesaleCatalog,
} from "@/services/wholesale-catalog-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SGF Seeds B2B Wholesale | Smile Seed Bank",
  description:
    "โปรแกรมเมล็ด Green Future สำหรับ B2B — รับคำขอใบเสนอราคาเท่านั้น · Green Future documented bulk programme — quotation requests only.",
  alternates: { canonical: "/wholesale" },
  robots: gfWholesaleRobots(),
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
