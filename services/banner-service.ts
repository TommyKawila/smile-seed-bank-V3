import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type BannerImageLocale = "th" | "en";

export type DynamicBanner = {
  id: string;
  title_th: string | null;
  title_en: string | null;
  desktop_image_th: string;
  desktop_image_en: string | null;
  mobile_image_th: string | null;
  mobile_image_en: string | null;
  link_url: string | null;
  start_date: string | null;
  end_date: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BannerInput = {
  title_th?: string | null;
  title_en?: string | null;
  desktop_image_th: string;
  desktop_image_en?: string | null;
  mobile_image_th?: string | null;
  mobile_image_en?: string | null;
  link_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
};

function parseOptionalBannerSchedule(raw: Record<string, unknown>): {
  start_date: string | null;
  end_date: string | null;
} {
  const optIso = (v: unknown): string | null => {
    if (v === undefined || v === null) return null;
    if (typeof v === "string") {
      const t = v.trim();
      if (!t) return null;
      const ms = Date.parse(t);
      return Number.isNaN(ms) ? null : new Date(ms).toISOString();
    }
    return null;
  };
  const start_raw = raw.start_date ?? raw.startDate;
  const end_raw = raw.end_date ?? raw.endDate;
  const start_date = optIso(start_raw);
  const end_date = optIso(end_raw);
  if (
    start_date &&
    end_date &&
    Date.parse(end_date) < Date.parse(start_date)
  ) {
    throw new Error("end_date must be on or after start_date");
  }
  return { start_date, end_date };
}

/** Normalize admin JSON: missing keys → null/empty; optional image fields omit → null */
export function normalizeBannerApiBody(raw: Record<string, unknown>): BannerInput {
  const optStr = (v: unknown): string | null => {
    if (v === undefined || v === null) return null;
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t === "" ? null : t;
  };
  const reqStr = (v: unknown): string => {
    if (typeof v !== "string") return "";
    return v.trim();
  };
  const linkRaw = raw.link_url ?? raw.linkUrl;
  const schedule = parseOptionalBannerSchedule(raw);
  return {
    title_th: optStr(raw.title_th),
    title_en: optStr(raw.title_en),
    desktop_image_th: reqStr(raw.desktop_image_th),
    desktop_image_en: optStr(raw.desktop_image_en),
    mobile_image_th: optStr(raw.mobile_image_th),
    mobile_image_en: optStr(raw.mobile_image_en),
    link_url: typeof linkRaw === "string" && linkRaw.trim() !== "" ? linkRaw.trim() : null,
    start_date: schedule.start_date,
    end_date: schedule.end_date,
    is_active: typeof raw.is_active === "boolean" ? raw.is_active : true,
  };
}

type BannerRow = {
  id: bigint;
  title_th: string | null;
  title_en: string | null;
  desktop_image_th: string;
  desktop_image_en: string | null;
  mobile_image_th: string | null;
  mobile_image_en: string | null;
  link_url: string | null;
  start_date: Date | null;
  end_date: Date | null;
  order_index: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

function mapBanner(row: BannerRow): DynamicBanner {
  return {
    id: String(row.id),
    title_th: row.title_th,
    title_en: row.title_en,
    desktop_image_th: row.desktop_image_th,
    desktop_image_en: row.desktop_image_en,
    mobile_image_th: row.mobile_image_th,
    mobile_image_en: row.mobile_image_en,
    link_url: row.link_url,
    start_date: row.start_date ? row.start_date.toISOString() : null,
    end_date: row.end_date ? row.end_date.toISOString() : null,
    order_index: row.order_index,
    is_active: row.is_active,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

/**
 * Active slides visible at PostgreSQL `CURRENT_TIMESTAMP`.
 * - `start_date IS NULL` → eligible immediately from the scheduled window perspective.
 * - `end_date IS NULL` → no end (stays forever).
 */
export async function getActiveBanners(): Promise<DynamicBanner[]> {
  const rows = await prisma.$queryRaw<BannerRow[]>`
    SELECT id, title_th, title_en, desktop_image_th, desktop_image_en, mobile_image_th,
           mobile_image_en, link_url, start_date, end_date,
           order_index, is_active, created_at, updated_at
    FROM dynamic_banners
    WHERE is_active = true
      AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
      AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
    ORDER BY order_index ASC, id ASC
  `;
  return rows.map(mapBanner);
}

export async function getAdminBanners(): Promise<DynamicBanner[]> {
  const rows = await prisma.$queryRaw<BannerRow[]>`
    SELECT id, title_th, title_en, desktop_image_th, desktop_image_en, mobile_image_th,
           mobile_image_en, link_url, start_date, end_date,
           order_index, is_active, created_at, updated_at
    FROM dynamic_banners
    ORDER BY order_index ASC, id ASC
  `;
  return rows.map(mapBanner);
}

export async function createBanner(input: BannerInput): Promise<DynamicBanner> {
  const maxRows = await prisma.$queryRaw<{ max_order: number | null }[]>`
    SELECT COALESCE(MAX(order_index), -1) AS max_order FROM dynamic_banners
  `;
  const nextOrder = Number(maxRows[0]?.max_order ?? -1) + 1;

  const start =
    input.start_date != null && input.start_date !== ""
      ? new Date(input.start_date)
      : null;
  const end =
    input.end_date != null && input.end_date !== ""
      ? new Date(input.end_date)
      : null;

  const rows = await prisma.$queryRaw<BannerRow[]>`
    INSERT INTO dynamic_banners (
      title_th, title_en, desktop_image_th, desktop_image_en, mobile_image_th,
      mobile_image_en, link_url, start_date, end_date,
      is_active, order_index
    )
    VALUES (
      ${input.title_th ?? null}, ${input.title_en ?? null}, ${input.desktop_image_th},
      ${input.desktop_image_en ?? null}, ${input.mobile_image_th ?? null}, ${input.mobile_image_en ?? null},
      ${input.link_url ?? null},
      ${start},
      ${end},
      ${input.is_active ?? true}, ${nextOrder}
    )
    RETURNING id, title_th, title_en, desktop_image_th, desktop_image_en, mobile_image_th,
              mobile_image_en, link_url, start_date, end_date,
              order_index, is_active, created_at, updated_at
  `;
  return mapBanner(rows[0]);
}

export async function updateBanner(id: bigint, input: BannerInput): Promise<DynamicBanner> {
  const start =
    input.start_date != null && input.start_date !== ""
      ? new Date(input.start_date)
      : null;
  const end =
    input.end_date != null && input.end_date !== ""
      ? new Date(input.end_date)
      : null;

  const rows = await prisma.$queryRaw<BannerRow[]>`
    UPDATE dynamic_banners
    SET title_th = ${input.title_th ?? null},
        title_en = ${input.title_en ?? null},
        desktop_image_th = ${input.desktop_image_th},
        desktop_image_en = ${input.desktop_image_en ?? null},
        mobile_image_th = ${input.mobile_image_th ?? null},
        mobile_image_en = ${input.mobile_image_en ?? null},
        link_url = ${input.link_url ?? null},
        start_date = ${start},
        end_date = ${end},
        is_active = ${input.is_active ?? true},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING id, title_th, title_en, desktop_image_th, desktop_image_en, mobile_image_th,
              mobile_image_en, link_url, start_date, end_date,
              order_index, is_active, created_at, updated_at
  `;
  if (!rows[0]) throw new Error("Banner not found");
  return mapBanner(rows[0]);
}

export async function deleteBanner(id: bigint): Promise<void> {
  await prisma.$executeRaw`DELETE FROM dynamic_banners WHERE id = ${id}`;
}

export async function updateBannerOrder(bannerIds: bigint[]): Promise<void> {
  await prisma.$transaction(
    bannerIds.map((id, index) =>
      prisma.$executeRaw(
        Prisma.sql`UPDATE dynamic_banners SET order_index = ${index}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`
      )
    )
  );
}
