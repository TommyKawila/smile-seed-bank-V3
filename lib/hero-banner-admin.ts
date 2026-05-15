export type HeroBannerAdmin = {
  id: string;
  titleTh: string;
  titleEn: string | null;
  active: boolean;
  sortOrder: number;
  linkUrl: string | null;
  desktopTh: string;
  desktopEn: string | null;
  mobileTh: string | null;
  mobileEn: string | null;
  panelBgHex: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export type HeroBannerInput = {
  titleTh: string;
  titleEn: string | null;
  active: boolean;
  linkUrl: string | null;
  desktopTh: string;
  desktopEn: string | null;
  mobileTh: string | null;
  mobileEn: string | null;
  panelBgHex: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

function normalizePanelBgHex(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    const ch = s.slice(1).split("");
    return `#${ch.map((c) => c + c).join("").toUpperCase()}`;
  }
  return null;
}

function optIso(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  const ms = Date.parse(t);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

export function normalizeHeroBannerBody(raw: Record<string, unknown>): HeroBannerInput {
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
  const linkRaw = raw.linkUrl ?? raw.link_url;
  const startsAt = optIso(raw.startsAt ?? raw.starts_at);
  const endsAt = optIso(raw.endsAt ?? raw.ends_at);
  if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt)) {
    throw new Error("endsAt must be on or after startsAt");
  }
  const titleThRaw = raw.titleTh ?? raw.title_th ?? raw.name;
  const titleEnRaw = raw.titleEn ?? raw.title_en;
  return {
    titleTh: reqStr(titleThRaw),
    titleEn: optStr(titleEnRaw),
    active: typeof raw.active === "boolean" ? raw.active : true,
    linkUrl:
      typeof linkRaw === "string" && linkRaw.trim() !== "" ? linkRaw.trim() : null,
    desktopTh: reqStr(raw.desktopTh ?? raw.desktop_th),
    desktopEn: optStr(raw.desktopEn ?? raw.desktop_en),
    mobileTh: optStr(raw.mobileTh ?? raw.mobile_th),
    mobileEn: optStr(raw.mobileEn ?? raw.mobile_en),
    panelBgHex: normalizePanelBgHex(raw.panelBgHex ?? raw.panel_bg_hex),
    startsAt,
    endsAt,
  };
}
