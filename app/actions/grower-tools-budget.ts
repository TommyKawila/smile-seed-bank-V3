"use server";

import { assertAdmin } from "@/lib/auth-utils";
import { resetGrowerToolsBudgetTrip } from "@/services/grower-tools-budget-service";

export async function resetGrowerToolsBudgetTripAction() {
  try {
    await assertAdmin();
  } catch {
    return { ok: false as const, error: "Unauthorized" };
  }
  await resetGrowerToolsBudgetTrip();
  return { ok: true as const };
}
