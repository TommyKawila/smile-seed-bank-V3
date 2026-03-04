"use client";

import { createContext, useContext, useState } from "react";
import { useCart } from "@/hooks/useCart";

type CartContextValue = ReturnType<typeof useCart> & {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

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
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used inside <CartProvider>");
  return ctx;
}
