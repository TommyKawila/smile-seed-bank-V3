import type { Metadata } from "next";
import { renderShopCatalog } from "@/app/(storefront)/shop/render-shop-catalog";

function firstSegment(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type BrandBreederPageProps = {
  params: Promise<{ slug: string | string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: BrandBreederPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const encoded = encodeURIComponent((firstSegment(slug) ?? "").trim());
  return {
    alternates: {
      canonical: `/brand/${encoded}`,
    },
  };
}

export default async function BrandBreederCatalogPage(props: BrandBreederPageProps) {
  const resolvedParams = await props.params;
  const sp = props.searchParams ? await props.searchParams : undefined;
  return renderShopCatalog({
    breederSlugFromRoute: firstSegment(resolvedParams.slug),
    sp,
  });
}
