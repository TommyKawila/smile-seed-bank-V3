import "server-only";
import { randomInt } from "crypto";

/** Excludes 0, O, 1, I, L to reduce user confusion when reading aloud or typing. */
const ORDER_NUMBER_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const ORDER_NUMBER_LENGTH = 6;
const BASE = ORDER_NUMBER_CHARSET.length;

/**
 * Random 6-character alphanumeric order token (not guaranteed unique — use uniqueness check at insert).
 */
export function generateOrderNumber(): string {
  let out = "";
  for (let i = 0; i < ORDER_NUMBER_LENGTH; i++) {
    out += ORDER_NUMBER_CHARSET[randomInt(BASE)]!;
  }
  return out;
}
