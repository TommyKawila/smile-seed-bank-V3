import en from "@/locales/en.json";
import th from "@/locales/th.json";

export function getMessage(locale: "th" | "en", key: string): string | undefined {
  const dict = locale === "th" ? th : en;
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}
