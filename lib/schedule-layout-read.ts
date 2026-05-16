/**
 * Run `cb` after the next two animation frames so geometric reads happen after
 * layout/paint, reducing forced reflow when paired with recent DOM/style writes.
 */
export function scheduleLayoutRead(cb: () => void): () => void {
  let cancelled = false;
  let innerId = 0;
  const outerId = requestAnimationFrame(() => {
    if (cancelled) return;
    innerId = requestAnimationFrame(() => {
      innerId = 0;
      if (!cancelled) cb();
    });
  });
  return () => {
    cancelled = true;
    cancelAnimationFrame(outerId);
    if (innerId !== 0) cancelAnimationFrame(innerId);
  };
}
