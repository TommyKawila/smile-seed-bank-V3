/**
 * Hero background SVG is stored as a string in `site_settings.hero_svg_code`.
 * Strips BOM / XML preamble so `dangerouslySetInnerHTML` parses real SVG (not raw text).
 * Does not strip <animate>, <animateTransform>, or <style> — required for animated SVGs.
 */

export function normalizeHeroSvgHtml(raw: string | null | undefined): string {
  if (raw == null || typeof raw !== "string") return "";
  let s = raw.trim().replace(/^\uFEFF/, "");
  s = s.replace(/<\?xml[\s\S]*?\?>\s*/i, "");
  s = s.replace(/<!DOCTYPE[\s\S]*?>\s*/i, "");
  const idx = s.search(/<svg\b/i);
  if (idx < 0) return s.trim();
  return s.slice(idx).trim();
}

/** True if normalized markup looks like an SVG fragment (for preview / toggling). */
export function isHeroSvgMarkup(raw: string | null | undefined): boolean {
  const n = normalizeHeroSvgHtml(raw);
  return n.length > 0 && /<svg\b/i.test(n);
}
