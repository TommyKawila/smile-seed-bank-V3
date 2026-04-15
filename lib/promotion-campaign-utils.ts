/** Normalize pathname for campaign targeting (no query, trim trailing slash). */
export function normalizeStorePath(path: string): string {
  const base = path.split("?")[0] ?? "/";
  if (base === "" || base === "/") return "/";
  const trimmed = base.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function pathMatchesCampaignTargets(currentPath: string, targets: string[]): boolean {
  const c = normalizeStorePath(currentPath);
  return targets.some((t) => normalizeStorePath(t) === c);
}
