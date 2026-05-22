import { revalidatePath, revalidateTag } from "next/cache";

/** Invalidate home clearance rail + `/seeds?quick=clearance` after admin changes. */
export function revalidateClearanceStorefront(): void {
  revalidateTag("storefront-home");
  revalidatePath("/");
  revalidatePath("/seeds");
}
