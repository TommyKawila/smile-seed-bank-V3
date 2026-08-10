import type { Metadata } from "next";

function firstSegment(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata(props: {
  params: Promise<{ breederSlug: string | string[] }>;
}): Promise<Metadata> {
  const { breederSlug } = await props.params;
  const slug = encodeURIComponent((firstSegment(breederSlug) ?? "").trim());
  return {
    alternates: {
      canonical: `/seeds/${slug}`,
    },
  };
}

export { default } from "../../shop/page";
