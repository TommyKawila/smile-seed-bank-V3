function stripEnvQuotes(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']+|["']+$/g, "");
}

/** Public LIFF app id — set after creating LIFF in LINE Developers Console. */
export function getLiffId(): string {
  return stripEnvQuotes(process.env.NEXT_PUBLIC_LIFF_ID);
}

export const LIFF_DEFAULT_REDIRECT = "/shop";
