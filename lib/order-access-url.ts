/** Client-safe URL helpers (no Node crypto). */

export function orderSuccessPathWithAccess(orderNumber: string, t: string, e: string): string {
  const path = `/order-success/${encodeURIComponent(orderNumber)}`;
  if (!t || !e) return path;
  return `${path}?${new URLSearchParams({ t, e }).toString()}`;
}
