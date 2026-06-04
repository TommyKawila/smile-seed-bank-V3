import type { Metadata } from "next";
import ShopPage from "../../shop/page";

function firstSegment(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string | string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const encoded = encodeURIComponent((firstSegment(slug) ?? "").trim());
  return {
    alternates: {
      canonical: `/brand/${encoded}`,
    },
  };
}

export default async function BrandBreederCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string | string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const breederSlug = firstSegment(resolvedParams.slug);
  return ShopPage({
    params: Promise.resolve({ breederSlug }),
    searchParams: Promise.resolve(resolvedSearchParams ?? {}),
  });
}
