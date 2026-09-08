import path from "node:path";

export { adminPartnerDocUrl } from "@/lib/partner-docs-url";

/** Private partner document root — not served from /public. */
export const PARTNER_DOCS_ROOT = path.join(
  process.cwd(),
  "data/partners/green-future/documents"
);
