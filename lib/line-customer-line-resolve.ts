import { prisma } from "@/lib/prisma";

/** Guest checkout: reuse LINE id previously stored on `customers` for the same email. */
export async function getLineUserIdByEmailForCheckout(
  email: string | null | undefined
): Promise<string | null> {
  const em = email?.trim();
  if (!em) return null;
  const rows = await prisma.$queryRaw<{ line_user_id: string }[]>`
    SELECT line_user_id FROM public.customers
    WHERE line_user_id IS NOT NULL AND TRIM(line_user_id) <> ''
      AND email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(${em})
    LIMIT 1
  `;
  return rows[0]?.line_user_id?.trim() ?? null;
}
