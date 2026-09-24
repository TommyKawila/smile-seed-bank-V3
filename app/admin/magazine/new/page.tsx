import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth-utils";
import { MagazinePostForm } from "@/components/admin/magazine/MagazinePostForm";

export default async function AdminMagazineNewPage() {
  await assertAdmin();
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
