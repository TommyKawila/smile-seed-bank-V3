import type { Metadata } from "next";
import { withTimeout } from "@/lib/timeout";
import { seedsHubFacetFallback, shouldShowSeedsHub } from "@/lib/seeds-hub";
import { SeedsHubClient } from "@/components/storefront/SeedsHubClient";
import {
  getSeedsHubBreedersOnly,
  getSeedsHubPayload,
} from "@/services/seeds-hub-service";
import ShopPage from "../shop/page";

export const metadata: Metadata = {
  title: "All Seeds | Smile Seed Bank",
  description: "Choose a breeder, flowering type, or genetics — then browse the seed vault.",
  alternates: { canonical: "/seeds" },
};

type Props = {
  params?: Promise<{ breederSlug?: string | string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SeedsIndexPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : undefined;

  if (shouldShowSeedsHub(sp)) {
    const facets = seedsHubFacetFallback();
    const emptyFallback = {
      breeders: [] as Awaited<ReturnType<typeof getSeedsHubBreedersOnly>>,
      flowering: facets.flowering,
      genetics: facets.genetics,
    };

    let payload = await withTimeout(
      getSeedsHubPayload().catch(() => emptyFallback),
      2500,
      emptyFallback
    );

    // If full payload timed out empty, still try a light breeder-only fetch.
    if (payload.breeders.length === 0) {
      const breeders = await withTimeout(getSeedsHubBreedersOnly(), 2000, []);
      payload = { ...payload, breeders };
    }

    return <SeedsHubClient payload={payload} />;
  }

  return ShopPage(props);
}
