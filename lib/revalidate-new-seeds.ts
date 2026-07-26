import { revalidatePath, revalidateTag } from "next/cache";
import { STOREFRONT_CATALOG_CACHE_TAG } from "@/services/storefront-catalog-cache-service";

/** Invalidate New Seeds landing + home rail after admin pin/priority changes. */
export function revalidateNewSeedsStorefront(): void {
  revalidateTag("storefront-home");
  revalidateTag(STOREFRONT_CATALOG_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/new");
  revalidatePath("/seeds");
}
