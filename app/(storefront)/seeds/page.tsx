import type { Metadata } from "next";
import { withTimeout } from "@/lib/timeout";
import { seedsHubFacetFallback, shouldShowSeedsHub } from "@/lib/seeds-hub";
import { SeedsHubClient } from "@/components/storefront/SeedsHubClient";
import {
  getSeedsHubBreedersOnly,
  getSeedsHubPayload,
} from "@/services/seeds-hub-service";
import { renderShopCatalog } from "@/app/(storefront)/shop/render-shop-catalog";

export const metadata: Metadata = {
  title: "All Seeds | Smile Seed Bank",
  description: "Choose a breeder, flowering type, or genetics — then browse the seed vault.",
  alternates: { canonical: "/seeds" },
};

type SeedsIndexPageProps = {
  params?: Promise<{ breederSlug?: string | string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SeedsIndexPage(props: SeedsIndexPageProps) {
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

    if (payload.breeders.length === 0) {
      const breeders = await withTimeout(getSeedsHubBreedersOnly(), 2000, []);
      payload = { ...payload, breeders };
    }

    return <SeedsHubClient payload={payload} />;
  }

  const resolvedParams = props.params ? await props.params : undefined;
  return renderShopCatalog({
    breederSlugFromRoute: firstParam(resolvedParams?.breederSlug),
    sp,
  });
}
