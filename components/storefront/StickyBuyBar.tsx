"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"

type StickyBuyBarProps = {
  visible: boolean
  productName: string
  priceLabel: string
  outOfStock: boolean
  addLabel: string
  outOfStockLabel: string
  lowStock: boolean
  lowStockLabel: string
  disabled: boolean
  onAdd: (e: React.MouseEvent<HTMLButtonElement>) => void
}

const safeBar =
  "border-t border-zinc-200/90 bg-white/80 p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-lg pb-[max(0.75rem,env(safe-area-inset-bottom))] max-lg:pr-24"

export function StickyBuyBar({
  visible,
  productName,
  priceLabel,
  outOfStock,
  addLabel,
  outOfStockLabel,
  lowStock,
  lowStockLabel,
  disabled,
  onAdd,
}: StickyBuyBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="product-sticky-buy"
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.7 }}
          className="fixed bottom-0 left-0 right-0 z-50 font-sans lg:hidden"
          role="region"
          aria-label="Quick add to cart"
        >
          <div className={cn(safeBar)}>
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
              <div className="min-w-0 flex-1 pr-2">
                <p
                  className="truncate text-[11px] text-zinc-500 sm:text-xs"
                  title={productName}
                >
                  {productName}
                </p>
                <p className="font-sans text-lg font-bold tabular-nums text-zinc-900 sm:text-xl">
                  {outOfStock ? "—" : priceLabel}
                </p>
              </div>
              <div className="relative flex shrink-0 flex-col items-end gap-0.5">
                {lowStock && (
                  <span className="rounded border border-amber-200/80 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-amber-900">
                    {lowStockLabel}
                  </span>
                )}
                <button
                  type="button"
                  onClick={onAdd}
                  disabled={disabled}
                  className={cn(
                    "inline-flex h-10 min-w-[7rem] items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold text-white shadow-md transition",
                    "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  )}
                >
                  <ShoppingCart className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
                  {outOfStock ? outOfStockLabel : addLabel}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
