import type { Metadata } from "next";
import { withTimeout } from "@/lib/timeout";
import { ClearanceLandingClient } from "@/components/storefront/ClearanceLandingClient";
import { getStorefrontClearanceBreederBoxes } from "@/services/clearance-breeder-banner-service";
import { getClearanceStorefrontProductsByBreederSlug } from "@/services/product-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clearance | Smile Seed Bank",
  description: "Clearance sale by participating breeders — fixed percent off by group.",
  // Always canonical /clearance — never per ?discount= / ?breeder= (8_SEO_SCHEMA: no query in sitemap).
  alternates: { canonical: "/clearance" },
};

type Props = {
  searchParams?: Promise<{ breeder?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ClearancePage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : undefined;
  const breederSlug = firstParam(sp?.breeder)?.trim() || null;

  if (breederSlug) {
    const result = await withTimeout(
      getClearanceStorefrontProductsByBreederSlug(breederSlug),
      4000,
      {
        data: { products: [], breederName: null, breederLogoUrl: null },
        error: null,
      }
    );
    return (
      <ClearanceLandingClient
        boxes={[]}
        breederSlug={breederSlug}
        breederName={result.data?.breederName ?? null}
        breederLogoUrl={result.data?.breederLogoUrl ?? null}
        products={result.data?.products ?? []}
      />
    );
  }

  // Primary page content — do not use 2s empty fallback (cold count query often >2s).
  const boxes = await withTimeout(getStorefrontClearanceBreederBoxes(), 8000, []);
  return (
    <ClearanceLandingClient
      boxes={boxes}
      breederSlug={null}
      breederName={null}
      breederLogoUrl={null}
      products={[]}
    />
  );
}
