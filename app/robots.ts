import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/get-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/product/", "/seeds/", "/brand/", "/blog/"],
        disallow: ["/admin/", "/api/", "/checkout/", "/profile/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
