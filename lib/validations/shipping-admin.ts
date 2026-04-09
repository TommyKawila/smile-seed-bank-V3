import { z } from "zod";

/** Form defaults when no DB row (admin spec). */
export const SHIPPING_ADMIN_DEFAULT_FEE = 50;
export const SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD = 500;

export const ShippingRulesAdminSchema = z.object({
  base_fee: z.coerce.number().min(0).max(1_000_000),
  free_shipping_threshold: z.coerce.number().min(0).max(10_000_000),
});

export type ShippingRulesAdminInput = z.infer<typeof ShippingRulesAdminSchema>;
