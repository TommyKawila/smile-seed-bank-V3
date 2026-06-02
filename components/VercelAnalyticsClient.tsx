"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((m) => m.Analytics),
  { ssr: false }
);

/** Interaction-only — no idle fallback (keeps /events off PSI critical path). */
export function VercelAnalyticsClient() {
  const [active, setActive] = useState(false);

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

  if (!active) return null;
  return <Analytics />;
}
