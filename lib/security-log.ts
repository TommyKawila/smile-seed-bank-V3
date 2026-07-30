import { logger } from "@/lib/logger";

export type SecurityEventName =
  | "admin_unauthorized"
  | "admin_role_stale_or_demoted"
  | "admin_role_db_check_failed"
  | "webhook_reject"
  | "rate_limit_trip"
  | "order_access_denied";

/** Minimal security signal sink (console today; swap for Sentry later). */
export function logSecurityEvent(
  event: SecurityEventName,
  context: Record<string, unknown> = {}
): void {
  logger.warn(`[security] ${event}`, context);
}
