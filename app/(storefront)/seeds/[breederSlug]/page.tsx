import type { Metadata } from "next";

export function generateMetadata({
  params,
}: {
  params: { breederSlug: string };
}): Metadata {
  const breederSlug = encodeURIComponent(params.breederSlug.trim());
  return {
    alternates: {
      canonical: `/seeds/${breederSlug}`,
    },
  };
}

export { default } from "../../shop/page";
