/** Matches `Locale` from `LanguageContext` — kept here to avoid lib → client context imports. */
export type CartPackLocale = "th" | "en";

export function parsePackCountFromUnitLabel(unitLabel: string): number {
  const m = String(unitLabel).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

export function seedsPackLine(
  count: number,
  currentLocale: CartPackLocale,
  unitLabelFallback: string
): string {
  if (count <= 0) return unitLabelFallback;
  if (currentLocale === "th") return `แพคเกจ ${count} เมล็ด`;
  return count === 1 ? "1 seed pack" : `${count} seeds pack`;
}

export function cartItemPackDescription(
  item: { unitLabel: string; quantity: number; isFreeGift?: boolean },
  locale: CartPackLocale,
  options?: { includeLineQuantity?: boolean }
): string {
  if (item.isFreeGift) return item.unitLabel;
  const count = parsePackCountFromUnitLabel(item.unitLabel);
  const pack = seedsPackLine(count, locale, item.unitLabel);
  if (options?.includeLineQuantity) return `${pack} × ${item.quantity}`;
  return pack;
}
