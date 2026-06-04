import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function purgeStaleAuthStorage(
  supabase: SupabaseClient<Database>
): Promise<void> {
  const { error } = await supabase.auth.getSession();
  if (error) await supabase.auth.signOut({ scope: "local" });
}
