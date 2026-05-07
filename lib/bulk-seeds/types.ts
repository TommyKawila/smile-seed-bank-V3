/** Admin-only bulk wholesale DTO — no coupling to products/variants or storefront. */
export type BulkSeedDTO = {
  id: string;
  source_kind: string;
  external_id: string;
  code: string;
  strain: string;
  thc: string;
  cycle: string;
  type: string;
  flavor: string;
  tier_prices: Record<string, number | null>;
  updated_at: string;
};
