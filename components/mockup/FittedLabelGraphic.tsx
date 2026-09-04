"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { LabelGraphic } from "@/components/mockup/LabelGraphic";
import type { SeedLabelData } from "@/types/label";

const DESIGN_W = 360;

type Props = {
  data: SeedLabelData;
  width: number;
  height: number;
  className?: string;
  rotation?: number;
};

/** Render the legal label at a fixed design width, then scale it to fit the sticker box. */
export function FittedLabelGraphic({
  data,
  width,
  height,
  className,
  rotation = 0,
}: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const el = innerRef.current;
    if (!el || width <= 0 || height <= 0) return;
    const contentH = Math.max(1, el.scrollHeight);
    setScale(Math.min(width / DESIGN_W, height / contentH));
  }, [width, height, data]);

  useLayoutEffect(() => {
    measure();
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width,
        height,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "center center",
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: DESIGN_W,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <LabelGraphic data={data} className={className} />
      </div>
    </div>
  );
}
