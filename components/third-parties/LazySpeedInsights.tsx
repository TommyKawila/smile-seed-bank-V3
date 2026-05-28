"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
  { ssr: false }
);

export function LazySpeedInsights() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setActive(true);
    };
    const passive = { passive: true } as const;
    const events = ["scroll", "pointerdown", "touchstart", "keydown"] as const;

    for (const eventName of events) {
      window.addEventListener(eventName, arm, passive);
    }

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, arm, passive);
      }
    };
  }, []);

  if (!active) return null;
  return <SpeedInsights />;
}
