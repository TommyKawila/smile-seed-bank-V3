"use client";

import { useState } from "react";
import { FileLock2, FlaskConical, LockOpen, Truck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const MOCK_COAS = [
  { id: "ww", name: "White Widow — COA Sample.pdf" },
  { id: "nl", name: "Northern Lights — COA Sample.pdf" },
  { id: "pe", name: "Pineapple Express Auto — COA Sample.pdf" },
];

export function TrustCompliance() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/wholesale/coa-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Failed");
      }
      setUnlocked(true);
    } catch {
      setError(
        t("บันทึกอีเมลไม่สำเร็จ กรุณาลองใหม่", "Could not save email. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="coa" className="scroll-mt-24 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-start gap-3">
          <FlaskConical className="mt-1 h-6 w-6 text-emerald-600" aria-hidden />
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t(
                "คุณภาพรับประกัน · ผ่านห้องแล็บ",
                "Guaranteed Quality & Lab Tested"
              )}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              {t(
                "ดาวน์โหลดตัวอย่าง COA มาตรฐาน — กรอกอีเมลธุรกิจเพื่อปลดล็อก",
                "Download standard COA samples — enter your business email to unlock."
              )}
            </p>
          </div>
        </div>

        <ul className="mt-8 space-y-3">
          {MOCK_COAS.map((coa) => (
            <li
              key={coa.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3 text-sm font-medium text-slate-800">
                {unlocked ? (
                  <LockOpen className="h-5 w-5 text-emerald-600" aria-hidden />
                ) : (
                  <FileLock2 className="h-5 w-5 text-slate-400" aria-hidden />
                )}
                {coa.name}
              </div>
              {unlocked ? (
                <button
                  type="button"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-emerald-600 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                  onClick={() => {
                    // Mock download — lead already captured
                    window.alert(
                      t(
                        "ตัวอย่าง COA จะถูกส่งไปที่อีเมลของคุณโดยทีม B2B",
                        "A COA sample will be sent to your email by our B2B team."
                      )
                    );
                  }}
                >
                  {t("ดาวน์โหลด", "Download")}
                </button>
              ) : (
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t("ล็อก", "Locked")}
                </span>
              )}
            </li>
          ))}
        </ul>

        {!unlocked ? (
          <form
            onSubmit={unlock}
            className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end"
          >
            <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("อีเมลธุรกิจ", "Business email")}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 flex h-12 w-full rounded-lg border border-slate-300 px-3 text-base text-slate-900 outline-none ring-emerald-500 focus:ring-2"
                placeholder="you@company.com"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading
                ? t("กำลังปลดล็อก…", "Unlocking…")
                : t("ปลดล็อกตัวอย่าง COA", "Unlock COA samples")}
            </button>
          </form>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <div className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <h3 className="text-base font-bold text-emerald-900">
            {t("ความพร้อมด้าน GACP", "GACP Compliance")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-emerald-950/80">
            {t(
              "Supplying GACP-Compliant Facilities: เรามีเอกสารพันธุกรรมรับรองและผลแล็บครบสำหรับงาน audit GACP ติดต่อทีม B2B เพื่อขอแพ็กเกจเอกสารทางการ (มีค่าธรรมเนียมเพิ่ม)",
              "Supplying GACP-Compliant Facilities: We provide certified genetic documentation and comprehensive lab analysis required for GACP audits. Contact our B2B team to request the official GACP documentation package (additional fees apply)."
            )}
          </p>
        </div>

        <div className="mt-6 inline-flex max-w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <Truck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <p>
            {t(
              "จัดส่งในประเทศจากบางพลี สมุทรปราการ (ไม่เสี่ยงศุลกากรนำเข้า · ส่ง 3–5 วัน)",
              "Local Delivery from Bang Phli, Samut Prakan (No import customs risk, 3-5 days delivery)"
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
