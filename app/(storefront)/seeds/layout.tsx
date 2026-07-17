import type { Metadata } from "next";
import {
  CATALOG_PAGE_DESCRIPTION,
  CATALOG_PAGE_TITLE,
} from "@/lib/seo/catalog-metadata";
import { PUBLIC_SUPABASE_FALLBACK_ORIGIN } from "@/lib/public-storage-url";

function supabasePreconnectOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* fall through */
    }
  }
  return PUBLIC_SUPABASE_FALLBACK_ORIGIN;
}

export const metadata: Metadata = {
  title: CATALOG_PAGE_TITLE,
  description: CATALOG_PAGE_DESCRIPTION,
  openGraph: {
    title: CATALOG_PAGE_TITLE,
    description: CATALOG_PAGE_DESCRIPTION,
    type: "website",
    url: "/seeds",
    siteName: "Smile Seed Bank",
  },
  twitter: {
    card: "summary_large_image",
    title: CATALOG_PAGE_TITLE,
    description: CATALOG_PAGE_DESCRIPTION,
  },
  alternates: {
    canonical: "/seeds",
  },
};

export default function SeedsLayout({ children }: { children: React.ReactNode }) {
  const origin = supabasePreconnectOrigin();
  return (
    <>
      <link rel="preconnect" href={origin} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={origin} />
      {children}
    </>
  );
}
