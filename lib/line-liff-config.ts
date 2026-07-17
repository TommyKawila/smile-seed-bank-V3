/** Public LIFF app id — set after creating LIFF in LINE Developers Console. */
export function getLiffId(): string {
  return process.env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";
}

export const LIFF_DEFAULT_REDIRECT = "/shop";
