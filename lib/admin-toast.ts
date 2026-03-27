/** Shared helpers for Shadcn toast messages in Admin. */

export function toastErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
