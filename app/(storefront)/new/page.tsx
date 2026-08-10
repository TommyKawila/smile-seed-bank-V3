import type { Metadata } from "next";
import { withTimeout } from "@/lib/timeout";
import { NewSeedsLandingClient } from "@/components/storefront/NewSeedsLandingClient";
import { getStorefrontNewSeedsBreederBoxes } from "@/services/new-seeds-breeder-banner-service";
import { getPinnedNewSeedsStorefrontProductsByBreederSlug } from "@/services/product-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Seeds | Smile Seed Bank",
  description: "Curated new seed drops by breeder — pinned New Arrivals from Smile Seed Bank.",
  alternates: { canonical: "/new" },
};

type Props = {
  searchParams?: Promise<{ breeder?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewSeedsPage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : undefined;
  const breederSlug = firstParam(sp?.breeder)?.trim() || null;

  if (breederSlug) {
    const result = await withTimeout(
      getPinnedNewSeedsStorefrontProductsByBreederSlug(breederSlug, 60),
      4000,
      {
        data: { products: [], breederName: null, breederLogoUrl: null },
        error: null,
      }
    );
    return (
      <NewSeedsLandingClient
        boxes={[]}
        breederSlug={breederSlug}
        breederName={result.data?.breederName ?? null}
        breederLogoUrl={result.data?.breederLogoUrl ?? null}
        products={result.data?.products ?? []}
      />
    );
  }

  const boxes = await withTimeout(getStorefrontNewSeedsBreederBoxes(), 8000, []);
  return (
    <NewSeedsLandingClient
      boxes={boxes}
      breederSlug={null}
      breederName={null}
      breederLogoUrl={null}
      products={[]}
    />
  );
}
