import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ breederSlug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const breederSlug = encodeURIComponent(resolvedParams.breederSlug.trim());
  return {
    alternates: {
      canonical: `/seeds/${breederSlug}`,
    },
  };
}

export { default } from "../../shop/page";
