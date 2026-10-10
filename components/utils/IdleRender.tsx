"use client";

import { useEffect, useState, type ReactNode } from "react";

export function IdleRender({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const callback = () => setIsMounted(true);
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(callback, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timeoutId = globalThis.setTimeout(callback, 200);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  if (!isMounted) return null;
  return <>{children}</>;
}
