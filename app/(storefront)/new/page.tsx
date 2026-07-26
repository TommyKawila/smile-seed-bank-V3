import type { Metadata } from "next";
import { withTimeout } from "@/lib/timeout";
import { NewSeedsLandingClient } from "@/components/storefront/NewSeedsLandingClient";
import { getPinnedNewSeedsStorefrontProducts } from "@/services/product-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Seeds | Smile Seed Bank",
  description: "Curated new seed drops — pinned New Arrivals from Smile Seed Bank.",
  alternates: { canonical: "/new" },
};

export default async function NewSeedsPage() {
  const result = await withTimeout(
    getPinnedNewSeedsStorefrontProducts(60),
    2500,
    { data: [], error: null }
  );
  return <NewSeedsLandingClient products={result.data ?? []} />;
}
