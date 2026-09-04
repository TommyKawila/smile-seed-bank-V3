"use client";

import { LabelGraphic } from "@/components/mockup/LabelGraphic";
import type { SeedLabelData } from "@/types/label";

const DESIGN_W = 360;

type Props = {
  data: SeedLabelData;
  width: number;
  height: number;
  className?: string;
  frameClassName?: string;
  rotation?: number;
};

/** Render the legal label at a fixed design width, then scale uniformly to the sticker box. */
export function FittedLabelGraphic({
  data,
  width,
  height,
  className,
  frameClassName,
  rotation = 0,
}: Props) {
  const scale = width > 0 ? width / DESIGN_W : 1;

  return (
    <div
      className={
        frameClassName ??
        "relative box-border overflow-hidden bg-white"
      }
      style={{
        width,
        height,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "center center",
      }}
    >
      <div
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
