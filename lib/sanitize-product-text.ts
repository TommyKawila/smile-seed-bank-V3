/** Strip inline color/font markup from product text so storefront uses theme tokens only. */
export function stripEmbeddedColorMarkup(s: string): string {
  let t = s;
  t = t.replace(/<font[^>]*>/gi, "").replace(/<\/font>/gi, "");
  t = t.replace(/\s+color\s*=\s*["'][^"']*["']/gi, "");
  t = t.replace(/\sstyle\s*=\s*["'][^"']*color[^"']*["']/gi, "");
  t = t.replace(/\sstyle\s*=\s*["'][^"']*background(?:-color)?[^"']*["']/gi, "");
  return t;
}
