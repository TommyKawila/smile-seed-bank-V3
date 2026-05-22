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
import type { Customer } from "@/types/supabase";
import {
  fetchCustomerProfile,
  getCurrentUser,
  signOutCurrentUser,
  subscribeToAuthChanges,
} from "@/services/auth-service";

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
    setCustomer(await fetchCustomerProfile(uid));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      getCurrentUser().then((u) => {
        if (cancelled) return;
        setUser(u);
        if (u) fetchCustomer(u.id).finally(() => !cancelled && setIsLoading(false));
        else setIsLoading(false);
      });
    };

    const idleId =
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback(run, { timeout: 1500 })
        : window.setTimeout(run, 0);

    const unsub = subscribeToAuthChanges((u) => {
      if (cancelled) return;
      setUser(u);
      if (u) fetchCustomer(u.id);
      else setCustomer(null);
    });

    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback !== "undefined" && typeof idleId === "number") {
        cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
      unsub();
    };
  }, [fetchCustomer]);

  const refetchCustomer = useCallback(async () => {
    if (user) await fetchCustomer(user.id);
  }, [user, fetchCustomer]);

  const signOut = useCallback(async () => {
    await signOutCurrentUser();
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
