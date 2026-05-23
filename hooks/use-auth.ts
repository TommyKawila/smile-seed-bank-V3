"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { Customer } from "@/types/supabase";

interface AuthState {
  user: User | null;
  customer: Customer | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refetchCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Defer Supabase auth chunk off homepage LCP / PSI window. */
const AUTH_BOOT_IDLE_MS = 10_000;

type AuthServiceModule = typeof import("@/services/auth-service");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  /** Guest-first — avoid blocking navbar / age gate until idle auth boot runs. */
  const [isLoading, setIsLoading] = useState(false);
  const authRef = useRef<AuthServiceModule | null>(null);

  const getAuth = useCallback(async (): Promise<AuthServiceModule> => {
    if (!authRef.current) {
      authRef.current = await import("@/services/auth-service");
    }
    return authRef.current;
  }, []);

  const fetchCustomer = useCallback(
    async (uid: string) => {
      const auth = await getAuth();
      setCustomer(await auth.fetchCustomerProfile(uid));
    },
    [getAuth]
  );

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    const boot = async () => {
      if (!cancelled) setIsLoading(true);
      const auth = await getAuth();
      if (cancelled) return;
      const u = await auth.getCurrentUser();
      if (cancelled) return;
      setUser(u);
      if (u) await fetchCustomer(u.id);
      if (!cancelled) setIsLoading(false);
      unsub = auth.subscribeToAuthChanges((nextUser) => {
        if (cancelled) return;
        setUser(nextUser);
        if (nextUser) void fetchCustomer(nextUser.id);
        else setCustomer(null);
      });
    };

    const idleId =
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback(() => void boot(), { timeout: AUTH_BOOT_IDLE_MS })
        : window.setTimeout(() => void boot(), AUTH_BOOT_IDLE_MS);

    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback !== "undefined" && typeof idleId === "number") {
        cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
      unsub?.();
    };
  }, [fetchCustomer, getAuth]);

  const refetchCustomer = useCallback(async () => {
    if (user) await fetchCustomer(user.id);
  }, [user, fetchCustomer]);

  const signOut = useCallback(async () => {
    const auth = await getAuth();
    await auth.signOutCurrentUser();
    setUser(null);
    setCustomer(null);
  }, [getAuth]);

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
