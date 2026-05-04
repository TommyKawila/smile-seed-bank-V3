import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Storefront URL locale segment (`/[locale]/...`). */
export type AppLocale = "th" | "en";

const LEADING_LOCALE_SEGMENT = /^\/(th|en)(?=\/|$)/;

function stripAppLocaleSegments(pathname: string): string {
  let path = pathname;
  for (;;) {
    const match = path.match(LEADING_LOCALE_SEGMENT);
    if (!match) break;
    const rest = path.slice(match[0].length);
    path = rest === "" || rest === "/" ? "/" : rest.startsWith("/") ? rest : `/${rest}`;
  }
  return path;
}

function pathnameSkipsLocalePrefix(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_next")
  );
}

function splitPathnameAndSuffix(input: string): { pathname: string; suffix: string } {
  const q = input.indexOf("?");
  if (q >= 0) {
    return { pathname: input.slice(0, q), suffix: input.slice(q) };
  }
  const h = input.indexOf("#");
  if (h >= 0) {
    return { pathname: input.slice(0, h), suffix: input.slice(h) };
  }
  return { pathname: input, suffix: "" };
}

/**
 * Internal storefront paths → `/${locale}/...`. Idempotent when `path` already has the correct prefix.
 * Skips localization for absolute URLs (http/https), protocol-relative URLs, mailto/tel, and `/api`, `/admin`, `/_next`.
 */
export function getLocalizedPath(path: string | null | undefined, locale: AppLocale): string {
  const seg = locale === "en" ? "en" : "th";
  if (path == null) return `/${seg}`;
  const trimmed = path.trim();
  if (trimmed === "") return `/${seg}`;

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//")) return trimmed;
  if (/^(mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (/^javascript:/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("#")) return trimmed;

  const { pathname: rawPath, suffix } = splitPathnameAndSuffix(trimmed);
  const withSlash = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const normalized = stripAppLocaleSegments(withSlash);
  if (pathnameSkipsLocalePrefix(normalized)) {
    return `${normalized}${suffix}`;
  }

  const rest = normalized === "/" ? "" : normalized;
  return `/${seg}${rest}${suffix}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9 && digits.startsWith("0")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 8 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return phone;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .trim();
}
