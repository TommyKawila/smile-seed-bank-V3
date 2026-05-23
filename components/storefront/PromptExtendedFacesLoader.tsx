"use client";

import { useEffect } from "react";
import { injectPromptExtendedFaces } from "@/lib/fonts/inject-prompt-extended-faces";
import { scheduleIdleWork } from "@/lib/schedule-idle-work";

const PROMPT_EXTENDED_IDLE_MS = 3_500;

/** Off critical path — 600/700 faces after LCP idle window. */
export function PromptExtendedFacesLoader() {
  useEffect(() => {
    return scheduleIdleWork(injectPromptExtendedFaces, PROMPT_EXTENDED_IDLE_MS);
  }, []);
  return null;
}
