/** localStorage key — preserved across LINE OAuth (see storefront home + track page). */
export const LIFF_REDIRECT_PATH_KEY = "liff_redirect_path";

/** sessionStorage: auto login attempt counter per tab (prevents liff.login loops). */
export const LIFF_LOGIN_ATTEMPT_KEY = "liff_track_login_attempts";

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

/**
 * Normalize `liff.state` or vault path to `/track/...`.
 * Handles full URLs, path-only, and bare ids (`22`, `/22`).
 */
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

/** Normalize path from localStorage (may be full URL or `/track/id`). */
export function normalizeVaultPathToTrack(raw: string): string {
  const t = raw.trim();
  if (!t) return "/";
  if (/^https?:\/\//i.test(t)) {
    try {
      const path = new URL(t).pathname || "/";
      return normalizeLiffStateToPath(path);
    } catch {
      return normalizeLiffStateToPath(t);
    }
  }
  return normalizeLiffStateToPath(t);
}

export function isLiffClientFeaturesError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("unable to load client features") || m.includes("client features");
}
