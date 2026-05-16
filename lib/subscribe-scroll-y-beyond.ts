/**
 * Coalesce scroll-driven reads of `window.scrollY` into requestAnimationFrame and
 * skip redundant updates when the boolean threshold result is unchanged.
 */
export function subscribeScrollYBeyond(threshold: number, onBeyond: (beyond: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};

  let rafId = 0;
  let last: boolean | undefined;

  const flush = () => {
    rafId = 0;
    const beyond = window.scrollY > threshold;
    if (last !== beyond) {
      last = beyond;
      onBeyond(beyond);
    }
  };

  const onScroll = () => {
    if (rafId === 0) rafId = window.requestAnimationFrame(flush);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  flush();

  return () => {
    window.removeEventListener("scroll", onScroll);
    if (rafId !== 0) window.cancelAnimationFrame(rafId);
  };
}
