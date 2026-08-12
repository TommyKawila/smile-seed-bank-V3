export const SHIPPING_PAUSE_KEYS = {
  enabled: "shipping_pause_enabled",
  from: "shipping_pause_from",
  until: "shipping_pause_until",
  messageTh: "shipping_pause_message_th",
  messageEn: "shipping_pause_message_en",
} as const;

export type ShippingPauseState = {
  active: boolean;
  messageTh: string;
  messageEn: string;
  resumeDate: string;
  resumeDateIso: string;
};

export function bangkokTodayYmd(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(now);
}

function formatResumeDate(iso: string, locale: "th" | "en"): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function defaultMessageTh(resumeLabel: string): string {
  return `ช่วงนี้ยังรับออเดอร์ได้ แต่ยังไม่จัดส่ง · จะเริ่มส่งอีกครั้งวันที่ ${resumeLabel}`;
}

function defaultMessageEn(resumeLabel: string): string {
  return `We're still accepting orders, but shipping is paused · Resumes ${resumeLabel}`;
}

export function resolveShippingPause(
  settings: Record<string, string | undefined | null>,
  nowYmd: string = bangkokTodayYmd(),
): ShippingPauseState | null {
  const enabled = settings[SHIPPING_PAUSE_KEYS.enabled] === "true";
  const until = settings[SHIPPING_PAUSE_KEYS.until]?.trim();
  const from = settings[SHIPPING_PAUSE_KEYS.from]?.trim();

  if (!enabled || !until) return null;
  if (nowYmd >= until) return null;
  if (from && nowYmd < from) return null;

  const resumeTh = formatResumeDate(until, "th");
  const resumeEn = formatResumeDate(until, "en");
  const customTh = settings[SHIPPING_PAUSE_KEYS.messageTh]?.trim();
  const customEn = settings[SHIPPING_PAUSE_KEYS.messageEn]?.trim();

  return {
    active: true,
    messageTh: customTh || defaultMessageTh(resumeTh),
    messageEn: customEn || defaultMessageEn(resumeEn),
    resumeDate: resumeTh,
    resumeDateIso: until,
  };
}
