import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "prisma", "migrations");
const tables = [
  "wholesale_deposit_yearly_seq",
  "wholesale_deposit_orders",
  "wholesale_deposit_order_items",
];
const foundCreate = Object.fromEntries(tables.map((t) => [t, false]));
const foundRls = Object.fromEntries(tables.map((t) => [t, false]));

for (const dir of readdirSync(root)) {
  let sql;
  try {
    sql = readFileSync(join(root, dir, "migration.sql"), "utf8");
  } catch {
    continue;
  }
  for (const t of tables) {
    if (new RegExp(`CREATE TABLE\\s+"public"\\."${t}"`, "i").test(sql)) {
      foundCreate[t] = true;
    }
    if (
      new RegExp(
        `ALTER TABLE\\s+"public"\\."${t}"\\s+ENABLE ROW LEVEL SECURITY`,
        "i"
      ).test(sql)
    ) {
      foundRls[t] = true;
    }
  }
}

let failed = false;
for (const t of tables) {
  if (!foundCreate[t]) {
    console.error(`${t} CREATE TABLE missing`);
    failed = true;
  }
  if (!foundRls[t]) {
    console.error(
      `${t} missing ENABLE ROW LEVEL SECURITY — PostgREST anon can dump deposit PII or set status VERIFIED`
    );
    failed = true;
  }
}
const service = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "services", "wholesale-deposit-service.ts"),
  "utf8"
);
if (!service.includes('status: { not: "VERIFIED" }')) {
  console.error(
    "submitDepositTransfer must not overwrite a VERIFIED deposit after the slip upload"
  );
  failed = true;
}

if (failed) process.exit(1);
console.log(
  "ok: wholesale deposit tables have ENABLE ROW LEVEL SECURITY and slip upload cannot un-verify"
);
