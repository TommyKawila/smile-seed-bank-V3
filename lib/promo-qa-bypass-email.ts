/**
 * Hardcoded storefront QA email: bypass first-order and per-user promo redemption limits
 * when combined with verified session (see coupon-usage-admin-bypass) or server-side guard email.
 */
const PROMO_QA_BYPASS_EMAIL = "tommykawila@gmail.com";

export function isPromoQaBypassEmail(email: string | null | undefined): boolean {
  const e = email?.trim().toLowerCase();
  return e === PROMO_QA_BYPASS_EMAIL;
}
