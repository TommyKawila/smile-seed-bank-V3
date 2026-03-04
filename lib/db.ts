/**
 * Central PostgreSQL connection via postgres.js driver.
 * This is the ONLY place DATABASE_URL is consumed.
 * All services must import getSql() from here.
 */
import postgres from "postgres";

let _sql: ReturnType<typeof postgres> | null = null;

export function getSql(): ReturnType<typeof postgres> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. " +
        "Add it from Supabase → Project Settings → Database → Connection string (URI)."
    );
  }
  if (!_sql) {
    _sql = postgres(url, { max: 5, idle_timeout: 30 });
  }
  return _sql;
}
