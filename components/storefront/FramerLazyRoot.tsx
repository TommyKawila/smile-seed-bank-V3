"use client";

import { LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

/** Defers `domAnimation` to an async chunk while keeping existing `motion.*` usage (`strict={false}`). */
export function FramerLazyRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion
      strict={false}
      features={async () => {
        const { domAnimation } = await import("framer-motion");
        return domAnimation;
      }}
    >
      {children}
    </LazyMotion>
  );
}
