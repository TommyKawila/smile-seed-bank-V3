/**
 * Guard: listing/JSON-LD "from" price and PDP default pack must ignore OOS clearance.
 * Trigger: 1-seed clearance ฿99 stock=0 + 5-seed in-stock ฿450/900 on is_clearance product.
 */
import assert from "node:assert/strict";
import type { ProductVariant } from "@/types/supabase";
import {
  getEffectiveListingPrice,
  pickDefaultClearanceVariant,
} from "@/lib/product-utils";

const oosOneSeed = {
  id: 1,
  price: 199,
  stock: 0,
  is_active: true,
  unit_label: "1 seed",
  clearance_price: 99,
} as unknown as ProductVariant;

const inStockFive = {
  id: 2,
  price: 900,
  stock: 8,
  is_active: true,
  unit_label: "5 seeds",
  clearance_price: 450,
} as unknown as ProductVariant;

const inStockFiveNoClearance = {
  ...inStockFive,
  id: 3,
  clearance_price: null,
} as unknown as ProductVariant;

const mixedClearance = {
  is_clearance: true,
  product_variants: [oosOneSeed, inStockFive],
};

const mixedPartial = {
  is_clearance: true,
  product_variants: [oosOneSeed, inStockFiveNoClearance],
};

const fullyOos = {
  is_clearance: true,
  product_variants: [{ ...oosOneSeed, stock: 0 }, { ...inStockFive, stock: 0 }],
};

assert.equal(getEffectiveListingPrice(mixedClearance), 450);
assert.equal(getEffectiveListingPrice(mixedPartial), 900);
assert.equal(getEffectiveListingPrice(fullyOos), 99);

assert.equal(pickDefaultClearanceVariant(mixedClearance, [oosOneSeed, inStockFive])?.id, 2);
assert.equal(
  pickDefaultClearanceVariant(mixedPartial, [oosOneSeed, inStockFiveNoClearance])?.id,
  3
);
assert.equal(
  pickDefaultClearanceVariant(fullyOos, fullyOos.product_variants as ProductVariant[])?.id,
  1
);

console.log("assert-clearance-listing-in-stock: ok");
