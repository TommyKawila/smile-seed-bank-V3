export const CART_FLY_EVENT = "ssb:cart-fly";
export const CART_HIT_EVENT = "ssb:cart-hit";

export type CartFlyEventDetail = {
  startRect: Pick<DOMRect, "left" | "top" | "width" | "height">;
  productName: string;
  productImage: string | null;
};

export function getNavCartButtonEl(): HTMLElement | null {
  return document.getElementById("ssb-nav-cart-button");
}
