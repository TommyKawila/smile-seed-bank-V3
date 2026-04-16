import { JetBrains_Mono, Playfair_Display } from "next/font/google";

export const journalProductPlayfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-journal-product-serif",
});

export const journalProductMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-journal-product-mono",
});

/** Apply on a parent that wraps product cards + featured bento so Playfair + JetBrains Mono cascade. */
export const JOURNAL_PRODUCT_FONT_VARS = `${journalProductPlayfair.variable} ${journalProductMono.variable}`;
