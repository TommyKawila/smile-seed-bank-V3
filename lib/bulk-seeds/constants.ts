export const BULK_SEED_SOURCE_OPTIONS = [
  { value: "auto_fem", label: "Auto FEM" },
  { value: "fem", label: "FEM" },
  { value: "price_sheet", label: "Price sheet" },
] as const;

export type BulkSeedSourceKind = (typeof BULK_SEED_SOURCE_OPTIONS)[number]["value"];

/** Default tier columns (THB / unit conventions from your sheets). Union with keys present in DB rows. */
export const BULK_SEED_DEFAULT_TIER_KEYS = [
  "500",
  "1000",
  "2500",
  "5000",
  "10000",
  "25000",
  "50000",
  "100000",
  "250000",
  "500000",
  "1000000",
  "1000000_plus",
] as const;

export type BulkSeedTierKey = (typeof BULK_SEED_DEFAULT_TIER_KEYS)[number] | string;

export function labelForTierKey(key: string): string {
  if (key === "1000000_plus") return "1M+";
  const n = Number(key);
  if (Number.isFinite(n) && n >= 1000) return n.toLocaleString("en-US");
  return key;
}
