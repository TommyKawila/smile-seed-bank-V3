import {
  DEFAULT_FONT_SCALE,
  MAX_FONT_SCALE,
  MIN_FONT_SCALE,
  DEFAULT_LABEL_SIZE_CM,
  DEFAULT_PACKAGE_SIZE_CM,
  type LabelSizeCm,
} from "@/types/label";

export function parseLabelSizeCm(raw: unknown): LabelSizeCm {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LABEL_SIZE_CM };
  const o = raw as Record<string, unknown>;
  const width =
    typeof o.width === "number" && o.width > 0 ? o.width : DEFAULT_LABEL_SIZE_CM.width;
  const height =
    typeof o.height === "number" && o.height > 0
      ? o.height
      : DEFAULT_LABEL_SIZE_CM.height;
  return { width, height };
}

export function stickerPxFromCm(
  labelSizeCm: LabelSizeCm,
  imageDisplayWidthPx: number,
  packageWidthCm = DEFAULT_PACKAGE_SIZE_CM.width,
  scale = 1
): { width: number; height: number; pxPerCm: number } {
  const pxPerCm =
    imageDisplayWidthPx > 0 ? imageDisplayWidthPx / packageWidthCm : 0;
  return {
    width: Math.max(1, Math.round(labelSizeCm.width * pxPerCm * scale)),
    height: Math.max(1, Math.round(labelSizeCm.height * pxPerCm * scale)),
    pxPerCm,
  };
}

export function formatCm(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function parseFontScale(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return DEFAULT_FONT_SCALE;
  return Math.max(MIN_FONT_SCALE, Math.min(MAX_FONT_SCALE, raw));
}

export function labelFontPx(basePx: number, scale: number): string {
  return `${Math.max(6, Math.round(basePx * scale))}px`;
}

export function isPackRatioPosition(p: {
  x: number;
  y: number;
  unit?: "ratio" | "px";
}): boolean {
  if (p.unit === "ratio") return true;
  if (p.unit === "px") return false;
  return p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
}

export function stickerOffsetInPack(opts: {
  position: { x: number; y: number; unit?: "ratio" | "px" };
  packW: number;
  packH: number;
  stickerW: number;
  stickerH: number;
}): { x: number; y: number } {
  const { position, packW, packH, stickerW, stickerH } = opts;
  let x = isPackRatioPosition(position)
    ? position.x * packW
    : position.x;
  let y = isPackRatioPosition(position)
    ? position.y * packH
    : position.y;
  const maxX = Math.max(0, packW - stickerW);
  const maxY = Math.max(0, packH - stickerH);
  if (x > maxX || x < 0 || y > maxY || y < 0) {
    x = Math.min(maxX, Math.max(0, x));
    y = Math.min(maxY, Math.max(0, y));
  }
  return { x, y };
}
