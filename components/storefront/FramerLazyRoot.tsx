"use client";

import { LazyMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { FRAMER_MOTION_NEEDED_EVENT } from "@/lib/framer-motion-events";
import { scheduleInteractionMount } from "@/lib/schedule-interaction-mount";

const FRAMER_IDLE_FALLBACK_MS = 2_500;

type DomAnimation = typeof import("framer-motion").domAnimation;

/**
 * Keep LazyMotion mounted (no remount of layout children) but delay loading
 * `domAnimation` until interaction, `ssb:framer-motion-needed`, or idle ≥2.5s.
 */
export function FramerLazyRoot({ children }: { children: ReactNode }) {
  const [featuresGate] = useState(() => {
    let resolveFeatures: ((features: DomAnimation) => void) | null = null;
    const promise = new Promise<DomAnimation>((resolve) => {
      resolveFeatures = resolve;
    });
    return {
      promise,
      resolve: (features: DomAnimation) => resolveFeatures?.(features),
    };
  });

  useEffect(() => {
    let started = false;
    const startLoad = () => {
      if (started) return;
      started = true;
      void import("framer-motion").then((m) => {
        featuresGate.resolve(m.domAnimation);
      });
    };

    window.addEventListener(FRAMER_MOTION_NEEDED_EVENT, startLoad);
    const cancel = scheduleInteractionMount(startLoad, FRAMER_IDLE_FALLBACK_MS);
    return () => {
      window.removeEventListener(FRAMER_MOTION_NEEDED_EVENT, startLoad);
      cancel();
    };
  }, [featuresGate]);

  return (
    <LazyMotion strict={false} features={() => featuresGate.promise}>
      {children}
    </LazyMotion>
  );
}
