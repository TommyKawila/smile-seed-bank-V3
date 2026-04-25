import type { MagazinePostPublic } from "@/lib/blog-service";
import type { ProductWithBreeder } from "@/lib/supabase/types";

/** Desktop shop grid is 4 columns; 2-col specials must not start in the last column-only slot. */
const DESKTOP_COLS = 4;

export type VaultGridItem =
  | { type: "product"; product: ProductWithBreeder }
  | { type: "spotlight"; product: ProductWithBreeder }
  | { type: "research"; post: MagazinePostPublic };

/**
 * Row-aware interleaving: insert 2-column specials only when two consecutive
 * cells remain in the current 4-col row; otherwise emit a product to fill the gap first.
 */
export function interleaveContent(
  products: ProductWithBreeder[],
  researchPosts: MagazinePostPublic[]
): VaultGridItem[] {
  const queue = products.slice();
  const out: VaultGridItem[] = [];
  let idx = 0;
  /** Column cursor within current row: 0..DESKTOP_COLS-1 */
  let cursor = 0;

  const advanceAfterOneCol = () => {
    cursor = (cursor + 1) % DESKTOP_COLS;
  };

  const advanceAfterTwoCol = () => {
    cursor = (cursor + 2) % DESKTOP_COLS;
  };

  const emitProduct = (): boolean => {
    if (idx >= queue.length) return false;
    out.push({ type: "product", product: queue[idx]! });
    idx++;
    advanceAfterOneCol();
    return true;
  };

  /** Ensure at least 2 cells remain in this row (or move to next row). */
  const ensureRoomForSpan2 = () => {
    while (DESKTOP_COLS - cursor < 2) {
      if (!emitProduct()) {
        cursor = 0;
        break;
      }
    }
  };

  const pushSpan2 = (item: VaultGridItem) => {
    ensureRoomForSpan2();
    out.push(item);
    advanceAfterTwoCol();
  };

  // First row: up to 4 products (original layout intent)
  for (let k = 0; k < 4 && idx < queue.length; k++) {
    emitProduct();
  }

  let spotlightRound = 0;
  while (idx < queue.length) {
    for (let k = 0; k < 7 && idx < queue.length; k++) {
      emitProduct();
    }
    if (idx >= queue.length) break;

    const spotlightProduct = queue[idx]!;
    idx++;
    pushSpan2({ type: "spotlight", product: spotlightProduct });

    spotlightRound += 1;
    if (spotlightRound === 1 && researchPosts[0]) {
      pushSpan2({ type: "research", post: researchPosts[0] });
    }
    if (spotlightRound === 2 && researchPosts[1]) {
      pushSpan2({ type: "research", post: researchPosts[1] });
    }
  }

  return out;
}
