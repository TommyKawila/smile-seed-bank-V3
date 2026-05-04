import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { Loader2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { HomePageClient } from "@/components/storefront/HomePageClient";
import {
  EMPTY_STOREFRONT_HOME_PAYLOAD,
  getStorefrontHomePayload,
} from "@/services/storefront-home-service";
import {
  DEFAULT_HOME_SECTION_KEYS,
  DEFAULT_SECTION_FALLBACK_LABELS,
  type HomePageSectionPayload,
} from "@/lib/homepage-sections";
import { getActiveBanners } from "@/services/banner-service";

const getSectionsCached = unstable_cache(
  async (): Promise<HomePageSectionPayload[]> => {
    const count = await prisma.homepage_sections.count();
    if (count === 0) {
      return DEFAULT_HOME_SECTION_KEYS.map((key) => {
        const fb = DEFAULT_SECTION_FALLBACK_LABELS[key];
        return {
          key,
          label_th: fb?.label_th ?? "—",
          label_en: fb?.label_en ?? "—",
        };
      });
    }
    const rows = await prisma.homepage_sections.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { key: "asc" }],
      select: { key: true, label_th: true, label_en: true },
    });
    return rows.map((r) => ({
      key: r.key,
      label_th: r.label_th,
      label_en: r.label_en,
    }));
  },
  ["storefront-homepage-sections"],
  { tags: ["home-layout"] }
);

async function getSections(): Promise<HomePageSectionPayload[]> {
  return getSectionsCached();
}

async function HomePageContent() {
  const [sections, initialData, banners] = await Promise.all([
    getSections(),
    getStorefrontHomePayload().catch(() => EMPTY_STOREFRONT_HOME_PAYLOAD),
    getActiveBanners().catch(() => []),
  ]);
  return <HomePageClient sections={sections} initialData={initialData} banners={banners} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 bg-white px-4 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-800" aria-hidden />
          <p className="text-sm text-zinc-600">Loading…</p>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
