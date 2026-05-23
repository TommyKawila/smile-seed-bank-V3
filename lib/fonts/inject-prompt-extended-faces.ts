const STYLE_ID = "ssb-prompt-extended-faces";

/** Idle-inject 600/700 into the same next/font family as `--font-prompt` (off critical CSS). */
export function injectPromptExtendedFaces(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;

  const raw = getComputedStyle(document.documentElement).getPropertyValue("--font-prompt").trim();
  const family = raw.split(",")[0]?.trim().replace(/^["']|["']$/g, "");
  if (!family) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `@font-face{font-family:${family};src:url(/fonts/Prompt-SemiBold.woff2) format("woff2");font-weight:600;font-style:normal;font-display:swap}@font-face{font-family:${family};src:url(/fonts/Prompt-Bold.woff2) format("woff2");font-weight:700;font-style:normal;font-display:swap}`;
  document.head.appendChild(style);
}
