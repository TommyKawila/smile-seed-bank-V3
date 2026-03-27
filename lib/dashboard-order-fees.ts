import { prisma } from "@/lib/prisma";

/** Once columns exist, avoid repeated information_schema hits. */
let confirmedFeesExist = false;

export async function ordersTableHasFeeColumns(): Promise<boolean> {
  if (confirmedFeesExist) return true;
  try {
    const rows = await prisma.$queryRaw<{ ok: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orders'
          AND column_name = 'shipping_fee'
      ) AS ok
    `;
    if (rows[0]?.ok) {
      confirmedFeesExist = true;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
