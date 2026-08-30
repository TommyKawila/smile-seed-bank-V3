"use client";

import { useState } from "react";
import { Eye, FileStack } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  GF_PILOT_INCLUDED_DOCS_EN,
  GF_PILOT_INCLUDED_DOCS_NOTE_EN,
  GF_PILOT_INCLUDED_DOCS_NOTE_TH,
  GF_PILOT_INCLUDED_DOCS_TH,
  GF_PILOT_INCLUDED_DOCS_TITLE_EN,
  GF_PILOT_INCLUDED_DOCS_TITLE_TH,
} from "@/lib/green-future-approved-marketing";
import { CoaSamplePreviewModal } from "./CoaSamplePreviewModal";

const LOT_TEST_SAMPLE_CODE = "AF22";
const LOT_TEST_SAMPLE_URL = `/api/wholesale/lot-test-sample?code=${LOT_TEST_SAMPLE_CODE}`;

export function PilotLotDocsIncluded() {
  const { t } = useLanguage();
  const [sampleOpen, setSampleOpen] = useState(false);
  const items = t(
    GF_PILOT_INCLUDED_DOCS_TH.join("\n"),
    GF_PILOT_INCLUDED_DOCS_EN.join("\n")
  ).split("\n");

  const sampleTitle = t(
    `ตัวอย่างผลทดสอบล็อต (${LOT_TEST_SAMPLE_CODE}) — หน่วยงานรัฐ`,
    `Sample lot test report (${LOT_TEST_SAMPLE_CODE}) — government agency`
  );

  return (
    <>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <FileStack className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-emerald-950">
              {t(GF_PILOT_INCLUDED_DOCS_TITLE_TH, GF_PILOT_INCLUDED_DOCS_TITLE_EN)}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed text-emerald-950/90">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setSampleOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:text-emerald-800 hover:underline"
            >
              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t(
                `ดูตัวอย่างผลทดสอบล็อต (${LOT_TEST_SAMPLE_CODE})`,
                `View sample lot test (${LOT_TEST_SAMPLE_CODE})`
              )}
            </button>
            <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">
              {t(
                "ตัวอย่างมีลายน้ำ SSB — ไม่ใช่ใบ GACP และไม่ใช่ COA แล็บนอก (Package A/B)",
                "Watermarked SSB sample — not a GACP certificate or external lab COA (Package A/B)"
              )}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">
              {t(GF_PILOT_INCLUDED_DOCS_NOTE_TH, GF_PILOT_INCLUDED_DOCS_NOTE_EN)}
            </p>
          </div>
        </div>
      </div>

      <CoaSamplePreviewModal
        open={sampleOpen}
        onOpenChange={setSampleOpen}
        title={sampleTitle}
        sampleUrl={LOT_TEST_SAMPLE_URL}
        packageKey="A"
      />
    </>
  );
}
