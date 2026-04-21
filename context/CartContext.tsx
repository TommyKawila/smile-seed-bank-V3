"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/use-auth";

type CartContextValue = ReturnType<typeof useCart> & {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function ClearPromoOnLogout({ clearPromoCode }: { clearPromoCode: () => void }) {
  const { user } = useAuth();
  const prevId = useRef<string | undefined>(undefined);
  useEffect(() => {
    const id = user?.id;
    if (prevId.current && !id) clearPromoCode();
    prevId.current = id;
  }, [user?.id, clearPromoCode]);
  return null;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CartContext.Provider
      value={{
        ...cart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      <ClearPromoOnLogout clearPromoCode={cart.clearPromoCode} />
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used inside <CartProvider>");
  return ctx;
}
