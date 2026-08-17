import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { withTimeout } from "@/lib/timeout";
import { readBulkShareToken } from "@/lib/bulk-share-token";
import { BulkShareOrderClient } from "@/components/share/bulk/BulkShareOrderClient";
import {
  buildPricedBooks,
  serializePricedBooks,
} from "@/lib/bulk-share-order";
import { sgStrainsGrouped } from "@/lib/seeds-genetics-catalog";
import { listPartnerStrains } from "@/services/partner-catalog-service";
import { GREEN_FUTURE_SLUG } from "@/types/partner-catalog";
import { SEEDS_GENETICS_SLUG, type BulkSupplierSlug } from "@/lib/bulk-seeds-book";

export const dynamic = "force-dynamic";
export const robots = { index: false, follow: false };

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Bulk seed offer · Smile Seed Bank",
    robots: { index: false, follow: false },
  };
}

export default async function BulkSharePage({ params }: Props) {
  const { token } = await params;
  const payload = readBulkShareToken(decodeURIComponent(token));
  if (!payload) notFound();

  const pricedBooks = serializePricedBooks(buildPricedBooks(payload));

  const strains =
    payload.showStrains && payload.suppliers.includes("green-future" as BulkSupplierSlug)
      ? (
          await withTimeout(
            listPartnerStrains(GREEN_FUTURE_SLUG, { limit: 500, offset: 0 }),
            4000,
            { strains: [], total: 0 }
          )
        ).strains
      : [];

  const sgGroups =
    payload.showStrains &&
    payload.suppliers.includes(SEEDS_GENETICS_SLUG as BulkSupplierSlug)
      ? sgStrainsGrouped()
      : [];

  return (
    <BulkShareOrderClient
      token={decodeURIComponent(token)}
      title={payload.title}
      expiresAt={payload.exp}
      pricedBooks={pricedBooks}
      sgfStrains={strains}
      sgGroups={sgGroups}
    />
  );
}
