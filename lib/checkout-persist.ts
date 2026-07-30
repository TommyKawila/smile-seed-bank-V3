import { z } from "zod";

export const STOREFRONT_CHECKOUT_LS_KEY = "smb.storefront.checkout.payment.v1";

const PersistSchemaV2 = z.object({
  v: z.literal(2),
  orderNumber: z.string().min(4),
  t: z.string().min(1),
  e: z.string().min(1),
  phase: z.literal("payment"),
  savedAt: z.string(),
});

/** Legacy v1 (no access token) — cleared on restore failure. */
const PersistSchemaV1 = z.object({
  v: z.literal(1),
  orderNumber: z.string().min(4),
  phase: z.literal("payment"),
  savedAt: z.string(),
});

export type PersistedCheckoutState = z.infer<typeof PersistSchemaV2>;

export function readPersistedCheckout(): PersistedCheckoutState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STOREFRONT_CHECKOUT_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    const v2 = PersistSchemaV2.safeParse(parsed);
    if (v2.success) return v2.data;
    const v1 = PersistSchemaV1.safeParse(parsed);
    if (v1.success) {
      // Legacy without token cannot call hardened APIs — drop.
      window.localStorage.removeItem(STOREFRONT_CHECKOUT_LS_KEY);
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

export function persistCheckoutPendingPayment(
  orderNumber: string,
  access: { t: string; e: string }
): void {
  if (typeof window === "undefined") return;
  const t = access.t.trim();
  const e = access.e.trim();
  if (!t || !e) return;
  const payload: PersistedCheckoutState = {
    v: 2,
    orderNumber: orderNumber.trim(),
    t,
    e,
    phase: "payment",
    savedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STOREFRONT_CHECKOUT_LS_KEY, JSON.stringify(payload));
}

export function clearCheckoutPersistence(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STOREFRONT_CHECKOUT_LS_KEY);
  } catch {
    /* ignore */
  }
}
