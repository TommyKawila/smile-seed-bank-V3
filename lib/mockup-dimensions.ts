import {
  DEFAULT_FONT_SCALE,
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
  return Math.max(0.5, Math.min(1.5, raw));
}

export function labelFontPx(basePx: number, scale: number): string {
  return `${Math.max(6, Math.round(basePx * scale))}px`;
}
