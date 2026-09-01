"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { normalizeLotNumber } from "@/lib/green-future-traceability";

type Props = {
  initialLot?: string;
};

export function TraceabilityLotLookupForm({ initialLot = "" }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const [value, setValue] = useState(initialLot);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lot = normalizeLotNumber(value);
    if (!lot) {
      setError(
        t(
          "กรอกเลขล็อตเป็นภาษาอังกฤษ/ตัวเลข เช่น GF-AF99-2606-B01",
          "Enter a lot number such as GF-AF99-2606-B01"
        )
      );
      return;
    }
    setError(null);
    router.push(`/traceability/${encodeURIComponent(lot)}`);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor="lot-lookup" className="block text-sm font-semibold text-slate-800">
        {t("เลขล็อต / แบทช์", "Lot / Batch No.")}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          id="lot-lookup"
          name="lot"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          placeholder="GF-AF99-2606-B01"
          className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:flex-1"
        />
        <button
          type="submit"
          className="inline-flex min-h-12 min-w-48 items-center justify-center rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          {t("ตรวจล็อต", "Look up lot")}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-slate-500">
          {t(
            "กรอกเลขล็อตตามฉลากบนซอง หากยังไม่พบข้อมูล แสดงว่าล็อตนี้ยังไม่มีสรุปสาธารณะ",
            "Enter the lot number printed on the pouch. If no record appears, a public summary is not available for that number yet."
          )}
        </p>
      )}
    </form>
  );
}
