"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
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

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setCustomer(null);
  }, []);

  const value = useMemo(
    () => ({ user, customer, isLoading, signOut, refetchCustomer }),
    [user, customer, isLoading, signOut, refetchCustomer]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
