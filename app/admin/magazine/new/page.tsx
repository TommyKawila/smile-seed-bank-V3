import { prisma } from "@/lib/prisma";
import { MagazinePostForm } from "@/components/admin/magazine/MagazinePostForm";

export default async function AdminMagazineNewPage() {
  const categories = await prisma.blog_categories.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  const catOptions = categories.map((c) => ({
    id: String(c.id),
    name: c.name,
  }));

  return <MagazinePostForm categories={catOptions} initial={null} />;
}
