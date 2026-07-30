import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent } from "@/lib/security-log";

/** True only when running `next dev` — not `next start`, not Vercel production. */
export function isDevAdminBypassEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

const DEV_MOCK_ADMIN_USER = {
  id: "00000000-0000-4000-8000-0000000000d1",
  aud: "authenticated",
  role: "authenticated",
  email: "dev-bypass@localhost.invalid",
  app_metadata: {},
  user_metadata: { role: "ADMIN" },
  created_at: new Date().toISOString(),
} as unknown as User;

export function isAdminAuthError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("Unauthorized:");
}

export function adminUnauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Defense-in-depth admin gate (in addition to middleware).
 * Checks JWT metadata AND `customers.role` so demotion takes effect without waiting for JWT refresh.
 */
export async function assertAdmin(): Promise<User> {
  if (isDevAdminBypassEnabled()) {
    return DEV_MOCK_ADMIN_USER;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized: Admin access required");
  }

  const metaRole = user.user_metadata?.role;
  if (typeof metaRole !== "string" || metaRole !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  try {
    const row = await prisma.customers.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if ((row?.role ?? "").trim() !== "ADMIN") {
      logSecurityEvent("admin_role_stale_or_demoted", { userId: user.id });
      throw new Error("Unauthorized: Admin access required");
    }
  } catch (err) {
    if (isAdminAuthError(err)) throw err;
    // DB unavailable — fail closed in production
    logSecurityEvent("admin_role_db_check_failed", {
      userId: user.id,
      message: err instanceof Error ? err.message : String(err),
    });
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

/** Prefer in route handlers: returns 401 Response instead of throwing. */
export async function requireAdminUser(): Promise<
  { ok: true; user: User } | { ok: false; response: NextResponse }
> {
  try {
    const user = await assertAdmin();
    return { ok: true, user };
  } catch (err) {
    if (isAdminAuthError(err)) {
      logSecurityEvent("admin_unauthorized", {});
      return { ok: false, response: adminUnauthorizedResponse() };
    }
    logSecurityEvent("admin_unauthorized", {
      message: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, response: adminUnauthorizedResponse() };
  }
}
