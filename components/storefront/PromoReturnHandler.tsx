"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useCartContext } from "@/context/CartContext";
import { useAuth } from "@/hooks/use-auth";

export function PromoReturnHandler() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, customer } = useAuth();
  const { applyPromoCode, openCart } = useCartContext();
  const appliedRef = useRef(false);

  useEffect(() => {
    const promo = searchParams.get("promo");
    if (!promo || !user || appliedRef.current) return;

    appliedRef.current = true;
    void applyPromoCode(promo, user.email ?? null, customer?.phone ?? null, user.id).then((r) => {
      if (r.success && !pathname?.startsWith("/checkout")) openCart();
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("promo");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [searchParams, pathname, user, customer, applyPromoCode, openCart]);

  return null;
}
