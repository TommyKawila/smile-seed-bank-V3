import type { Metadata } from "next";
import { Inter, Prompt } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { getSiteOrigin } from "@/lib/get-url";

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
  maximumScale: 1,
  userScalable: false,
};

const siteUrl = getSiteOrigin();

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
      <body className={`${inter.variable} ${prompt.variable} min-h-screen bg-white font-sans antialiased`}>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RSY7B2ZH9X"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RSY7B2ZH9X');
          `}
        </Script>
        <Analytics />
      </body>
    </html>
  );
}
