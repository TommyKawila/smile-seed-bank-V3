import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/types/supabase";

export async function fetchCustomerProfile(uid: string): Promise<Customer | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("customers").select("*").eq("id", uid).single();
  if (error || !data) return null;
  return data as unknown as Customer;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export function subscribeToAuthChanges(onChange: (user: User | null, session: Session | null) => void) {
  const supabase = createClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session?.user ?? null, session);
  });
  return () => subscription.unsubscribe();
}

export async function signOutCurrentUser(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function signInWithGoogleRedirect(redirectTo: string): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  return error?.message ?? null;
}
