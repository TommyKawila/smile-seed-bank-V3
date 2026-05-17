"use client";

import { LazyMotion, domMax } from "framer-motion";
import type { ReactNode } from "react";

export function FramerLazyRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict={false}>
      {children}
    </LazyMotion>
  );
}
