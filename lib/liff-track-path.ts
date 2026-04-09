/** Shared LIFF `liff.state` → app path (used by storefront home redirect). */

export function fullyDecodeState(value: string): string {
  let s = value.trim();
  for (let i = 0; i < 8; i++) {
    try {
      const next = decodeURIComponent(s);
      if (next === s) break;
      s = next;
    } catch {
      break;
    }
  }
  return s;
}

/** Normalize raw `liff.state` to a path starting with `/track/...`. */
export function normalizeLiffStateToPath(raw: string): string {
  let targetPath = fullyDecodeState(raw);

  if (/^https?:\/\//i.test(targetPath)) {
    try {
      const u = new URL(targetPath);
      targetPath = u.pathname || "/";
    } catch {
      /* keep */
    }
  }

  const pathOnly = targetPath.split("?")[0]?.split("#")[0] ?? targetPath;

  targetPath = pathOnly;
  if (!targetPath.startsWith("/track")) {
    targetPath = `/track${targetPath.startsWith("/") ? "" : "/"}${targetPath}`;
  }

  return targetPath;
}
