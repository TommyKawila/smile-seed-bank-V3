import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import { Inter, Prompt } from "next/font/google";
import "./globals.css";
import { getSiteOrigin } from "@/lib/get-url";
import { SupabaseStoragePreconnect } from "@/components/seo/SupabaseStoragePreconnect";

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
const GA_MEASUREMENT_ID = "G-RSY7B2ZH9X";

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
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <SupabaseStoragePreconnect />
      </head>
      <body className={`${inter.variable} ${prompt.variable} min-h-screen bg-white font-sans antialiased`}>
        {children}
        <Script id="ga-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="lazyOnload"
        />
        <Analytics />
      </body>
    </html>
  );
}
