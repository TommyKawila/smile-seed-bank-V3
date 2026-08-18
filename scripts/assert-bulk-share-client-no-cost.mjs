#!/usr/bin/env node
/**
 * Guard: public bulk-share client must not import supplier cost modules.
 * Cost JSON + GM math lives in bulk-seeds-book / sgf-seeds-share (admin/server only).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "components/share/bulk";
const BANNED = [
  "@/lib/bulk-seeds-book",
  "@/lib/sgf-seeds-share",
  "@/lib/bulk-share-order",
  "@/lib/green-future-resale-pricing",
  "@/lib/bulk-seeds-trade",
  "price-list-gf-ssb",
];

const files = readdirSync(DIR).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
const hits = [];
for (const file of files) {
  const src = readFileSync(join(DIR, file), "utf8");
  for (const needle of BANNED) {
    if (src.includes(needle)) hits.push(`${file} imports ${needle}`);
  }
}

if (hits.length) {
  console.error("bulk-share client cost leak:\n" + hits.map((h) => `  - ${h}`).join("\n"));
  process.exit(1);
}
console.log(`ok: ${files.length} share client files have no cost-module imports`);
