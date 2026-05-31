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
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Customer } from "@/types/supabase";
import type { StorefrontSessionHint } from "@/lib/storefront-session-hint";
import { scheduleIdleWork } from "@/lib/schedule-idle-work";

interface AuthState {
  user: User | null;
  customer: Customer | null;
  sessionHint: StorefrontSessionHint;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refetchCustomer: () => Promise<void>;
  ensureAuthLoaded: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Non-home routes: boot after idle. Home: interaction / navigation / ensureAuthLoaded only. */
const AUTH_BOOT_IDLE_MS = 3_000;

type AuthServiceModule = typeof import("@/services/auth-service");

function sessionHintFromUser(user: User | null): StorefrontSessionHint {
  return user?.id ? { userId: user.id, email: user.email ?? null } : null;
}

export function AuthProvider({
  children,
  initialSessionHint = null,
}: {
  children: ReactNode;
  initialSessionHint?: StorefrontSessionHint;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sessionHint, setSessionHint] = useState<StorefrontSessionHint>(initialSessionHint);
  const [isLoading, setIsLoading] = useState(false);
  const authRef = useRef<AuthServiceModule | null>(null);
  const bootStartedRef = useRef(false);
  const bootPromiseRef = useRef<Promise<void> | null>(null);
  const unsubRef = useRef<(() => void) | undefined>(undefined);
  const shouldAwaitSessionBoot =
    pathname !== "/" && Boolean(sessionHint) && !user && !bootStartedRef.current;

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

  const runBoot = useCallback(async () => {
    if (bootStartedRef.current && bootPromiseRef.current) {
      return bootPromiseRef.current;
    }
    bootStartedRef.current = true;
    const promise = (async () => {
      setIsLoading(true);
      try {
        const auth = await getAuth();
        const u = await auth.getCurrentUser();
        setUser(u);
        setSessionHint(sessionHintFromUser(u));
        if (u) await fetchCustomer(u.id);
        unsubRef.current?.();
        unsubRef.current = auth.subscribeToAuthChanges((nextUser) => {
          setUser(nextUser);
          setSessionHint(sessionHintFromUser(nextUser));
          if (nextUser) void fetchCustomer(nextUser.id);
          else setCustomer(null);
        });
      } finally {
        setIsLoading(false);
      }
    })();
    bootPromiseRef.current = promise;
    return promise;
  }, [fetchCustomer, getAuth]);

  const ensureAuthLoaded = useCallback(async () => {
    await runBoot();
  }, [runBoot]);

  useEffect(() => {
    if (pathname === "/") return;
    if (sessionHint && !user) {
      void runBoot();
      return;
    }
    return scheduleIdleWork(() => {
      void runBoot();
    }, AUTH_BOOT_IDLE_MS);
  }, [pathname, runBoot, sessionHint, user]);

  useEffect(() => {
    return () => {
      unsubRef.current?.();
    };
  }, []);

  const refetchCustomer = useCallback(async () => {
    await ensureAuthLoaded();
    if (user) await fetchCustomer(user.id);
  }, [user, fetchCustomer, ensureAuthLoaded]);

  const signOut = useCallback(async () => {
    await ensureAuthLoaded();
    const auth = await getAuth();
    await auth.signOutCurrentUser();
    setUser(null);
    setCustomer(null);
    setSessionHint(null);
  }, [getAuth, ensureAuthLoaded]);

  const value = useMemo(
    () => ({
      user,
      customer,
      sessionHint,
      isLoading: isLoading || shouldAwaitSessionBoot,
      signOut,
      refetchCustomer,
      ensureAuthLoaded,
    }),
    [
      user,
      customer,
      sessionHint,
      isLoading,
      shouldAwaitSessionBoot,
      signOut,
      refetchCustomer,
      ensureAuthLoaded,
    ]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Navbar / gates: SSR hint or hydrated Supabase user. */
export function useStorefrontSignedIn(): boolean {
  const { user, sessionHint } = useAuth();
  return Boolean(user) || Boolean(sessionHint);
}
