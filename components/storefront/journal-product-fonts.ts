import { JetBrains_Mono } from "next/font/google";

export const journalProductMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-journal-product-mono",
});

/** Apply on a parent that wraps product cards + filters so monospace labels (SKU, meta) cascade. */
export const JOURNAL_PRODUCT_FONT_VARS = journalProductMono.variable;
