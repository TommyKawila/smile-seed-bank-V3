/** Shared types for admin order lists (storefront-safe — no server imports). */
export type AdminOrderLineItem = {
  quantity: number;
  unit_price: number;
  product_name: string;
  unit_label: string | null;
  /** From joined `product_variants` when `variant_id` is set; used with `unit_label` for pack size. */
  variant_unit_label: string | null;
  subtotal: number | null;
  breeder_name: string;
  /** DB `products.flowering_type` — autoflower | photoperiod | photo_ff | … */
  flowering_type: string | null;
  /** Legacy `products.category` (optional on older API payloads) */
  category?: string | null;
  /** `product_categories.name` */
  product_category_name?: string | null;
};
