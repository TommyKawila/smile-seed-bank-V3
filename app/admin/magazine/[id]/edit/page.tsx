import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MagazinePostForm } from "@/components/admin/magazine/MagazinePostForm";

type Props = { params: Promise<{ id: string }> };

export default async function AdminMagazineEditPage({ params }: Props) {
  const { id: idParam } = await params;
  let id: bigint;
  try {
    id = BigInt(idParam);
  } catch {
    notFound();
  }

  const row = await prisma.blog_posts.findUnique({
    where: { id },
  });

  if (!row) notFound();

  const categories = await prisma.blog_categories.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  const catOptions = categories.map((c) => ({
    id: String(c.id),
    name: c.name,
  }));

  const initial = {
    id: Number(row.id),
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: (row.content as object | null) ?? null,
    featured_image: row.featured_image,
    tags: row.tags ?? [],
    status: row.status,
    category_id: row.category_id != null ? String(row.category_id) : null,
    related_products: (row.related_products ?? []).map(Number),
  };

  return <MagazinePostForm categories={catOptions} initial={initial} />;
}
