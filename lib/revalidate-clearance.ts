import { revalidatePath, revalidateTag } from "next/cache";
import { STOREFRONT_CATALOG_CACHE_TAG } from "@/services/storefront-catalog-cache-service";

/** Invalidate home clearance rail + `/seeds?quick=clearance` after admin changes. */
export function revalidateClearanceStorefront(): void {
  revalidateTag("storefront-home");
  revalidateTag(STOREFRONT_CATALOG_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/seeds");
}
