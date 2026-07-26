import { config } from "dotenv";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { resolveDirectDbUrl } from "@/lib/db-direct-url";

config();
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const MIGRATION_NAME = "20260726160000_products_merch_kind";

function migrationChecksum(): string {
  const sqlPath = resolve(process.cwd(), `prisma/migrations/${MIGRATION_NAME}/migration.sql`);
  const sql = readFileSync(sqlPath, "utf8");
  return createHash("sha256").update(sql).digest("hex");
}

async function main() {
  const sqlPath = resolve(process.cwd(), `supabase/migrations/${MIGRATION_NAME}.sql`);
  const sql = readFileSync(sqlPath, "utf8");
  const url = resolveDirectDbUrl();
  const host = url.match(/@([^:/]+)/)?.[1] ?? "unknown";
  console.log(`Applying merch schema via ${host} …`);

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(sql);

    const checksum = migrationChecksum();
    const existing = await client.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM "_prisma_migrations" WHERE migration_name = $1`,
      [MIGRATION_NAME]
    );
    if ((existing.rows[0]?.c ?? 0) === 0) {
      await client.query(
        `
        INSERT INTO "_prisma_migrations" (
          id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
        ) VALUES (gen_random_uuid()::text, $1, NOW(), $2, NULL, NULL, NOW(), 1)
        `,
        [checksum, MIGRATION_NAME]
      );
    }

    console.log("OK — product_kind + merch_category + migration history.");
    console.log("Next: npx prisma generate && rm -rf .next && npm run dev");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
