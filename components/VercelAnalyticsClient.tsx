"use client";

import { useEffect, useState, type ComponentType } from "react";

/** Interaction-only — no idle fallback (keeps /events off PSI critical path). */
export function VercelAnalyticsClient() {
  const [active, setActive] = useState(false);
  const [Analytics, setAnalytics] = useState<ComponentType | null>(null);

  useEffect(() => {
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setActive(true);
    };
    const passive = { passive: true } as const;
    const onInteract = () => arm();
    const events = ["scroll", "pointerdown", "touchstart", "keydown"] as const;
    for (const e of events) {
      window.addEventListener(e, onInteract, passive);
    }
    return () => {
      for (const e of events) {
        window.removeEventListener(e, onInteract, passive);
      }
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void import("@vercel/analytics/react")
      .then((m) => {
        if (!cancelled) setAnalytics(() => m.Analytics);
      })
      .catch(() => {
        // Stale dev chunk / offline — analytics optional; never crash the app
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  if (!Analytics) return null;
  return <Analytics />;
}
