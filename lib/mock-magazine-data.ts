/**
 * Digital Magazine — mock seed definitions (TipTap JSON, categories, affiliates).
 * Used by prisma/seed-magazine.ts and prisma/seed.ts.
 */

export type MockCategory = {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
};

export type MockAffiliate = {
  title: string;
  url: string;
  platform_name: string;
  image_url: string;
};

export type MockPostDef = {
  slug: string;
  title: string;
  excerpt: string;
  featured_image: string;
  tags: string[];
  status: "PUBLISHED" | "DRAFT";
  is_highlight: boolean;
  categorySlug: string;
  buildContent: (affiliateId: number) => Record<string, unknown>;
};

function doc(content: object[]): Record<string, unknown> {
  return { type: "doc", content };
}

function p(text: string): object {
  return {
    type: "paragraph",
    content: [{ type: "text", text }],
  };
}

function heading(level: 2 | 3, text: string): object {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}

function blockquote(text: string): object {
  return {
    type: "blockquote",
    content: [p(text)],
  };
}

export const MOCK_MAGAZINE_CATEGORIES: MockCategory[] = [
  {
    name: "Knowledge",
    slug: "knowledge",
    description: "ลึกซึ้งเรื่องสายพันธุ์",
    sort_order: 1,
  },
  {
    name: "Lifestyle",
    slug: "lifestyle",
    description: "ศิลปะการใช้ชีวิต",
    sort_order: 2,
  },
  {
    name: "News",
    slug: "news",
    description: "อัปเดตวงการ",
    sort_order: 3,
  },
];

export const MOCK_AFFILIATES: MockAffiliate[] = [
  {
    title: "Shopee Premium Soil",
    url: "https://shopee.co.th/search?keyword=organic%20soil",
    platform_name: "Shopee",
    image_url:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
  },
  {
    title: "Lazada Pro Grow Light",
    url: "https://www.lazada.co.th/catalog/?q=led+grow+light",
    platform_name: "Lazada",
    image_url:
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80",
  },
];

/** 11 posts, all PUBLISHED. ≥3 include [SMART_TIE_IN] for tie-in injection tests. */
export const MOCK_MAGAZINE_POSTS: MockPostDef[] = [
  {
    slug: "top-5-autoflowers-chiang-mai-climate",
    title: "Top 5 Autoflowers for Chiang Mai Climate",
    excerpt:
      "Humidity, night temperatures, and light hours — how to match fast-finishing genetics to Northern Thailand’s real weather.",
    featured_image:
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1600&q=80",
    tags: ["fastbuds", "autoflower", "chiang mai", "climate"],
    status: "PUBLISHED",
    is_highlight: true,
    categorySlug: "knowledge",
    buildContent: () =>
      doc([
        p(
          "Chiang Mai’s wet season and cool nights reward cultivars that finish before mould pressure peaks. Autoflowers that stay compact and resin early are natural fits for balconies and small tents."
        ),
        p("[SMART_TIE_IN]"),
        heading(2, "What to prioritise"),
        p(
          "Choose genetics with documented resistance traits, then dial VPD and airflow — the plant does the rest if the room tells the truth."
        ),
      ]),
  },
  {
    slug: "future-organic-terpenes",
    title: "The Future of Organic Terpenes",
    excerpt:
      "Beyond THC percentages: why organic-forward cultivation is reshaping the conversation around aroma, cure, and consumer trust.",
    featured_image:
      "https://images.unsplash.com/photo-1604909054262-889f5a7a7c0b?w=1600&q=80",
    tags: ["terpenes", "organic", "soil"],
    status: "PUBLISHED",
    is_highlight: true,
    categorySlug: "knowledge",
    buildContent: () =>
      doc([
        p(
          "Retail shelves are slowly catching up with what connoisseurs already knew: the nose knows. Terpene preservation starts in the root zone and ends in the jar."
        ),
        p("[SMART_TIE_IN]"),
        heading(3, "Cure as craft"),
        p(
          "Slow, stable drying protects volatile fractions. Organic inputs often pair with microbial diversity that shows up later as complexity in the glass."
        ),
      ]),
  },
  {
    slug: "copycat-genetics-triploid-lab-notes",
    title: "Copycat Genetics & Triploids: Lab Notes for Serious Growers",
    excerpt:
      "Triploid lines and copycat-forward breeding — what the numbers mean when you move from hype to harvest.",
    featured_image:
      "https://images.unsplash.com/photo-1532187863486-de581f27d096?w=1600&q=80",
    tags: ["copycat", "triploid", "genetics"],
    status: "PUBLISHED",
    is_highlight: true,
    categorySlug: "knowledge",
    buildContent: () =>
      doc([
        p(
          "Polyploid strategies are not magic — they are tools. When selection is disciplined, triploid work can yield uniform canopies and cleaner finishing windows."
        ),
        p("[SMART_TIE_IN]"),
        heading(2, "Field validation"),
        p(
          "Run parallel small-batch trials before scaling. Tag selection beats catalogue photography every time."
        ),
      ]),
  },
  {
    slug: "fastbuds-feeding-autos-through-flower",
    title: "Fast Buds: Feeding Autos Through Flower Without Burn",
    excerpt:
      "A conservative EC ramp, calm dry-backs, and when to stop pushing — lessons from high-performing auto rooms.",
    featured_image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58412?w=1600&q=80",
    tags: ["fastbuds", "autoflower", "nutrients"],
    status: "PUBLISHED",
    is_highlight: false,
    categorySlug: "knowledge",
    buildContent: () =>
      doc([
        p(
          "Autos punish heavy-handed feeding earlier than photoperiod lines. Build the root system in veg-equivalent stretch, then taper nitrogen as resin stacks."
        ),
        heading(3, "Leaf-tissue tells the story"),
        p(
          "If tips burn symmetrically, back off globally. If only new growth shows stress, look at single-element spikes before you flush the whole program."
        ),
      ]),
  },
  {
    slug: "living-soil-mix-affiliate-pick",
    title: "Living Soil: A Mix That Breathes — Plus One Curated Input",
    excerpt:
      "Structure, drainage, biology — then a single commercial link our editors use for premium organic base.",
    featured_image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&q=80",
    tags: ["soil", "organic", "microbes"],
    status: "PUBLISHED",
    is_highlight: false,
    categorySlug: "lifestyle",
    buildContent: (affiliateId) =>
      doc([
        p(
          "Start with aeration, add quality compost, then inoculate. Water moves through structure; life holds in the pockets between particles."
        ),
        p(`[AFFILIATE:${affiliateId}]`),
        p(
          "Dry backs train roots; perpetual saturation trains problems. Listen to the pot weight, not only the schedule."
        ),
      ]),
  },
  {
    slug: "chiang-mai-organic-farm-weekend",
    title: "Chiang Mai’s Organic Farm Weekend: Soil, Sun, and Slow Coffee",
    excerpt:
      "A photo essay from the highlands — where craft growers trade yield bragging for flavour and resilience.",
    featured_image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80",
    tags: ["organic", "chiang mai", "farming"],
    status: "PUBLISHED",
    is_highlight: false,
    categorySlug: "lifestyle",
    buildContent: () =>
      doc([
        p(
          "We walked rows at dawn: dew on cover crops, compost tea cooling in the shade, and the quiet pride of farmers who measure success in seasons, not single runs."
        ),
        heading(3, "Culture, not trend"),
        p(
          "Organic here is a practice passed hand to hand — not a sticker slapped on packaging."
        ),
      ]),
  },
  {
    slug: "news-regulatory-snapshot-early-2026",
    title: "Regulatory Snapshot: What Operators Watched in Early 2026",
    excerpt:
      "A neutral overview of compliance themes — education, retail clarity, and responsible community participation.",
    featured_image:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=80",
    tags: ["news", "thailand", "compliance"],
    status: "PUBLISHED",
    is_highlight: false,
    categorySlug: "news",
    buildContent: () =>
      doc([
        p(
          "This article is informational, not legal advice. Verify obligations with qualified counsel for your jurisdiction and business model."
        ),
        blockquote(
          "Transparent rules help serious operators invest in quality — and protect consumers who deserve clarity."
        ),
        p(
          "We will continue to summarise public guidance as it evolves."
        ),
      ]),
  },
  {
    slug: "triploid-vigor-indoor-trials",
    title: "Triploid Vigor: What Indoor Trials Actually Show",
    excerpt:
      "Uniformity, stretch behaviour, and resin onset — parsing triploid performance without marketing noise.",
    featured_image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=80",
    tags: ["triploid", "indoor", "genetics"],
    status: "PUBLISHED",
    is_highlight: false,
    categorySlug: "knowledge",
    buildContent: () =>
      doc([
        p(
          "Controlled rooms remove weather as a variable. What remains is genetics, training, and feeding — the triploid conversation belongs in that frame."
        ),
        p(
          "Document everything: light maps, irrigation events, and canopy photos week by week."
        ),
      ]),
  },
  {
    slug: "copycat-lineage-stability-2026",
    title: "Copycat Lineage: Stability in an Era of Fast Drops",
    excerpt:
      "When names move faster than verification — how to evaluate copycat-forward lines before you commit square metres.",
    featured_image:
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1600&q=80",
    tags: ["copycat", "genetics", "breeders"],
    status: "PUBLISHED",
    is_highlight: false,
    categorySlug: "knowledge",
    buildContent: () =>
      doc([
        p(
          "Chase documentation, not hype threads. Stable lines show repeatable architecture across runs — not one viral pheno."
        ),
        heading(2, "Ask better questions"),
        p(
          "Request provenance, test batches, and honest failure stories. The best breeders welcome scrutiny."
        ),
      ]),
  },
  {
    slug: "fastbuds-outdoor-ledger-north-thailand",
    title: "Fast Buds Outdoors: A Ledger From North Thailand",
    excerpt:
      "Rain days, UV peaks, and the autoflower finish window — field notes from a single wet season.",
    featured_image:
      "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc7?w=1600&q=80",
    tags: ["fastbuds", "autoflower", "outdoor"],
    status: "PUBLISHED",
    is_highlight: false,
    categorySlug: "lifestyle",
    buildContent: () =>
      doc([
        p(
          "Outdoor autos in the north face a different clock: monsoon moisture, sudden sun, and pests that love the same terpene profiles we prize."
        ),
        p(
          "Elevation and airflow matter as much as genetics — plan shelter and pathogen checks before you plant for pride."
        ),
      ]),
  },
  {
    slug: "led-grow-lights-ppfd-dli-primer",
    title: "LED Grow Lights: PPFD, DLI, and Why Your Meter Matters",
    excerpt:
      "From seedlings to late flower — translating manufacturer charts into real canopy numbers.",
    featured_image:
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=1600&q=80",
    tags: ["lighting", "indoor", "led"],
    status: "PUBLISHED",
    is_highlight: false,
    categorySlug: "knowledge",
    buildContent: () =>
      doc([
        p(
          "PPFD tells you instantaneous intensity; DLI tells you the daily budget. Autos often thrive under moderate, consistent DLI rather than heroic peaks."
        ),
        p(
          "Measure at canopy height, not at the fixture — and remap when you defoliate or train."
        ),
      ]),
  },
];
