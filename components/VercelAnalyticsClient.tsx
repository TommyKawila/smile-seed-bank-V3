"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { scheduleIdleWork } from "@/lib/schedule-idle-work";

const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((m) => m.Analytics),
  { ssr: false }
);

export function VercelAnalyticsClient() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setActive(true);
    };
    const passive = { passive: true } as const;
    const onInteract = () => scheduleIdleWork(arm, 500);
    const events = ["scroll", "pointerdown", "touchstart", "keydown"] as const;
    for (const e of events) {
      window.addEventListener(e, onInteract, passive);
    }
    const cancel = scheduleIdleWork(arm, 10_000);
    return () => {
      for (const e of events) {
        window.removeEventListener(e, onInteract, passive);
      }
      cancel();
    };
  }, []);

  if (!active) return null;
  return <Analytics />;
}
