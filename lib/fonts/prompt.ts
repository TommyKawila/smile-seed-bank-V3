import localFont from "next/font/local";

/** LCP-critical weight only — 600/700 injected after idle via `PromptExtendedFaces`. */
export const prompt = localFont({
  src: [{ path: "./Prompt-Regular.woff2", weight: "400", style: "normal" }],
  variable: "--font-prompt",
  display: "swap",
  /** No preload — PSI unused-CSS was counting the early woff2 fetch; CSS still discovers the face. */
  preload: false,
  fallback: ["Noto Sans Thai", "sans-serif"],
  /** Boss override Unused CSS: false shrinks inline @font-face; watch Field CLS. */
  adjustFontFallback: false,
});
