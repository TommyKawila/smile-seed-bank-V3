import { z } from "zod";

export const STOREFRONT_CHECKOUT_LS_KEY = "smb.storefront.checkout.payment.v1";

const PersistSchema = z.object({
  v: z.literal(1),
  orderNumber: z.string().min(4),
  phase: z.literal("payment"),
  savedAt: z.string(),
});

export type PersistedCheckoutState = z.infer<typeof PersistSchema>;

export function readPersistedCheckout(): PersistedCheckoutState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STOREFRONT_CHECKOUT_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    const ok = PersistSchema.safeParse(parsed);
    return ok.success ? ok.data : null;
  } catch {
    return null;
  }
}

export function persistCheckoutPendingPayment(orderNumber: string): void {
  if (typeof window === "undefined") return;
  const payload: PersistedCheckoutState = {
    v: 1,
    orderNumber: orderNumber.trim(),
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
