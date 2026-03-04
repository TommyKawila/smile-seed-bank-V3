"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/types/supabase";

interface AuthState {
  user: User | null;
  customer: Customer | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refetchCustomer: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomer = useCallback(async (uid: string) => {
    const supabase = createClient();
    const { data } = await supabase.from("customers").select("*").eq("id", uid).single();
    setCustomer(data ? (data as unknown as Customer) : null);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchCustomer(u.id).finally(() => setIsLoading(false));
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchCustomer(u.id);
      else setCustomer(null);
    });

    return () => subscription.unsubscribe();
  }, [fetchCustomer]);

  const refetchCustomer = useCallback(async () => {
    if (user) await fetchCustomer(user.id);
  }, [user, fetchCustomer]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setCustomer(null);
  };

  return { user, customer, isLoading, signOut, refetchCustomer };
}
