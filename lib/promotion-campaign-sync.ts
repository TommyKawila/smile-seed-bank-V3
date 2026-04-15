import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

export function normalizeCampaignPromoCode(code: string): string {
  return code.trim().toUpperCase();
}

function promoRowActiveForWindow(
  isActive: boolean,
  startAt: Date,
  endAt: Date,
  now: Date = new Date()
): boolean {
  if (!isActive) return false;
  return now >= startAt && now <= endAt;
}

export async function upsertPromoCodeForCampaign(
  input: {
    promo_code: string;
    discount_type: string;
    discount_value: number | string | Prisma.Decimal;
    total_limit: number;
    per_user_limit: number;
    start_at: Date;
    end_at: Date;
    is_active: boolean;
  },
  db: Db = prisma
) {
  const code = normalizeCampaignPromoCode(input.promo_code);
  const now = new Date();
  const totalCap = input.total_limit > 0 ? input.total_limit : 999_999_999;
  const rowActive = promoRowActiveForWindow(input.is_active, input.start_at, input.end_at, now);

  return db.promo_codes.upsert({
    where: { code },
    create: {
      code,
      discount_type: input.discount_type,
      discount_value: new Prisma.Decimal(input.discount_value),
      min_spend: new Prisma.Decimal(0),
      is_active: rowActive,
      expiry_date: input.end_at,
      usage_limit_per_user: input.per_user_limit,
      total_usage_limit: totalCap,
      first_order_only: false,
      requires_auth: false,
    },
    update: {
      discount_type: input.discount_type,
      discount_value: new Prisma.Decimal(input.discount_value),
      expiry_date: input.end_at,
      usage_limit_per_user: input.per_user_limit,
      total_usage_limit: totalCap,
      is_active: rowActive,
    },
  });
}

export async function deactivatePromoCodeById(id: bigint, db: Db = prisma): Promise<void> {
  await db.promo_codes.update({
    where: { id },
    data: { is_active: false },
  });
}
