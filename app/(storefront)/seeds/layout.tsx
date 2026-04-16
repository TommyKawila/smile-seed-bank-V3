import type { Metadata } from "next";
import {
  CATALOG_PAGE_DESCRIPTION,
  CATALOG_PAGE_TITLE,
} from "@/lib/seo/catalog-metadata";

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
  return children;
}
