"use client";

import { useEffect, useState } from "react";

/** True after the first client effect — use to defer browser-only subtrees without SSR/client HTML drift on pass 1. */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
