/** Direct Postgres URL for DDL / migrate — not PgBouncer pooler. */
export function resolveDirectDbUrl(): string {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct?.includes("db.") && direct.includes(".supabase.co")) {
    return direct.split("?")[0] ?? direct;
  }

  const supabasePublic = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const ref = supabasePublic.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const source = direct || process.env.DATABASE_URL?.trim() || "";
  const pass = source.match(/postgres(?:\.[^:]*)?:([^@]+)@/)?.[1];

  if (ref && pass) {
    return `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres`;
  }

  if (direct) return direct.split("?")[0] ?? direct;
  throw new Error(
    "Set DIRECT_URL to db.YOUR_PROJECT.supabase.co:5432 (Supabase → Settings → Database → Direct connection)"
  );
}
