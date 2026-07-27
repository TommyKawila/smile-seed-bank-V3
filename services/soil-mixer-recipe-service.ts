import {
  extractLitersFromText,
  formatLiters,
  type SoilMixRecipeLine,
  type SoilPotTarget,
  type SuperSoilRecipeMode,
} from "@/lib/soil-mixer";

type Locale = "th" | "en";
type MaterialInput = { id: string; label: string; amount?: string };
type RecipeIngredient = {
  id: string;
  nameTh: string;
  nameEn: string;
  ratio: number;
};
type PlannedLine = RecipeIngredient & { needLiters: number };

const MEDIA = {
  coco: { id: "coco", nameTh: "ขุยมะพร้าวป่น", nameEn: "Coco coir" },
  peat: { id: "peat", nameTh: "พีทมอส", nameEn: "Peat moss" },
  topsoil: { id: "topsoil", nameTh: "ดินปลูกสำเร็จ", nameEn: "Bagged topsoil" },
} as const;

const BASE_ADDITIONS: RecipeIngredient[] = [
  { id: "compost", nameTh: "ปุ๋ยหมัก", nameEn: "Compost", ratio: 0.25 },
  { id: "worm", nameTh: "มูลไส้เดือน", nameEn: "Worm castings", ratio: 0.15 },
  { id: "perlite", nameTh: "เพอร์ไลต์", nameEn: "Perlite", ratio: 0.15 },
];

const SUPER_BASIC_ADDITIONS: RecipeIngredient[] = [
  { id: "compost", nameTh: "ปุ๋ยหมัก", nameEn: "Compost", ratio: 0.25 },
  { id: "worm", nameTh: "มูลไส้เดือน", nameEn: "Worm castings", ratio: 0.2 },
  { id: "perlite", nameTh: "เพอร์ไลต์", nameEn: "Perlite", ratio: 0.1 },
  { id: "biochar", nameTh: "ไบโอชาร์", nameEn: "Biochar", ratio: 0.05 },
  { id: "guano", nameTh: "มูลค้างคาว", nameEn: "Bat guano", ratio: 0.02 },
  { id: "kelp", nameTh: "Kelp Meal", nameEn: "Kelp Meal", ratio: 0.01 },
  { id: "lime", nameTh: "โดโลไมต์ไลม์", nameEn: "Dolomite lime", ratio: 0.01 },
  { id: "gypsum", nameTh: "ยิปซัม", nameEn: "Gypsum", ratio: 0.01 },
];

const SUPER_ADVANCE_ADDITIONS: RecipeIngredient[] = [
  { id: "compost", nameTh: "ปุ๋ยหมัก", nameEn: "Compost", ratio: 0.22 },
  { id: "worm", nameTh: "มูลไส้เดือน", nameEn: "Worm castings", ratio: 0.18 },
  { id: "perlite", nameTh: "เพอร์ไลต์", nameEn: "Perlite", ratio: 0.1 },
  { id: "biochar", nameTh: "ไบโอชาร์", nameEn: "Biochar", ratio: 0.06 },
  { id: "guano", nameTh: "มูลค้างคาว", nameEn: "Bat guano", ratio: 0.04 },
  { id: "bone", nameTh: "กระดูกป่น", nameEn: "Bone meal", ratio: 0.03 },
  { id: "blood", nameTh: "ผงเลือดป่น", nameEn: "Blood meal", ratio: 0.02 },
  { id: "kelp", nameTh: "Kelp Meal", nameEn: "Kelp Meal", ratio: 0.02 },
  { id: "lime", nameTh: "โดโลไมต์ไลม์", nameEn: "Dolomite lime", ratio: 0.015 },
  { id: "gypsum", nameTh: "ยิปซัม", nameEn: "Gypsum", ratio: 0.015 },
];

function roundLiters(value: number): number {
  return Math.round(value * 10) / 10;
}

function materialAmountLiters(raw: string | undefined): number {
  if (!raw) return 0;
  const convertedLiters = raw.match(/~\s*([\d.]+)\s*L/i);
  return convertedLiters
    ? Number(convertedLiters[1]) || 0
    : extractLitersFromText(raw);
}

function choosePrimaryMedia(materials: MaterialInput[]): (typeof MEDIA)[keyof typeof MEDIA] {
  const available = new Map(
    materials.map((item) => [item.id, materialAmountLiters(item.amount)])
  );
  return Object.values(MEDIA).reduce((best, candidate) =>
    (available.get(candidate.id) ?? 0) > (available.get(best.id) ?? 0)
      ? candidate
      : best
  );
}

function scaleRecipe(
  targetLiters: number,
  ingredients: RecipeIngredient[]
): PlannedLine[] {
  let allocated = 0;
  return ingredients.map((ingredient, index) => {
    const isLast = index === ingredients.length - 1;
    const needLiters = isLast
      ? roundLiters(targetLiters - allocated)
      : roundLiters(targetLiters * ingredient.ratio);
    allocated += needLiters;
    return { ...ingredient, needLiters: Math.max(0, needLiters) };
  });
}

function allocateStock(
  base: PlannedLine[],
  superSoil: PlannedLine[],
  materials: MaterialInput[],
  locale: Locale
): { baseMixPlan: SoilMixRecipeLine[]; superMixPlan: SoilMixRecipeLine[] } {
  const available = new Map(
    materials.map((item) => [item.id, materialAmountLiters(item.amount)])
  );
  const totalNeed = new Map<string, number>();
  for (const line of [...base, ...superSoil]) {
    totalNeed.set(line.id, (totalNeed.get(line.id) ?? 0) + line.needLiters);
  }

  const remaining = new Map(available);
  const toRecipeLine = (line: PlannedLine): SoilMixRecipeLine => {
    const stock = available.get(line.id) ?? 0;
    const combinedNeed = totalNeed.get(line.id) ?? line.needLiters;
    const proportional =
      stock >= combinedNeed
        ? line.needLiters
        : roundLiters(stock * (line.needLiters / combinedNeed));
    const haveLiters = Math.min(
      line.needLiters,
      remaining.get(line.id) ?? 0,
      proportional
    );
    remaining.set(line.id, Math.max(0, (remaining.get(line.id) ?? 0) - haveLiters));
    const buyLiters = roundLiters(Math.max(0, line.needLiters - haveLiters));
    const status =
      buyLiters <= 0 ? "ok" : haveLiters > 0 ? "short" : "missing";

    return {
      ingredientId: line.id,
      name: locale === "th" ? line.nameTh : line.nameEn,
      need: `${formatLiters(line.needLiters)} L`,
      have: `${formatLiters(haveLiters)} L`,
      status,
      buyMore: buyLiters > 0 ? `${formatLiters(buyLiters)} L` : "",
    };
  };

  return {
    baseMixPlan: base.map(toRecipeLine),
    superMixPlan: superSoil.map(toRecipeLine),
  };
}

export function buildCompleteSoilRecipes(
  materials: MaterialInput[],
  potTarget: SoilPotTarget,
  locale: Locale,
  recipeMode: SuperSoilRecipeMode
): { baseMixPlan: SoilMixRecipeLine[]; superMixPlan: SoilMixRecipeLine[] } {
  const media = choosePrimaryMedia(materials);
  const baseIngredients: RecipeIngredient[] = [
    { ...media, ratio: 0.45 },
    ...BASE_ADDITIONS,
  ];
  const superMediaRatio = recipeMode === "advance" ? 0.3 : 0.35;
  const superIngredients: RecipeIngredient[] = [
    { ...media, ratio: superMediaRatio },
    ...(recipeMode === "advance"
      ? SUPER_ADVANCE_ADDITIONS
      : SUPER_BASIC_ADDITIONS),
  ];

  return allocateStock(
    scaleRecipe(potTarget.baseSoilLiters, baseIngredients),
    scaleRecipe(potTarget.superSoilLiters, superIngredients),
    materials,
    locale
  );
}
