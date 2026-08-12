"use client";

import {
  forwardRef,
  useCallback,
  useMemo,
  type CSSProperties,
} from "react";
import { Rnd } from "react-rnd";
import { LabelGraphic } from "@/components/mockup/LabelGraphic";
import type { SeedLabelData } from "@/types/label";

const BASE_W = 280;
const BASE_H = 360;

type Props = {
  data: SeedLabelData;
  interactive?: boolean;
  onPositionChange?: (patch: {
    x?: number;
    y?: number;
    scale?: number;
  }) => void;
  className?: string;
};

export const VisualPreview = forwardRef<HTMLDivElement, Props>(
  function VisualPreview(
    { data, interactive = false, onPositionChange, className },
    ref
  ) {
    const { x, y, scale, rotation } = data.labelPosition;
    const w = Math.round(BASE_W * scale);
    const h = Math.round(BASE_H * scale);

    const labelStyle = useMemo(
      () =>
        ({
          width: "100%",
          height: "100%",
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "center center",
        }) as CSSProperties,
      [rotation]
    );

    const onDragStop = useCallback(
      (_e: unknown, d: { x: number; y: number }) => {
        onPositionChange?.({ x: d.x, y: d.y });
      },
      [onPositionChange]
    );

    const onResizeStop = useCallback(
      (
        _e: unknown,
        _dir: unknown,
        el: HTMLElement,
        _delta: unknown,
        pos: { x: number; y: number }
      ) => {
        const nextScale = el.offsetWidth / BASE_W;
        onPositionChange?.({
          x: pos.x,
          y: pos.y,
          scale: Math.max(0.2, Math.min(3, nextScale)),
        });
      },
      [onPositionChange]
    );

    const overlay = interactive ? (
      <Rnd
        size={{ width: w, height: h }}
        position={{ x, y }}
        bounds="parent"
        onDragStop={onDragStop}
        onResizeStop={onResizeStop}
        enableResizing={{
          bottomRight: true,
          bottom: true,
          right: true,
        }}
        className="z-10"
        style={{ zIndex: 10 }}
      >
        <div style={labelStyle} className="h-full w-full overflow-hidden">
          <LabelGraphic
            data={data}
            className="box-border h-full w-full select-none overflow-auto bg-white text-black border border-black p-2.5 font-sans leading-tight shadow-sm"
          />
        </div>
      </Rnd>
    ) : (
      <div
        className="absolute z-10"
        style={{
          left: x,
          top: y,
          width: w,
          height: h,
          ...labelStyle,
        }}
      >
        <LabelGraphic
          data={data}
          className="box-border h-full w-full overflow-auto bg-white text-black border border-black p-2.5 font-sans leading-tight"
        />
      </div>
    );

    return (
      <div
        ref={ref}
        className={
          className ??
          "relative w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100"
        }
        style={{ minHeight: 420, aspectRatio: "4 / 5" }}
      >
        {data.bgImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.bgImageUrl}
            alt="Package"
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Upload a package image
          </div>
        )}
        {overlay}
      </div>
    );
  }
);
