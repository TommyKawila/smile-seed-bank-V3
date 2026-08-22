import path from "node:path";

/** Private partner document root — not served from /public. */
export const PARTNER_DOCS_ROOT = path.join(
  process.cwd(),
  "data/partners/green-future/documents"
);

export function adminPartnerDocUrl(fileName: string): string {
  return `/api/admin/partner-docs/green-future/${fileName}`;
}
