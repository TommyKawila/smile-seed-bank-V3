import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function assertAdmin(): Promise<User> {
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
