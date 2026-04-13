import { prisma } from "@/lib/prisma";
import { MagazineBlogCategoriesClient } from "@/components/admin/magazine/MagazineBlogCategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminMagazineCategoriesPage() {
  const rows = await prisma.blog_categories.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
  });

  const initialCategories = rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    slug: r.slug,
    description: r.description,
    sort_order: r.sort_order,
  }));

  return <MagazineBlogCategoriesClient initialCategories={initialCategories} />;
}
