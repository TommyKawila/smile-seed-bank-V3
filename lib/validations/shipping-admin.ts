import { z } from "zod";
import { QUOTATION_SHIPPING_FREE_THRESHOLD } from "@/lib/order-financials";

/** Form defaults when no DB row (admin spec). */
export const SHIPPING_ADMIN_DEFAULT_FEE = 50;
export const SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD = QUOTATION_SHIPPING_FREE_THRESHOLD;

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const ShippingRulesAdminSchema = z.object({
  base_fee: z.coerce.number().min(0).max(1_000_000),
  free_shipping_threshold: z.coerce.number().min(0).max(10_000_000),
});

export const ShippingPauseAdminSchema = z
  .object({
    shipping_pause_enabled: z.boolean(),
    shipping_pause_from: z
      .string()
      .trim()
      .refine((v) => v === "" || ymdRegex.test(v), "วันเริ่มหยุดไม่ถูกต้อง (YYYY-MM-DD)")
      .optional(),
    shipping_pause_until: z
      .string()
      .trim()
      .refine((v) => v === "" || ymdRegex.test(v), "วันเริ่มส่งอีกครั้งไม่ถูกต้อง (YYYY-MM-DD)")
      .optional(),
    shipping_pause_message_th: z.string().max(500).optional(),
    shipping_pause_message_en: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.shipping_pause_enabled) return;
    const until = data.shipping_pause_until?.trim();
    if (!until) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาระบุวันเริ่มส่งอีกครั้งเมื่อเปิดแจ้งหยุดจัดส่ง",
        path: ["shipping_pause_until"],
      });
    }
  });

export const ShippingAdminPutSchema = ShippingRulesAdminSchema.merge(ShippingPauseAdminSchema);

export type ShippingRulesAdminInput = z.infer<typeof ShippingRulesAdminSchema>;
export type ShippingPauseAdminInput = z.infer<typeof ShippingPauseAdminSchema>;
