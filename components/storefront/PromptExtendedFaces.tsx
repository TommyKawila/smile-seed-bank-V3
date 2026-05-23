"use client";

import { useEffect } from "react";
import { injectPromptExtendedFaces } from "@/lib/fonts/inject-prompt-extended-faces";
import { scheduleIdleWork } from "@/lib/schedule-idle-work";

/** Loads Prompt 600/700 after idle — keeps inline `@font-face` critical CSS to weight 400 only. */
export function PromptExtendedFaces() {
  useEffect(() => {
    return scheduleIdleWork(() => injectPromptExtendedFaces(), 2500);
  }, []);
  return null;
}
