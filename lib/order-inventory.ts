import { Prisma } from "@prisma/client";
import type { order_items } from "@prisma/client";

/** Order statuses for which reject/cancel restores variant stock (guard in `rejectPayment`). */
export const REJECT_STOCK_RESTORE_STATUSES = [
  "PENDING",
  "PENDING_INFO",
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
  if (merged.length === 0) return;

  const variants = await tx.product_variants.findMany({
    where: { id: { in: merged.map((line) => BigInt(line.variantId)) } },
    select: { id: true, stock: true },
  });
  const byId = new Map(variants.map((v) => [Number(v.id), v.stock ?? 0]));

  for (const line of merged) {
    const stock = byId.get(line.variantId);
    if (stock == null) {
      throw new InsufficientStockError(`Insufficient stock for ${line.productName}`);
    }
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
  const merged = mergeCheckoutStockLines(
    lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
      productName: `variant ${line.variantId}`,
    }))
  );
  if (merged.length === 0) return;

  const values = Prisma.join(
    merged.map((line) => Prisma.sql`(${BigInt(line.variantId)}::bigint, ${line.quantity}::integer)`)
  );
  const updated = await tx.$queryRaw<{ id: bigint }[]>`
    WITH wanted(id, qty) AS (VALUES ${values}),
    updated AS (
      UPDATE public.product_variants pv
      SET stock = COALESCE(pv.stock, 0) - wanted.qty
      FROM wanted
      WHERE pv.id = wanted.id
        AND COALESCE(pv.stock, 0) >= wanted.qty
      RETURNING pv.id
    )
    SELECT id FROM updated
  `;

  if (updated.length !== merged.length) {
    throw new InsufficientStockError("Insufficient stock for one or more products");
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
    const id =
      typeof item.variant_id === "bigint"
        ? item.variant_id
        : BigInt(String(item.variant_id));
    await tx.product_variants.update({
      where: { id },
      data: { stock: { increment: item.quantity } },
    });
  }
}
