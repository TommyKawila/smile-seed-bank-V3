import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS,
  type ProductWithBreederAndVariants,
} from "@/lib/supabase/types";

/** Denormalized `products.stock` (sum of active variant inventory). Not a column named `inventory_count`. */
const LOW_MIN = 1;
const LOW_MAX = 5;

function shufflePick<T>(arr: T[], take: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, take);
}

/**
 * Products with total catalog stock in the low-stock band (1–5). Returns 1–2 random rows when any exist.
 */
export async function getLowStockSpotlight(opts?: {
  /** Restrict to these product ids (e.g. current filtered storefront list). */
  withinIds?: number[] | null;
}): Promise<{ data: ProductWithBreederAndVariants[]; error: string | null }> {
  const withinIds = opts?.withinIds?.filter((n) => Number.isFinite(n) && n > 0) ?? null;

  try {
    const sb = createServiceRoleClient();
    let q = sb
      .from("products")
      .select(PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS)
      .eq("is_active", true)
      .gte("stock", LOW_MIN)
      .lte("stock", LOW_MAX);

    if (withinIds && withinIds.length > 0) {
      q = q.in("id", withinIds);
    } else {
      q = q.limit(120);
    }

    const { data, error } = await q;

    if (error) {
      return { data: [], error: error.message };
    }

    const rows = (data ?? []) as ProductWithBreederAndVariants[];
    if (rows.length === 0) {
      return { data: [], error: null };
    }

    const count = rows.length === 1 ? 1 : Math.random() < 0.45 ? 1 : 2;
    const take = Math.min(count, rows.length);
    return { data: shufflePick(rows, take), error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}
