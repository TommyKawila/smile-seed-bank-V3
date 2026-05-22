/**
 * Slim replacement for `next/dist/build/polyfills/polyfill-module`.
 * Browserslist floor (Chrome 111+, Safari 16.4+) already has the other shims;
 * only URL.canParse is missing until Safari 17 / Chrome 120 (used by Next asset-prefix).
 */
if (!("canParse" in URL)) {
  URL.canParse = function canParse(url, base) {
    try {
      return Boolean(new URL(url, base));
    } catch {
      return false;
    }
  };
}
