import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  WholesaleContext,
  applyWholesalePrice,
  applyWholesaleToCart,
} from "@/lib/wholesale-utils";
import type { Customer } from "@/types/supabase";

export type { WholesaleContext };
export { applyWholesalePrice, applyWholesaleToCart };

type ServiceResult<T> = { data: T | null; error: string | null };

// ─── Fetch wholesale status from DB ──────────────────────────────────────────

export async function getWholesaleContext(
  customerId: string
): Promise<ServiceResult<WholesaleContext>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("customers")
      .select("is_wholesale, wholesale_discount_percent")
      .eq("id", customerId)
      .single();

    if (error) return { data: null, error: error.message };

    const customer = data as Pick<
      Customer,
      "is_wholesale" | "wholesale_discount_percent"
    >;

    const discountPercent = customer.is_wholesale
      ? (customer.wholesale_discount_percent ?? 0)
      : 0;

    return {
      data: {
        isWholesale: customer.is_wholesale,
        discountPercent,
        multiplier: 1 - discountPercent / 100,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── Admin: toggle wholesale status ──────────────────────────────────────────

export async function setWholesaleStatus(
  customerId: string,
  isWholesale: boolean,
  discountPercent: number
): Promise<ServiceResult<null>> {
  try {
    // Use admin client to bypass RLS for admin write operations
    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("customers")
      .update({ is_wholesale: isWholesale, wholesale_discount_percent: isWholesale ? discountPercent : 0 })
      .eq("id", customerId);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}
