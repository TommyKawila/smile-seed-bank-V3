import type { Metadata } from "next";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { LazyGoogleAnalytics } from "@/components/third-parties/LazyGoogleAnalytics";
import { Inter, Prompt } from "next/font/google";
import "./globals.css";
import { getSiteOrigin } from "@/lib/get-url";

function supabaseOriginHeadLinks(): ReactNode {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  let origin: string;
  try {
    origin = new URL(raw).origin;
  } catch {
    return null;
  }
  return (
    <>
      <link rel="preconnect" href={origin} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={origin} />
    </>
  );
}

const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((m) => m.Analytics),
  { ssr: false }
);

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const siteUrl = getSiteOrigin();
const GA_MEASUREMENT_ID =
  typeof process.env.NEXT_PUBLIC_GA_ID === "string" && process.env.NEXT_PUBLIC_GA_ID.trim()
    ? process.env.NEXT_PUBLIC_GA_ID.trim()
    : "G-RSY7B2ZH9X";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Smile Seed Bank — Premium Cannabis Seeds",
    template: "%s | Smile Seed Bank",
  },
  description: "แหล่งรวมเมล็ดพันธุ์กัญชาคุณภาพพรีเมียม จากแบรนด์ชั้นนำทั่วโลก",
  keywords: ["cannabis seeds", "เมล็ดพันธุ์กัญชา", "smile seed bank"],
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: siteUrl,
    siteName: "Smile Seed Bank",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="th" className="scroll-smooth" suppressHydrationWarning>
      <head>{supabaseOriginHeadLinks()}</head>
      <body className={`${inter.variable} ${prompt.variable} min-h-screen bg-white font-sans antialiased`}>
        {children}
        <LazyGoogleAnalytics gaId={GA_MEASUREMENT_ID} />
        <Analytics />
      </body>
    </html>
  );
}
