/** Internal path only — blocks open redirects (//evil.com, https://…). */
export function safeNextPath(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s.startsWith("/") || s.startsWith("//")) return null;
  if (s.includes("://")) return null;
  return s;
}
