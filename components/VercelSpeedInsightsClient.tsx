"use client";

import { useEffect, useState, type ComponentType } from "react";

/** Interaction-only — no idle fallback (keeps Speed Insights off PSI critical path). */
export function VercelSpeedInsightsClient() {
  const [active, setActive] = useState(false);
  const [SpeedInsights, setSpeedInsights] = useState<ComponentType | null>(null);

  useEffect(() => {
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setActive(true);
    };
    const passive: AddEventListenerOptions = { passive: true };
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
    void import("@vercel/speed-insights/react")
      .then((m) => {
        if (!cancelled) setSpeedInsights(() => m.SpeedInsights);
      })
      .catch(() => {
        // Optional telemetry — never crash the app
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  if (!SpeedInsights) return null;
  return <SpeedInsights />;
}
