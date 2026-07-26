"use client";

import { useLanguage } from "@/context/LanguageContext";

export function GrowerToolsAiDisabledNotice() {
  const { t } = useLanguage();
  return (
    <div
      role="status"
      className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-100"
    >
      {t(
        "โหมด AI ถูกปิดชั่วคราว — แอดมินสามารถเปิดได้จากหลังบ้าน · เครื่องมือ VPD ยังใช้ได้ตามปกติ",
        "AI mode is temporarily off — admins can re-enable it · VPD calculator still works"
      )}
    </div>
  );
}
