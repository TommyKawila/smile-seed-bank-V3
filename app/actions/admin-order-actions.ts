"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth-utils";

export type UnlinkOrderLineResult =
  | { ok: true }
  | { ok: false; error: string };

export async function unlinkOrderLineUserId(orderId: number): Promise<UnlinkOrderLineResult> {
  try {
    await assertAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return { ok: false, error: "Invalid order" };
  }

  try {
    await prisma.orders.update({
      where: { id: BigInt(orderId) },
      data: { line_user_id: null },
    });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
