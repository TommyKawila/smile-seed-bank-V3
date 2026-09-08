import type { SgCategorySlug } from "@/lib/seeds-genetics-catalog";
import type { SgfStrainBucket } from "@/lib/sgf-seeds-share";

export type BulkShareFormatTab = "photo" | "autoflower" | "photo-ff";

export const BULK_SHARE_FORMAT_TAB_ORDER: BulkShareFormatTab[] = [
  "photo",
  "autoflower",
  "photo-ff",
];

export function sgCategoryToFormatTab(slug: SgCategorySlug): BulkShareFormatTab {
  if (slug === "photo-ff") return "photo-ff";
  if (slug.includes("autoflower")) return "autoflower";
  return "photo";
}

export function defaultFormatTab(
  counts: Partial<Record<BulkShareFormatTab, number>>
): BulkShareFormatTab {
  for (const tab of BULK_SHARE_FORMAT_TAB_ORDER) {
    if ((counts[tab] ?? 0) > 0) return tab;
  }
  return "photo";
}

export function sgfBucketToTab(bucket: SgfStrainBucket): BulkShareFormatTab {
  return bucket;
}
