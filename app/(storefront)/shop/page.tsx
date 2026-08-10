import { renderShopCatalog } from "@/app/(storefront)/shop/render-shop-catalog";

type ShopPageProps = {
  params?: Promise<{ breederSlug?: string | string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShopPage(props: ShopPageProps) {
  const resolvedParams = props.params ? await props.params : undefined;
  const sp = props.searchParams ? await props.searchParams : undefined;
  return renderShopCatalog({
    breederSlugFromRoute: firstParam(resolvedParams?.breederSlug),
    sp,
  });
}
