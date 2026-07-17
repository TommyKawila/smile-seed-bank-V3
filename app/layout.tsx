import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { prompt } from "@/lib/fonts/prompt";
import { PromptExtendedFacesLoader } from "@/components/storefront/PromptExtendedFacesLoader";
import { LazyGoogleAnalytics } from "@/components/third-parties/LazyGoogleAnalytics";
import { VercelAnalyticsClient } from "@/components/VercelAnalyticsClient";
import "./globals.css";
import { getSiteOrigin } from "@/lib/get-url";
import { STOREFRONT_CRITICAL_CSS } from "@/lib/storefront-defer-css";

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
      {/* No crossorigin: hero/public storage `<img>` and `/_next/image` use non-CORS fetches. */}
      <link rel="preconnect" href={origin} />
      <link rel="dns-prefetch" href={origin} />
    </>
  );
}

const Analytics = VercelAnalyticsClient;

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
      <head>
        {process.env.NODE_ENV === "development" ? (
          <style id="ssb-critical" dangerouslySetInnerHTML={{ __html: STOREFRONT_CRITICAL_CSS }} />
        ) : null}
        {supabaseOriginHeadLinks()}
      </head>
      <body className={`${prompt.variable} min-h-screen bg-background font-sans antialiased`}>
        <PromptExtendedFacesLoader />
        {children}
        <LazyGoogleAnalytics gaId={GA_MEASUREMENT_ID} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
