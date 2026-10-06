import { prisma } from "@/lib/prisma";

type BlogSlugClient = {
  blog_posts: {
    findFirst: (args: {
      where: {
        slug: string;
        NOT?: { id: bigint };
      };
    }) => Promise<{ slug: string } | null>;
  };
};

export async function ensureUniqueBlogSlug(
  base: string,
  excludeId?: bigint,
  db: BlogSlugClient = prisma
): Promise<string> {
  let slug = base.slice(0, 180) || "post";
  let n = 0;
  for (;;) {
    const existing = await db.blog_posts.findFirst({
      where: {
        slug,
        ...(excludeId != null ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${base.slice(0, 170)}-${n}`;
  }
}
