import type { Metadata } from "next";
import "./globals.css";
import { getSiteOrigin } from "@/lib/get-url";

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
      <body className="min-h-screen bg-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
