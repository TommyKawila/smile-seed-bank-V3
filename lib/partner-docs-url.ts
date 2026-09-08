/** Admin URL helper — safe for client bundles (no node:path). */
export function adminPartnerDocUrl(fileName: string): string {
  return `/api/admin/partner-docs/green-future/${fileName}`;
}
