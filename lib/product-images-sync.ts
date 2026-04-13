import { prisma } from "@/lib/prisma";

export type GalleryEntryInput = {
  url: string;
  is_main: boolean;
  variant_unit_label: string | null;
};

export async function syncProductImagesForProduct(
  productId: number,
  entries: GalleryEntryInput[] | undefined,
  variants: { id: number; unit_label: string }[]
): Promise<void> {
  const pid = BigInt(productId);
  await prisma.product_images.deleteMany({ where: { product_id: pid } });

  if (!entries?.length) return;

  const byLabel = new Map(
    variants.map((v) => [String(v.unit_label).trim(), BigInt(v.id)])
  );

  let mainSeen = false;
  let sort = 0;
  const rows: {
    product_id: bigint;
    variant_id: bigint | null;
    url: string;
    is_main: boolean;
    sort_order: number;
  }[] = [];

  for (const e of entries) {
    const url = e.url?.trim();
    if (!url) continue;
    const label = e.variant_unit_label?.trim() ?? "";
    const variantId = label && byLabel.has(label) ? byLabel.get(label)! : null;
    let isMain = Boolean(e.is_main) && !mainSeen;
    if (isMain) mainSeen = true;
    rows.push({
      product_id: pid,
      variant_id: variantId,
      url,
      is_main: isMain,
      sort_order: sort++,
    });
  }

  if (!mainSeen && rows.length > 0) {
    rows[0].is_main = true;
  }

  if (rows.length === 0) return;

  await prisma.product_images.createMany({ data: rows });
}
