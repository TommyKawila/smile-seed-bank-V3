/** Client-safe labels/slugs. Do not put supplier cost here. */

export const SEEDS_GENETICS_SLUG = "seeds-genetics";
export const DEFAULT_EUR_THB = 38.44;

export type BulkSupplierSlug = "green-future" | "seeds-genetics";
export type BulkSeedFormat = "photo" | "auto" | "photo-ff";

export const SEED_FORMAT_LABEL: Record<BulkSeedFormat, string> = {
  photo: "Photo",
  auto: "Auto",
  "photo-ff": "Photo FF",
};
