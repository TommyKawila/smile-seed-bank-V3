import type { GrowerToolAiAction } from "@/lib/grower-tools-settings";

type Locale = "th" | "en";

const MESSAGES: Record<
  string,
  { th: string; en: string }
> = {
  rate_limited: {
    th: "ใช้งานถี่เกินไป ลองใหม่ในอีกสักครู่",
    en: "Too many requests — please wait and try again",
  },
  ai_disabled: {
    th: "โหมด AI ถูกปิดชั่วคราว",
    en: "AI mode is temporarily disabled",
  },
  budget_exceeded: {
    th: "งบ API วันนี้เต็มแล้ว — ลองใหม่ภายหลัง",
    en: "Daily API budget reached — try again later",
  },
};

export function growerToolApiErrorMessage(
  code: string,
  locale: Locale,
  retryAfterSec?: number
): string {
  const base = MESSAGES[code]?.[locale === "en" ? "en" : "th"] ?? code;
  if (code === "rate_limited" && retryAfterSec && retryAfterSec > 0) {
    return locale === "en"
      ? `${base} (~${retryAfterSec}s)`
      : `${base} (~${retryAfterSec} วินาที)`;
  }
  return base;
}

export function parseGrowerToolApiError(
  status: number,
  body: { error?: string; retryAfterSec?: number },
  locale: Locale
): string {
  const code = body.error ?? "Request failed";
  if (status === 429 || code === "Too many requests") {
    return growerToolApiErrorMessage("rate_limited", locale, body.retryAfterSec);
  }
  if (code === "ai_disabled") {
    return growerToolApiErrorMessage("ai_disabled", locale);
  }
  if (code === "budget_exceeded") {
    return growerToolApiErrorMessage("budget_exceeded", locale);
  }
  return code;
}

export type { GrowerToolAiAction };
