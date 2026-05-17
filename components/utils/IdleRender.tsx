"use client";

import { useEffect, useState, type ReactNode } from "react";

export function IdleRender({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const callback = () => setIsMounted(true);
      if ("requestIdleCallback" in window) {
        const idleId = window.requestIdleCallback(callback, { timeout: 2000 });
        return () => window.cancelIdleCallback(idleId);
      }
      const timeoutId = window.setTimeout(callback, 200);
      return () => window.clearTimeout(timeoutId);
    }
  }, []);

  if (!isMounted) return null;
  return <>{children}</>;
}
