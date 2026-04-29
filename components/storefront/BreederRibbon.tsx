"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useAnimationFrame, AnimatePresence } from "framer-motion";
import { useBreeders } from "@/hooks/useBreeders";
import { useLanguage } from "@/context/LanguageContext";
import type { Breeder } from "@/types/supabase";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { breederSlugFromName, seedsBreederHref } from "@/lib/breeder-slug";

const ITEM_W = 140;
const ITEM_W_COMPACT = 100;

type BreederTooltipData = { breeder: Breeder; mx: number; my: number };

function BreederRibbonBase({
  compact = false,
  activeBreederSlug = null,
  scrollOnNav = true,
}: {
  compact?: boolean;
  /** Slug from `breederSlugFromName` — matches `?breeder=` in the shop URL */
  activeBreederSlug?: string | null;
  /** When false, router.push(..., { scroll: false }) for in-page updates (e.g. Shop page). */
  scrollOnNav?: boolean;
}) {
  const { breeders } = useBreeders();
  const { t } = useLanguage();
  const router = useRouter();
  const active = useMemo(
    () => breeders.filter((b) => b.is_active && b.logo_url),
    [breeders]
  );
  const totalW = active.length * (compact ? ITEM_W_COMPACT : ITEM_W);
  const items = useMemo(() => [...active, ...active, ...active], [active]);

  const x = useMotionValue(0);
  const isPausedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isMomentumRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>();
  const momentumRafRef = useRef<number>(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartMotionX = useRef(0);
  const lastPointerX = useRef(0);
  const lastPointerTime = useRef(0);
  const velocityRef = useRef(0);
  const clickedHrefRef = useRef<string | null>(null);
  const captureTargetRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<BreederTooltipData | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (totalW > 0) x.set(-totalW);
  }, [totalW]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setInterval(() => {
      if (!isDraggingRef.current && !isMomentumRef.current) isPausedRef.current = false;
    }, 8000);
    return () => clearInterval(id);
  }, []);

  useAnimationFrame((_, delta) => {
    if (isPausedRef.current || isDraggingRef.current || isMomentumRef.current || totalW === 0) return;
    let curr = x.get() - delta * 0.04;
    if (curr < -totalW * 2) curr += totalW;
    if (curr > 0) curr -= totalW;
    x.set(curr);
  });

  const pause = useCallback(() => {
    isPausedRef.current = true;
    clearTimeout(resumeTimer.current);
  }, []);

  const scheduleResume = useCallback(() => {
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { isPausedRef.current = false; }, 3000);
  }, []);

  const wrapToMiddle = useCallback(() => {
    let curr = x.get();
    if (curr < -totalW * 2) curr += totalW;
    if (curr > 0) curr -= totalW;
    x.set(curr);
  }, [x, totalW]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    pause();
    cancelAnimationFrame(momentumRafRef.current);
    isMomentumRef.current = false;
    isDraggingRef.current = true;
    setIsDragging(true);
    setTooltip(null);
    clearTimeout(tooltipTimer.current);
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragStartMotionX.current = x.get();
    lastPointerX.current = e.clientX;
    lastPointerTime.current = performance.now();
    velocityRef.current = 0;
    clickedHrefRef.current = null;
    let el: HTMLElement | null = e.target as HTMLElement;
    const container = e.currentTarget;
    while (el && el !== container) {
      if (el.tagName === "A") {
        const href = el.getAttribute("href");
        if (href) clickedHrefRef.current = href;
        break;
      }
      el = el.parentElement;
    }
    captureTargetRef.current = e.currentTarget;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [pause, x]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    const dx = e.clientX - dragStartX.current;
    let newX = dragStartMotionX.current + dx;
    const hardLeft = -totalW * 2.8;
    if (newX > 0) newX = newX * 0.1;
    if (newX < hardLeft) newX = hardLeft + (newX - hardLeft) * 0.1;
    const now = performance.now();
    const dt = now - lastPointerTime.current;
    if (dt > 0) velocityRef.current = (e.clientX - lastPointerX.current) / dt;
    lastPointerX.current = e.clientX;
    lastPointerTime.current = now;
    x.set(newX);
  }, [totalW, x]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const captureEl = captureTargetRef.current;
    if (captureEl) {
      try { captureEl.releasePointerCapture(e.pointerId); } catch { /* already released */ }
      captureTargetRef.current = null;
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const isClick = dist < 8;
    if (isClick && clickedHrefRef.current) {
      router.push(clickedHrefRef.current, scrollOnNav === false ? { scroll: false } : undefined);
      clickedHrefRef.current = null;
      scheduleResume();
      return;
    }
    clickedHrefRef.current = null;
    isMomentumRef.current = true;
    let momentum = velocityRef.current * 160;
    const tick = () => {
      momentum *= 0.88;
      if (Math.abs(momentum) < 0.4) {
        isMomentumRef.current = false;
        wrapToMiddle();
        scheduleResume();
        return;
      }
      let curr = x.get() + momentum;
      if (curr < -totalW * 2) curr += totalW;
      if (curr > 0) curr -= totalW;
      x.set(curr);
      momentumRafRef.current = requestAnimationFrame(tick);
    };
    momentumRafRef.current = requestAnimationFrame(tick);
  }, [router, scheduleResume, totalW, wrapToMiddle, x]);

  if (active.length === 0) return null;

  const cardSize = compact ? "h-16 w-16 sm:h-20 sm:w-20" : "h-24 w-24 sm:h-28 sm:w-28";
  const innerSize = compact ? "h-10 w-10 sm:h-12 sm:w-12" : "h-16 w-16 sm:h-20 sm:w-20";
  const gapClass = compact ? "gap-3" : "gap-5";

  return (
    <div
      className={`relative select-none py-2 ${compact ? "py-1" : ""} ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{ touchAction: "pan-y", overscrollBehaviorX: "contain" }}
      onMouseEnter={pause}
      onMouseLeave={() => {
        setTooltip(null);
        clearTimeout(tooltipTimer.current);
        if (!isDraggingRef.current && !isMomentumRef.current) scheduleResume();
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

      <AnimatePresence>
        {tooltip && !isDragging && (
          <motion.div
            key="breeder-tip"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-none fixed z-50 w-56 -translate-x-1/2 -translate-y-full rounded-2xl border border-zinc-100 bg-white/90 px-3.5 py-3 shadow-2xl backdrop-blur-md"
            style={{ left: tooltip.mx, top: tooltip.my - 16 }}
          >
            <p className="mb-0.5 text-xs font-bold text-zinc-900">{tooltip.breeder.name}</p>
            <p className="line-clamp-3 text-[11px] leading-relaxed text-zinc-500">
              {t(
                tooltip.breeder.summary_th ?? tooltip.breeder.summary_en ?? tooltip.breeder.description ?? "",
                tooltip.breeder.summary_en ?? tooltip.breeder.summary_th ?? tooltip.breeder.description ?? "",
              ).slice(0, 130)}
            </p>
            <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-zinc-100 bg-white/90" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-hidden">
        <motion.div
          style={{ x }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`flex will-change-transform select-none [&_img]:pointer-events-none ${gapClass}`}
        >
          {items.map((b, i) => {
            const isDuplicate = i >= active.length * 2;
            const hasTooltip = !!(b.summary_th ?? b.summary_en ?? b.description);
            const slug = breederSlugFromName(b.name);
            const isActive =
              activeBreederSlug != null &&
              activeBreederSlug !== "" &&
              slug.toLowerCase() === activeBreederSlug.toLowerCase();

            return (
              <a
                key={`${b.id}-${i}`}
                href={seedsBreederHref(b)}
                draggable={false}
                tabIndex={isDuplicate ? -1 : 0}
                aria-hidden={isDuplicate}
                aria-current={isActive ? "true" : undefined}
                onMouseEnter={(e) => {
                  if (typeof window === "undefined" || !window.matchMedia("(hover: hover)").matches) return;
                  if (!isDraggingRef.current && !isMomentumRef.current && hasTooltip) {
                    clearTimeout(tooltipTimer.current);
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clientX = e.clientX;
                    tooltipTimer.current = setTimeout(() => {
                      setTooltip({ breeder: b, mx: clientX, my: rect.top });
                    }, 120);
                  }
                }}
                onMouseMove={(e) => {
                  if (tooltip?.breeder.id === b.id) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip((prev) => prev ? { ...prev, mx: e.clientX, my: rect.top } : null);
                  }
                }}
                onMouseLeave={() => {
                  clearTimeout(tooltipTimer.current);
                  setTooltip(null);
                }}
                className="group shrink-0 flex flex-col items-center gap-2"
              >
                <div
                  onDragStart={(ev) => ev.preventDefault()}
                  className={`flex items-center justify-center overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-lg ${cardSize} ${
                    isActive ? "ring-2 ring-primary border-primary/40 grayscale-0 opacity-100" : "border-zinc-100"
                  }`}
                >
                  <div
                    className={`relative flex items-center justify-center transition-all duration-300 ${innerSize} ${
                      isActive
                        ? "grayscale-0 opacity-100"
                        : "grayscale-0 opacity-100 lg:grayscale lg:opacity-50 lg:group-hover:grayscale-0 lg:group-hover:opacity-100 lg:group-hover:scale-110"
                    }`}
                  >
                    <BreederLogoImage
                      src={b.logo_url}
                      breederName={b.name}
                      width={compact ? 48 : 80}
                      height={compact ? 48 : 80}
                      className="rounded-xl"
                      imgClassName="object-contain"
                      sizes={
                        compact
                          ? "(max-width: 640px) 40px, 48px"
                          : "(max-width: 640px) 64px, 80px"
                      }
                    />
                  </div>
                </div>
                <p className={`text-center font-medium text-zinc-400 transition-colors duration-200 group-hover:text-primary ${compact ? "text-[10px]" : "text-[11px]"}`}>
                  {b.name}
                </p>
              </a>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

export const BreederRibbon = memo(BreederRibbonBase);
