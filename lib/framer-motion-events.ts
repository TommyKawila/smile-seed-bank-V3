export const FRAMER_MOTION_NEEDED_EVENT = "ssb:framer-motion-needed";

export function signalFramerMotionNeeded(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FRAMER_MOTION_NEEDED_EVENT));
}
