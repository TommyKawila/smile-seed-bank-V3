"use client";

import { useEffect, useState } from "react";
import type { CabinetStoragePublicView } from "@/lib/cabinet-storage-log-types";
import {
  formatStorageLogWhen,
  storageLogT,
  type StorageLogLang,
  STORAGE_LOG_LANG_KEY,
} from "@/lib/cabinet-storage-log-i18n";
import { cn } from "@/lib/utils";

function SpecBadge({ inSpec, lang }: { inSpec: boolean; lang: StorageLogLang }) {
  const t = storageLogT(lang);
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        inSpec ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
      )}
    >
      {inSpec ? t.inSpec : t.outOfSpec}
    </span>
  );
}

export function StorageLogShareView({ data }: { data: CabinetStoragePublicView }) {
  const [lang, setLang] = useState<StorageLogLang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LOG_LANG_KEY);
      if (saved === "th" || saved === "en") setLang(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const pickLang = (next: StorageLogLang) => {
    setLang(next);
    try {
      localStorage.setItem(STORAGE_LOG_LANG_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const t = storageLogT(lang);
  const latest = data.latest;
  const cabinetLabel =
    lang === "th" ? data.spec.cabinetLabelTh : data.spec.cabinetLabelEn;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-3 text-center">
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => pickLang("th")}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium",
              lang === "th"
                ? "bg-[#12463e] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            )}
          >
            {t.th}
          </button>
          <button
            type="button"
            onClick={() => pickLang("en")}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium",
              lang === "en"
                ? "bg-[#12463e] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            )}
          >
            {t.en}
          </button>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">{t.title}</h1>
        <p className="text-sm text-slate-500">{t.subtitle}</p>
        <p className="text-xs text-slate-400">{t.partnerNote}</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p className="font-medium text-slate-900">{t.specTitle}</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>{t.specTemp}</li>
          <li>{t.specRh}</li>
          <li>{cabinetLabel}</li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">{t.latest}</h2>
        {!latest ? (
          <p className="text-sm text-slate-500">{t.noEntries}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-slate-900">
                {latest.tempC}°C · {latest.rhPct}% RH
              </span>
              <SpecBadge inSpec={latest.inSpec} lang={lang} />
            </div>
            <p className="text-xs text-slate-500">
              {t.loggedAt}: {formatStorageLogWhen(latest.loggedAt, lang)}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={latest.photoUrl}
              alt=""
              className="w-full max-h-80 rounded-lg object-contain bg-slate-100"
            />
            {latest.note ? (
              <p className="text-sm text-slate-600">
                {t.note}: {latest.note}
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">{t.history}</h2>
        {data.entries.length === 0 ? (
          <p className="text-sm text-slate-500">{t.noEntries}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.entries.map((entry) => (
              <li key={entry.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.photoUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-md object-cover bg-slate-100"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {entry.tempC}°C · {entry.rhPct}%
                    </span>
                    <SpecBadge inSpec={entry.inSpec} lang={lang} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatStorageLogWhen(entry.loggedAt, lang)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
