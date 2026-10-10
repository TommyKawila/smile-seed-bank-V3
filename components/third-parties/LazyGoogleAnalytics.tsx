"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

/** Interaction-only — no mousemove (PSI simulates it and pulls pagead onto critical path). */
export function LazyGoogleAnalytics({ gaId }: { gaId: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const id = gaId.trim();
    if (!id) return;

    const passive: AddEventListenerOptions = { passive: true };
    let done = false;

    const onFirstInteraction = () => {
      if (done) return;
      done = true;
      setActive(true);
      window.removeEventListener("scroll", onFirstInteraction, passive);
      window.removeEventListener("touchstart", onFirstInteraction, passive);
      window.removeEventListener("click", onFirstInteraction, passive);
      window.removeEventListener("keydown", onFirstInteraction);
    };

    window.addEventListener("scroll", onFirstInteraction, passive);
    window.addEventListener("touchstart", onFirstInteraction, passive);
    window.addEventListener("click", onFirstInteraction, passive);
    window.addEventListener("keydown", onFirstInteraction);

    return () => {
      window.removeEventListener("scroll", onFirstInteraction, passive);
      window.removeEventListener("touchstart", onFirstInteraction, passive);
      window.removeEventListener("click", onFirstInteraction, passive);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, [gaId]);

  if (!gaId.trim() || !active) return null;
  return <GoogleAnalytics gaId={gaId.trim()} />;
}
