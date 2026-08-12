"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  COLLABORATION_PLAN,
  collaborationPlanSharePath,
  type PlanLocale,
} from "@/lib/green-future-collaboration-plan";
import { CopyShareLinkButton } from "@/components/admin/partners/CopyShareLinkButton";

function parseLocale(raw: string | null): PlanLocale {
  return raw === "en" ? "en" : "th";
}

export function CollaborationPlanDocument({ locale }: { locale: PlanLocale }) {
  const t = COLLABORATION_PLAN[locale];

  return (
    <article className="space-y-8 text-slate-800" lang={locale}>
      <header className="space-y-3 border-b border-slate-200 pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {t.kicker}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {t.title}
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">{t.project}</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">{t.partnersTitle}</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed">
          {t.partners.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">{t.objectiveTitle}</h2>
        <p className="text-sm leading-relaxed text-slate-700">{t.objective}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">{t.dutiesTitle}</h2>
        <p className="text-sm leading-relaxed text-slate-600">{t.dutiesIntro}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <DutyCard title={t.gfTitle} subtitle={t.gfSubtitle} items={t.gfItems} />
          <DutyCard title={t.ssbTitle} subtitle={t.ssbSubtitle} items={t.ssbItems} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">{t.workflowTitle}</h2>
        <div className="space-y-4">
          {t.phases.map((phase) => (
            <div key={phase.n} className="border-l-2 border-slate-300 pl-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Phase {phase.n}
              </p>
              <h3 className="mt-0.5 text-sm font-semibold text-slate-900">
                {phase.title}
              </h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-slate-700">
                {phase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">{t.summaryTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{t.summary}</p>
      </section>
    </article>
  );
}

function DutyCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function LocaleToggle({
  locale,
  onChange,
}: {
  locale: PlanLocale;
  onChange: (next: PlanLocale) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 p-0.5">
      {(["th", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={cn(
            "min-h-9 rounded px-3 text-xs font-semibold uppercase",
            locale === code
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

export function CollaborationPlanView({
  showCopyLink = false,
  adminChrome = false,
}: {
  showCopyLink?: boolean;
  adminChrome?: boolean;
}) {
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<PlanLocale>(() =>
    parseLocale(searchParams.get("lang"))
  );

  const onLocale = useCallback((next: PlanLocale) => {
    setLocale(next);
    const url = new URL(window.location.href);
    if (next === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, []);

  return (
    <div className="space-y-4">
      {adminChrome ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              {locale === "th" ? "แผนงานความร่วมมือ" : "Collaboration Plan"}
            </h2>
            <p className="max-w-2xl text-sm text-slate-500">
              {locale === "th"
                ? "แผนงานความร่วมมือ Green Future × Smile Seed Bank — แชร์ลิงก์ให้คู่ค้าอ่านได้"
                : "Green Future × Smile Seed Bank collaboration plan — share the link with partners."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LocaleToggle locale={locale} onChange={onLocale} />
            {showCopyLink ? (
              <CopyShareLinkButton path={collaborationPlanSharePath(locale)} />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <LocaleToggle locale={locale} onChange={onLocale} />
        </div>
      )}
      <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
        <CollaborationPlanDocument locale={locale} />
      </div>
    </div>
  );
}
