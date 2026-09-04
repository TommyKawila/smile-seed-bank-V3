"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { Rnd } from "react-rnd";
import { FittedLabelGraphic } from "@/components/mockup/FittedLabelGraphic";
import { stickerPxFromCm, stickerOffsetInPack } from "@/lib/mockup-dimensions";
import { DEFAULT_PACKAGE_SIZE_CM, type SeedLabelData } from "@/types/label";

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
    unit?: "ratio" | "px";
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

    const { scale, rotation } = data.labelPosition;

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
      const img = imgRef.current;
      if (img?.complete) measureImage();
      if (!container) return;
      const ro = new ResizeObserver(() => measureImage());
      ro.observe(container);
      if (img) ro.observe(img);
      return () => ro.disconnect();
    }, [measureImage]);

    const packW = imgBounds.width;
    const packH = imgBounds.height;

    const { width: w, height: h } = useMemo(() => {
      if (packW > 0) {
        const sized = stickerPxFromCm(
          data.labelSizeCm,
          packW,
          undefined,
          scale
        );
        return {
          width: Math.min(sized.width, packW),
          height: Math.min(sized.height, packH || sized.height),
        };
      }
      return {
        width: Math.round(140 * scale),
        height: Math.round(140 * scale),
      };
    }, [data.labelSizeCm, packW, packH, scale]);

    const { x: packX, y: packY } = useMemo(
      () =>
        packW > 0
          ? stickerOffsetInPack({
              position: data.labelPosition,
              packW,
              packH,
              stickerW: w,
              stickerH: h,
            })
          : { x: 0, y: 0 },
      [data.labelPosition, packW, packH, w, h]
    );

    const frameClass = interactive
      ? "relative box-border overflow-hidden bg-white border-2 border-dashed border-[#12463e]/60 shadow-sm"
      : "relative box-border overflow-hidden bg-white border border-black";
    const graphicClass = interactive
      ? "box-border w-full select-none break-words bg-white text-black p-2 font-sans leading-tight"
      : "box-border w-full break-words bg-white text-black p-1.5 font-sans leading-tight";

    const fitted = (
      <FittedLabelGraphic
        data={data}
        width={w}
        height={h}
        className={graphicClass}
        frameClassName={frameClass}
        rotation={rotation}
      />
    );

    const onDragStop = useCallback(
      (_e: unknown, d: { x: number; y: number }) => {
        if (packW <= 0 || packH <= 0) return;
        onPositionChange?.({
          x: d.x / packW,
          y: d.y / packH,
          unit: "ratio",
        });
      },
      [onPositionChange, packW, packH]
    );

    const onResizeStop = useCallback(
      (
        _e: unknown,
        _dir: unknown,
        el: HTMLElement,
        _delta: unknown,
        pos: { x: number; y: number }
      ) => {
        const base = stickerPxFromCm(data.labelSizeCm, packW || 1);
        const nextScale = el.offsetWidth / Math.max(1, base.width);
        onPositionChange?.({
          x: packW > 0 ? pos.x / packW : 0,
          y: packH > 0 ? pos.y / packH : 0,
          scale: Math.max(0.2, Math.min(3, nextScale)),
          unit: "ratio",
        });
      },
      [data.labelSizeCm, packW, packH, onPositionChange]
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

    const overlay =
      packW > 0 ? (
        <div
          className="absolute z-10 overflow-hidden"
          style={{
            left: imgBounds.left,
            top: imgBounds.top,
            width: packW,
            height: packH,
          }}
        >
          {interactive ? (
            <Rnd
              size={{ width: w, height: h }}
              position={{ x: packX, y: packY }}
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
              {fitted}
            </Rnd>
          ) : (
            <div
              className="absolute z-10"
              style={{
                left: packX,
                top: packY,
                width: w,
                height: h,
              }}
            >
              {fitted}
            </div>
          )}
        </div>
      ) : null;

    const guideRect =
      interactive && imgBounds.width > 0 ? (
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
        style={{
          minHeight: 420,
          aspectRatio: `${DEFAULT_PACKAGE_SIZE_CM.width} / ${DEFAULT_PACKAGE_SIZE_CM.height}`,
        }}
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
