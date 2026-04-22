/** Shared types for admin order lists (storefront-safe — no server imports). */
export type AdminOrderLineItem = {
  quantity: number;
  unit_price: number;
  product_name: string;
  unit_label: string | null;
  subtotal: number | null;
  breeder_name: string;
  flowering_type: string | null;
};
