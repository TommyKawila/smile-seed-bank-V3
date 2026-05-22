import localFont from "next/font/local";

/** Self-hosted Prompt — 3 compact @font-face rules vs ~26 unicode-range blocks from next/font/google + inlineCss. */
export const prompt = localFont({
  src: [
    { path: "./Prompt-Regular.woff2", weight: "400", style: "normal" },
    { path: "./Prompt-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./Prompt-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-prompt",
  display: "swap",
  preload: true,
  fallback: ["Noto Sans Thai", "sans-serif"],
  adjustFontFallback: true,
});
