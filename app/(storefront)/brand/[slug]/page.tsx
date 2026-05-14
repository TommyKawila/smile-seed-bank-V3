import type { Metadata } from "next";
import ShopPage from "../../shop/page";

function firstSegment(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function generateMetadata({
  params,
}: {
  params: { slug: string | string[] };
}): Metadata {
  const slug = encodeURIComponent((firstSegment(params.slug) ?? "").trim());
  return {
    alternates: {
      canonical: `/brand/${slug}`,
    },
  };
}

export default async function BrandBreederCatalogPage({
  params,
  searchParams,
}: {
  params: { slug: string | string[] };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return ShopPage({
    params: { breederSlug: firstSegment(params.slug) },
    searchParams,
  });
}
