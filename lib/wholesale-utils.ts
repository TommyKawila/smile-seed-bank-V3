export interface WholesaleContext {
  isWholesale: boolean;
  discountPercent: number;
  multiplier: number;
}

export function applyWholesalePrice(retailPrice: number, discountPercent: number): number {
  if (discountPercent <= 0) return retailPrice;
  return Math.round(retailPrice * (1 - discountPercent / 100));
}

export function applyWholesaleToCart(
  items: { price: number; [key: string]: unknown }[],
  context: WholesaleContext
): typeof items {
  if (!context.isWholesale) return items;
  return items.map((item) => ({
    ...item,
    price: applyWholesalePrice(item.price, context.discountPercent),
  }));
}
