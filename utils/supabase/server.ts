export { createClient, createAdminClient } from "@/lib/supabase/server";
export type { Database } from "@/types/database.types";
export type {
  ProductRow,
  ProductVariantRow,
  ProductWithBreeder,
  ProductWithBreederAndVariants,
} from "@/lib/supabase/types";
export {
  PRODUCT_SELECT_WITH_BREEDER,
  PRODUCT_SELECT_WITH_BREEDER_AND_VARIANTS,
} from "@/lib/supabase/types";
