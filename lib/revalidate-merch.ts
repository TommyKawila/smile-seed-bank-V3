import { revalidatePath } from "next/cache";

export function revalidateMerchStorefront(): void {
  revalidatePath("/merch");
}
