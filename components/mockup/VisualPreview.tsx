"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from "react";
import { Rnd } from "react-rnd";
import { LabelGraphic } from "@/components/mockup/LabelGraphic";
import { stickerPxFromCm } from "@/lib/mockup-dimensions";
import type { SeedLabelData } from "@/types/label";

type ImgBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

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
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [imgBounds, setImgBounds] = useState<ImgBounds>({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    });

    const { x, y, scale, rotation } = data.labelPosition;

    const measureImage = useCallback(() => {
      const container = containerRef.current;
      const img = imgRef.current;
      if (!container || !img || !data.bgImageUrl) {
        setImgBounds({ left: 0, top: 0, width: 0, height: 0 });
        return;
      }
      const cr = container.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      setImgBounds({
        left: ir.left - cr.left,
        top: ir.top - cr.top,
        width: ir.width,
        height: ir.height,
      });
    }, [data.bgImageUrl]);

    useEffect(() => {
      measureImage();
      const container = containerRef.current;
      if (!container) return;
      const ro = new ResizeObserver(() => measureImage());
      ro.observe(container);
      return () => ro.disconnect();
    }, [measureImage]);

    const { width: w, height: h } = useMemo(() => {
      if (imgBounds.width > 0) {
        return stickerPxFromCm(
          data.labelSizeCm,
          imgBounds.width,
          undefined,
          scale
        );
      }
      return {
        width: Math.round(140 * scale),
        height: Math.round(140 * scale),
      };
    }, [data.labelSizeCm, imgBounds.width, scale]);

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
        const base = stickerPxFromCm(data.labelSizeCm, imgBounds.width || 1);
        const nextScale = el.offsetWidth / Math.max(1, base.width);
        onPositionChange?.({
          x: pos.x,
          y: pos.y,
          scale: Math.max(0.2, Math.min(3, nextScale)),
        });
      },
      [data.labelSizeCm, imgBounds.width, onPositionChange]
    );

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
          return;
        }
        if (ref) (ref as MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [ref]
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
            className="box-border h-full w-full select-none overflow-auto bg-white text-black border-2 border-dashed border-[#12463e]/60 p-2 font-sans leading-tight shadow-sm"
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
          className="box-border h-full w-full overflow-auto bg-white text-black border-2 border-dashed border-[#12463e]/60 p-2 font-sans leading-tight"
        />
      </div>
    );

    const guideRect =
      imgBounds.width > 0 ? (
        <div
          className="pointer-events-none absolute z-[5] border border-dashed border-amber-500/70 bg-amber-400/5"
          style={{
            left: imgBounds.left,
            top: imgBounds.top,
            width: imgBounds.width,
            height: imgBounds.height,
          }}
          aria-hidden
        />
      ) : null;

    return (
      <div
        ref={setRefs}
        className={
          className ??
          "relative w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100"
        }
        style={{ minHeight: 420, aspectRatio: "4 / 5" }}
      >
        {data.bgImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={data.bgImageUrl}
            alt="Package"
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
            onLoad={measureImage}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center text-sm text-slate-400">
            <p>Upload a package photo</p>
            <p className="text-xs">7 × 10 cm pack · rear sticker 5.5 × 5.5 cm</p>
          </div>
        )}
        {guideRect}
        {overlay}
      </div>
    );
  }
);
