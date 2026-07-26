import type { Metadata } from "next";
import { withTimeout } from "@/lib/timeout";
import { ClearanceLandingClient } from "@/components/storefront/ClearanceLandingClient";
import { getStorefrontClearanceBreederBoxes } from "@/services/clearance-breeder-banner-service";
import { getClearanceStorefrontProductsByBreederSlug } from "@/services/product-service";
import { CLEARANCE_DISCOUNT_PERCENT } from "@/lib/clearance";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Clearance −${CLEARANCE_DISCOUNT_PERCENT}% | Smile Seed Bank`,
  description: `Clearance sale — fixed ${CLEARANCE_DISCOUNT_PERCENT}% off by participating breeders.`,
  alternates: { canonical: "/clearance" },
};

type Props = {
  searchParams?: { breeder?: string };
};

export default async function ClearancePage({ searchParams }: Props) {
  const breederSlug = searchParams?.breeder?.trim() || null;

  if (breederSlug) {
    const result = await withTimeout(
      getClearanceStorefrontProductsByBreederSlug(breederSlug),
      2000,
      { data: { products: [], breederName: null }, error: null }
    );
    return (
      <ClearanceLandingClient
        boxes={[]}
        breederSlug={breederSlug}
        breederName={result.data?.breederName ?? null}
        products={result.data?.products ?? []}
      />
    );
  }

  const boxes = await withTimeout(getStorefrontClearanceBreederBoxes(), 2000, []);
  return (
    <ClearanceLandingClient
      boxes={boxes}
      breederSlug={null}
      breederName={null}
      products={[]}
    />
  );
}
