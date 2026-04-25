"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
import { CART_FLY_EVENT, CART_HIT_EVENT, type CartFlyEventDetail, getNavCartButtonEl } from "@/lib/cart-fly-events";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

type ActiveFly = CartFlyEventDetail & { id: number };

const FLY_MS = 560;
const FLY_SAFETY_MS = 1000;

function center(rect: Pick<DOMRect, "left" | "top" | "width" | "height">) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function FlyingItem({ detail, onDone }: { detail: ActiveFly; onDone: () => void }) {
  const [pos, setPos] = useState(() => {
    const c = center(detail.startRect);
    return { x: c.x, y: c.y, t: 0, opacity: 1, scale: 1, trail: 0 };
  });
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    const targetEl = getNavCartButtonEl();
    if (!targetEl) {
      onDone();
      return;
    }

    let raf = 0;
    let t560: ReturnType<typeof setTimeout> | undefined;
    let t1000: ReturnType<typeof setTimeout> | undefined;

    const safeFinish = (opts: { hit: boolean }) => {
      if (doneRef.current) return;
      doneRef.current = true;
      cancelAnimationFrame(raf);
      if (t560 !== undefined) clearTimeout(t560);
      if (t1000 !== undefined) clearTimeout(t1000);
      try {
        if (opts.hit && typeof window !== "undefined") {
          window.dispatchEvent(new Event(CART_HIT_EVENT));
        }
      } catch {
        /* ignore */
      }
      onDone();
    };

    try {
      const tr = targetEl.getBoundingClientRect();
      const end = center(tr);
      const start = center(detail.startRect);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.hypot(dx, dy) || 1;
      const arcH = Math.min(120, 40 + dist * 0.12);
      const t0 = performance.now();

      t560 = setTimeout(() => {
        safeFinish({ hit: true });
      }, FLY_MS);
      t1000 = setTimeout(() => {
        safeFinish({ hit: false });
      }, FLY_SAFETY_MS);

      const tick = (now: number) => {
        try {
          const rawT = Math.min(1, (now - t0) / FLY_MS);
          const easeT = rawT * rawT * (3 - 2 * rawT);
          const x = start.x + dx * easeT;
          const y = start.y + dy * easeT - 4 * arcH * rawT * (1 - rawT);
          const fade = rawT < 0.88 ? 1 : 1 - (rawT - 0.88) / 0.12;
          const sc = rawT < 0.88 ? 1 : 1 - 0.45 * ((rawT - 0.88) / 0.12);
          setPos({ x, y, t: rawT, opacity: fade, scale: sc, trail: rawT });
          if (rawT < 1) {
            raf = requestAnimationFrame(tick);
          } else {
            safeFinish({ hit: true });
          }
        } catch {
          safeFinish({ hit: true });
        }
      };
      raf = requestAnimationFrame(tick);
    } catch {
      safeFinish({ hit: false });
    }

    return () => {
      cancelAnimationFrame(raf);
      if (t560 !== undefined) clearTimeout(t560);
      if (t1000 !== undefined) clearTimeout(t1000);
    };
  }, [detail, onDone]);

  const glow = 10 + pos.trail * 10;
  return (
    <div
      className="pointer-events-none fixed z-[9998] font-sans"
      style={{
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -50%) scale(${pos.scale})`,
        opacity: pos.opacity,
        willChange: "transform, opacity",
      }}
    >
      <div
        className="relative flex h-11 w-11 flex-col items-center justify-center overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/95 shadow-lg ring-2 ring-emerald-400/25"
        style={{ boxShadow: `0 6px ${glow}px -4px rgba(16, 185, 129, 0.4)` }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_20%,rgba(16,185,129,0.25),transparent_60%)]"
          aria-hidden
        />
        {detail.productImage ? (
          <div className="relative z-[1] h-7 w-7 overflow-hidden rounded-md ring-1 ring-white/50">
            <Image
              src={detail.productImage}
              alt=""
              width={28}
              height={28}
              className="h-full w-full object-cover"
              unoptimized={shouldOffloadImageOptimization(detail.productImage)}
            />
          </div>
        ) : (
          <Sprout className="relative z-[1] h-6 w-6 text-emerald-700" strokeWidth={2.25} aria-hidden />
        )}
        <p className="relative z-[1] max-w-[2.6rem] truncate px-0.5 text-[7px] font-semibold leading-tight text-zinc-700">
          {detail.productName}
        </p>
      </div>
    </div>
  );
}

/** Portal: live region + flying “seed pack” chips toward the nav cart button. */
export function CartAnimation() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<ActiveFly[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onFly = useCallback((ev: Event) => {
    const e = ev as CustomEvent<CartFlyEventDetail>;
    const d = e.detail;
    if (!d?.startRect) return;
    if (typeof document !== "undefined" && !getNavCartButtonEl()) {
      toast.success("Added to cart", { description: "เพิ่มลงตะกร้าแล้ว" });
      return;
    }
    const id = ++idRef.current;
    setItems((prev) => [...prev, { ...d, id }]);
  }, []);

  useEffect(() => {
    window.addEventListener(CART_FLY_EVENT, onFly);
    return () => window.removeEventListener(CART_FLY_EVENT, onFly);
  }, [onFly]);

  const doneOne = useCallback((id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div id="ssb-cart-announcer" className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
      {items.map((d) => (
        <FlyingItem key={d.id} detail={d} onDone={() => doneOne(d.id)} />
      ))}
    </>,
    document.body
  );
}

export function requestCartFlyAnimation(
  startEl: HTMLElement,
  args: {
    productName: string;
    productImage: string | null;
    locale: "th" | "en";
    announceTh: string;
    announceEn: string;
  }
): void {
  if (typeof window === "undefined") return;
  const live = document.getElementById("ssb-cart-announcer");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (live) live.textContent = args.locale === "th" ? args.announceTh : args.announceEn;
    return;
  }
  if (!getNavCartButtonEl()) {
    if (live) live.textContent = args.locale === "th" ? args.announceTh : args.announceEn;
    if (args.locale === "th") {
      toast.success("เพิ่มลงตะกร้าแล้ว");
    } else {
      toast.success("Added to cart");
    }
    return;
  }
  const r = startEl.getBoundingClientRect();
  window.dispatchEvent(
    new CustomEvent<CartFlyEventDetail>(CART_FLY_EVENT, {
      detail: {
        startRect: { left: r.left, top: r.top, width: r.width, height: r.height },
        productName: args.productName,
        productImage: args.productImage,
      },
    })
  );
  if (live) {
    live.textContent = args.locale === "th" ? args.announceTh : args.announceEn;
  }
}
