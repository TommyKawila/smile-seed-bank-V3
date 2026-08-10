import type { Metadata } from "next";
import { MerchLandingClient } from "@/components/storefront/MerchLandingClient";
import { getMerchCategory, MERCH_CATEGORIES } from "@/lib/merch-catalog";
import {
  getMerchBreederBoxBySlug,
  getMerchBreederBoxes,
  getMerchCategoryCountsForBreeder,
  listMerchStorefrontProducts,
} from "@/services/merch-storefront-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Merchandise | Smile Seed Bank",
  description: "Grower gear vault — tees, caps, pins & stickers by breeder.",
  alternates: { canonical: "/merch" },
};

type Props = {
  searchParams?: Promise<{ breeder?: string | string[]; cat?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MerchPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : undefined;
  const breederSlug = firstParam(sp?.breeder)?.trim() || null;
  const categoryId = firstParam(sp?.cat)?.trim() || null;

  const [hubBoxes, breeder, category] = await Promise.all([
    getMerchBreederBoxes(),
    breederSlug ? getMerchBreederBoxBySlug(breederSlug) : Promise.resolve(null),
    Promise.resolve(getMerchCategory(categoryId)),
  ]);

  const categoryCounts =
    breeder != null ? await getMerchCategoryCountsForBreeder(breeder.breederId) : null;

  const products =
    breeder != null && category != null
      ? await listMerchStorefrontProducts(breeder.breederId, category.id)
      : [];

  return (
    <MerchLandingClient
      breederSlug={breederSlug}
      categoryId={categoryId}
      hubBoxes={hubBoxes}
      breeder={breeder}
      category={category}
      categoryCounts={categoryCounts}
      categories={MERCH_CATEGORIES}
      products={products}
    />
  );
}
