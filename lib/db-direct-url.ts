function stripQuery(url: string): string {
  return url.split("?")[0] ?? url;
}

function supabaseProjectRef(): string | undefined {
  const fromPublic = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const ref = fromPublic.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (ref) return ref;

  for (const raw of [process.env.DIRECT_URL, process.env.DATABASE_URL]) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      const user = decodeURIComponent(new URL(value).username);
      const fromUser = user.match(/^postgres\.([a-z0-9]+)$/i)?.[1];
      if (fromUser) return fromUser;
    } catch {
      /* ignore invalid URL */
    }
  }

  return undefined;
}

/** Direct Postgres URL for DDL / migrate — not PgBouncer pooler. */
export function resolveDirectDbUrl(): string {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct?.includes("db.") && direct.includes(".supabase.co")) {
    return stripQuery(direct);
  }

  const source = direct || process.env.DATABASE_URL?.trim() || "";
  if (!source) {
    throw new Error(
      "Set DIRECT_URL to db.YOUR_PROJECT.supabase.co:5432 (Supabase → Settings → Database → Direct connection)"
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(source);
  } catch {
    throw new Error("DATABASE_URL / DIRECT_URL is not a valid URL");
  }

  const ref = supabaseProjectRef();
  const password = decodeURIComponent(parsed.password);
  if (ref && password) {
    const path = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/postgres";
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432${path}`;
  }

  if (direct && !parsed.hostname.includes("pooler.supabase.com")) {
    return stripQuery(direct);
  }

  throw new Error(
    "Set DIRECT_URL to db.YOUR_PROJECT.supabase.co:5432 (Supabase → Settings → Database → Direct connection)"
  );
}
