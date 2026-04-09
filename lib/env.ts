import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined ? undefined : v;

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_URL is required")
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL (e.g. https://xxx.supabase.co)"),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required — copy from Supabase Project Settings → API"),

  /**
   * Canonical public site URL (no trailing slash in stored value). Single source of truth for
   * storefront links — consumed by `getURL()` / `getSiteOrigin()` in `lib/get-url.ts`.
   */
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .url("NEXT_PUBLIC_SITE_URL must be a valid URL when set (e.g. https://smile-seed-bank.vercel.app)")
      .optional()
  ),

  /** Server-only; optional until `createAdminClient()` is used */
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

if (!parsed.success) {
  const isServer = typeof window === "undefined";

  const lines = parsed.error.issues.map(
    (issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`
  );

  const errorMessage = `[env] Invalid or missing environment variables:\n${lines.join("\n")}`;

  if (isServer) {
    throw new Error(
      `${errorMessage}\nCheck .env.local against .env.example.`
    );
  } else {
    console.error(errorMessage);
  }
}

/**
 * Validated env on server; on client, falls back to `{}` if parse failed so the shell can still render.
 * Prefer unquoted values in `.env.local` for simple keys (e.g. KEY=https://... ) to avoid parser edge cases.
 */
export const env = parsed.success ? parsed.data : ({} as Env);
