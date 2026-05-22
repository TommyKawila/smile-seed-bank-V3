/** Defer non-LCP client work until after first paint (fallback: short timeout). */
export function scheduleIdleWork(task: () => void, timeoutMs = 3000): () => void {
  if (typeof requestIdleCallback !== "undefined") {
    const id = requestIdleCallback(task, { timeout: timeoutMs });
    return () => cancelIdleCallback(id);
  }
  const id = window.setTimeout(task, 50);
  return () => window.clearTimeout(id);
}
