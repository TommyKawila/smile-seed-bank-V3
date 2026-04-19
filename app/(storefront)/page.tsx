import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { HomePageClient } from "@/components/storefront/HomePageClient";
import { DEFAULT_HOME_SECTION_KEYS, type HomePageSectionPayload } from "@/lib/homepage-sections";

export const revalidate = 0;

async function getSections(): Promise<HomePageSectionPayload[]> {
  const count = await prisma.homepage_sections.count();
  if (count === 0) {
    return DEFAULT_HOME_SECTION_KEYS.map((key) => ({
      key,
      label_th: "—",
      label_en: "—",
    }));
  }
  const rows = await prisma.homepage_sections.findMany({
    where: { is_active: true },
    orderBy: { sort_order: "asc" },
    select: { key: true, label_th: true, label_en: true },
  });
  return rows.map((r) => ({
    key: r.key,
    label_th: r.label_th,
    label_en: r.label_en,
  }));
}

export default async function HomePage() {
  const sections = await getSections();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 bg-white px-4 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-800" aria-hidden />
          <p className="text-sm text-zinc-600">Loading…</p>
        </div>
      }
    >
      <HomePageClient sections={sections} />
    </Suspense>
  );
}
