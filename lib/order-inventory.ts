import type { Prisma } from "@prisma/client";
import type { order_items } from "@prisma/client";

/** Order statuses for which reject/cancel restores variant stock (guard in `rejectPayment`). */
export const REJECT_STOCK_RESTORE_STATUSES = [
  "PENDING",
  "AWAITING_VERIFICATION",
  "PAYMENT_REJECTED",
] as const;

export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export type CheckoutStockLine = {
  variantId: number;
  quantity: number;
  productName: string;
};

/** Merge duplicate variant lines (same cart key) for atomic stock checks and decrements. */
export function mergeCheckoutStockLines(lines: CheckoutStockLine[]): CheckoutStockLine[] {
  const m = new Map<number, { qty: number; name: string }>();
  for (const line of lines) {
    const prev = m.get(line.variantId);
    m.set(line.variantId, {
      qty: (prev?.qty ?? 0) + line.quantity,
      name: prev?.name ?? line.productName,
    });
  }
  return [...m.entries()].map(([variantId, v]) => ({
    variantId,
    quantity: v.qty,
    productName: v.name,
  }));
}

/**
 * Verifies `product_variants.stock` is enough for each merged line. Throws `InsufficientStockError`.
 */
export async function assertSufficientStockForCheckoutLines(
  tx: Prisma.TransactionClient,
  lines: CheckoutStockLine[]
): Promise<void> {
  const merged = mergeCheckoutStockLines(lines);
  for (const line of merged) {
    const v = await tx.product_variants.findUnique({
      where: { id: BigInt(line.variantId) },
      select: { stock: true },
    });
    if (!v) {
      throw new InsufficientStockError(`Insufficient stock for ${line.productName}`);
    }
    const stock = v.stock ?? 0;
    if (stock < line.quantity) {
      throw new InsufficientStockError(`Insufficient stock for ${line.productName}`);
    }
  }
}

/**
 * Decrements `product_variants.stock` per variant (quantities merged per variantId).
 */
export async function deductVariantStockForOrderItems(
  tx: Prisma.TransactionClient,
  lines: { variantId: number; quantity: number }[]
): Promise<void> {
  const merged = new Map<number, number>();
  for (const l of lines) {
    merged.set(l.variantId, (merged.get(l.variantId) ?? 0) + l.quantity);
  }
  for (const [variantId, quantity] of merged) {
    await tx.product_variants.update({
      where: { id: BigInt(variantId) },
      data: { stock: { decrement: quantity } },
    });
  }
}

/**
 * Increments `product_variants.stock` for each line (same pattern as admin order void).
 * Call inside an active `prisma.$transaction` callback.
 */
export async function restoreVariantStockForOrderItems(
  tx: Prisma.TransactionClient,
  items: Pick<order_items, "variant_id" | "quantity">[]
): Promise<void> {
  for (const item of items) {
    if (item.variant_id == null) continue;
    await tx.product_variants.update({
      where: { id: item.variant_id },
      data: { stock: { increment: item.quantity } },
    });
  }
}
