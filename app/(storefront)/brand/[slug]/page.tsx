import type { Metadata } from "next";
import ShopPage from "../../shop/page";

function firstSegment(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string | string[] }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = encodeURIComponent((firstSegment(resolvedParams.slug) ?? "").trim());
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
  params: Promise<{ slug: string | string[] }>;
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = await params;
  return ShopPage({
    params: Promise.resolve({ breederSlug: firstSegment(resolvedParams.slug) }),
    searchParams,
  });
}
