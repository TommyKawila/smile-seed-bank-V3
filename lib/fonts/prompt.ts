import localFont from "next/font/local";

/** LCP-critical weight only — 600/700 injected after idle via `PromptExtendedFaces`. */
export const prompt = localFont({
  src: [{ path: "./Prompt-Regular.woff2", weight: "400", style: "normal" }],
  variable: "--font-prompt",
  display: "swap",
  preload: true,
  fallback: ["Noto Sans Thai", "sans-serif"],
  adjustFontFallback: true,
});
