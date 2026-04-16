import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

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

  const role = user.user_metadata?.role;
  if (typeof role !== "string" || role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}
