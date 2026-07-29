import { scheduleIdleWork } from "@/lib/schedule-idle-work";

const INTERACTION_EVENTS = ["scroll", "pointerdown", "keydown", "touchstart"] as const;

/** Mount after first user gesture or wall-clock fallback — PSI lab (no interaction) waits full fallbackMs. */
export function scheduleInteractionMount(onMount: () => void, fallbackMs = 12_000): () => void {
  let done = false;
  let cancelFallback: (() => void) | null = null;
  const passive = { passive: true, capture: true } as const;

  const mount = () => {
    if (done) return;
    done = true;
    for (const e of INTERACTION_EVENTS) {
      window.removeEventListener(e, onInteract, passive);
    }
    cancelFallback?.();
    onMount();
  };

  const onInteract = () => scheduleIdleWork(mount, 150);

  for (const e of INTERACTION_EVENTS) {
    window.addEventListener(e, onInteract, passive);
  }
  const fallbackId = window.setTimeout(mount, fallbackMs);
  cancelFallback = () => window.clearTimeout(fallbackId);

  return () => {
    if (done) return;
    done = true;
    for (const e of INTERACTION_EVENTS) {
      window.removeEventListener(e, onInteract, passive);
    }
    cancelFallback?.();
  };
}
