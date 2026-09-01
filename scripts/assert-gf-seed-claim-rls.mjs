import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "prisma", "migrations");
let foundCreate = false;
let foundRls = false;

for (const dir of readdirSync(root)) {
  let sql;
  try {
    sql = readFileSync(join(root, dir, "migration.sql"), "utf8");
  } catch {
    continue;
  }
  if (/CREATE TABLE\s+"public"\."gf_seed_claim_submissions"/i.test(sql)) {
    foundCreate = true;
  }
  if (
    /ALTER TABLE\s+"public"\."gf_seed_claim_submissions"\s+ENABLE ROW LEVEL SECURITY/i.test(
      sql
    )
  ) {
    foundRls = true;
  }
}

if (!foundCreate) {
  console.error("gf_seed_claim_submissions CREATE TABLE missing");
  process.exit(1);
}
if (!foundRls) {
  console.error(
    "gf_seed_claim_submissions missing ENABLE ROW LEVEL SECURITY — PostgREST anon can dump claim PII"
  );
  process.exit(1);
}
console.log("ok: gf_seed_claim_submissions has ENABLE ROW LEVEL SECURITY");
