import path from "node:path";

/** Allowlisted Green Future partner PDFs (admin-only; never under public/). */
export const GREEN_FUTURE_PARTNER_DOC_FILES = [
  "auto-fem.pdf",
  "fem.pdf",
  "ista-letter.pdf",
  "seed-supply-coa-proposal.pdf",
] as const;

export type GreenFuturePartnerDocFile =
  (typeof GREEN_FUTURE_PARTNER_DOC_FILES)[number];

const ALLOWED = new Set<string>(GREEN_FUTURE_PARTNER_DOC_FILES);

export function isAllowedGreenFuturePartnerDoc(
  fileName: string
): fileName is GreenFuturePartnerDocFile {
  return ALLOWED.has(fileName);
}

/** Absolute path under repo `private/partner-docs/green-future/`. */
export function greenFuturePartnerDocPath(fileName: GreenFuturePartnerDocFile): string {
  return path.join(
    process.cwd(),
    "private",
    "partner-docs",
    "green-future",
    fileName
  );
}

/** Authenticated admin URL for a partner PDF. */
export function greenFuturePartnerDocAdminUrl(
  fileName: GreenFuturePartnerDocFile
): string {
  return `/api/admin/partners/green-future/files/${encodeURIComponent(fileName)}`;
}

/**
 * Rewrite legacy public `/partner-docs/...` (or bare filenames) to the
 * admin-gated file route so existing DB rows keep working after lockdown.
 */
export function resolvePartnerDocumentHref(fileUrl: string): string {
  const raw = fileUrl.trim();
  if (!raw) return raw;

  let pathname = raw;
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      pathname = new URL(raw).pathname;
    }
  } catch {
    return raw;
  }

  const legacyPrefix = "/partner-docs/green-future/";
  const apiPrefix = "/api/admin/partners/green-future/files/";

  let fileName: string | null = null;
  if (pathname.startsWith(legacyPrefix)) {
    fileName = decodeURIComponent(pathname.slice(legacyPrefix.length));
  } else if (pathname.startsWith(apiPrefix)) {
    fileName = decodeURIComponent(pathname.slice(apiPrefix.length));
  } else if (ALLOWED.has(pathname.replace(/^\//, ""))) {
    fileName = pathname.replace(/^\//, "");
  }

  if (fileName && isAllowedGreenFuturePartnerDoc(fileName)) {
    return greenFuturePartnerDocAdminUrl(fileName);
  }
  return raw;
}
