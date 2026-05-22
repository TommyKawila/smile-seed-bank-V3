import "server-only";

import { prisma } from "@/lib/prisma";

export type HeroCtaVariant = "primary" | "outline";

export type HeroCtaButton = {
  id: string;
  labelTh: string;
  labelEn: string;
  href: string;
  variant: HeroCtaVariant;
  sortOrder: number;
  isActive: boolean;
};

export type HeroCtaButtonAdminPatch = {
  id: string;
  label_th: string;
  label_en: string;
  href: string;
  variant: HeroCtaVariant;
  sort_order: number;
  is_active: boolean;
};

const DEFAULT_HERO_CTA_SEED_IDS = [
  "hero_cta_all_seeds",
  "hero_cta_new",
  "hero_cta_clearance",
  "hero_cta_blog",
] as const;

export const DEFAULT_HERO_CTA_BUTTONS: Omit<HeroCtaButton, "id">[] = [
  {
    labelTh: "เมล็ดพันธุ์ทั้งหมด",
    labelEn: "All Seeds",
    href: "/seeds",
    variant: "primary",
    sortOrder: 0,
    isActive: true,
  },
  {
    labelTh: "เมล็ดพันธุ์มาใหม่",
    labelEn: "New Arrivals",
    href: "/shop?sort=new_arrivals",
    variant: "outline",
    sortOrder: 1,
    isActive: true,
  },
  {
    labelTh: "เมล็ดพันธุ์ลดราคา",
    labelEn: "Clearance Seeds",
    href: "/shop",
    variant: "outline",
    sortOrder: 2,
    isActive: true,
  },
  {
    labelTh: "บทความน่าสนใจ",
    labelEn: "Featured Articles",
    href: "/blog",
    variant: "outline",
    sortOrder: 3,
    isActive: true,
  },
];

type DbRow = {
  id: string;
  label_th: string;
  label_en: string;
  href: string;
  variant: string;
  sort_order: number;
  is_active: boolean;
};

function mapRow(row: DbRow): HeroCtaButton {
  const variant: HeroCtaVariant = row.variant === "primary" ? "primary" : "outline";
  return {
    id: row.id,
    labelTh: row.label_th,
    labelEn: row.label_en,
    href: row.href.trim() || "/",
    variant,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

async function seedDefaultsIfEmpty(): Promise<void> {
  const count = await prisma.homepage_hero_cta_buttons.count();
  if (count > 0) return;
  await prisma.homepage_hero_cta_buttons.createMany({
    data: DEFAULT_HERO_CTA_BUTTONS.map((b, i) => ({
      id: DEFAULT_HERO_CTA_SEED_IDS[i] ?? `hero_cta_seed_${i}`,
      label_th: b.labelTh,
      label_en: b.labelEn,
      href: b.href,
      variant: b.variant,
      sort_order: b.sortOrder,
      is_active: b.isActive,
    })),
    skipDuplicates: true,
  });
}

function patchToData(b: HeroCtaButtonAdminPatch) {
  return {
    label_th: b.label_th.trim(),
    label_en: b.label_en.trim(),
    href: b.href.trim() || "/",
    variant: b.variant === "primary" ? "primary" : "outline",
    sort_order: b.sort_order,
    is_active: b.is_active,
  };
}

export async function listHeroCtaButtons(
  activeOnly: boolean,
  options?: { allowFallback?: boolean }
): Promise<HeroCtaButton[]> {
  const allowFallback = options?.allowFallback !== false;
  try {
    await seedDefaultsIfEmpty();
    const rows = await prisma.homepage_hero_cta_buttons.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: { sort_order: "asc" },
    });
    return rows.map(mapRow);
  } catch (err) {
    if (!allowFallback) throw err;
    return DEFAULT_HERO_CTA_BUTTONS.map((b, i) => ({
      id: DEFAULT_HERO_CTA_SEED_IDS[i] ?? `fallback_${i}`,
      ...b,
    }));
  }
}

export async function saveHeroCtaButtons(buttons: HeroCtaButtonAdminPatch[]): Promise<void> {
  await seedDefaultsIfEmpty();
  const ids = buttons.map((b) => b.id);
  await prisma.$transaction([
    ...buttons.map((b) => {
      const data = patchToData(b);
      return prisma.homepage_hero_cta_buttons.upsert({
        where: { id: b.id },
        create: { id: b.id, ...data },
        update: data,
      });
    }),
    prisma.homepage_hero_cta_buttons.deleteMany({
      where: { id: { notIn: ids } },
    }),
  ]);
}
