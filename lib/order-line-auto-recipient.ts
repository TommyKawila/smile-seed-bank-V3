/**
 * Automated LINE pushes (Flex, payment-confirmed text, payment reminders)
 * must use only `orders.line_user_id`.
 *
 * Never fall back to `customers.line_user_id` — profile links are often stale
 * (admin test accounts, shared emails, prior OA claims) and reopen wrong-chat sends.
 */
export function lineUserIdForAutomatedOrderNotify(
  orderLineUserId: string | null | undefined
): string | null {
  const uid = orderLineUserId?.trim();
  return uid || null;
}
