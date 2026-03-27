"use client";

import { useState } from "react";
import Image from "next/image";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, ChevronRight, Dna, ChevronDown, MapPin, Star, Trophy, Zap } from "lucide-react";
import { useBreeders } from "@/hooks/useBreeders";
import { useLanguage } from "@/context/LanguageContext";
import { BreederRibbon } from "@/components/storefront/BreederRibbon";
import { Loader2 } from "lucide-react";
import type { Breeder } from "@/types/supabase";

// ── Structured highlight grid from DB fields ─────────────────────────────────
type HighlightRow = { icon: React.ElementType; label: string; value: string };

function HighlightGrid({ rows }: { rows: HighlightRow[] }) {
  if (rows.length === 0) return null;
  return (
    <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {rows.map(({ icon: Icon, label, value }) => (
        <li key={label} className="flex items-start gap-2 rounded-xl bg-primary/5 px-3 py-2.5">
          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/60">{label}</p>
            <p className="text-xs leading-snug text-zinc-700">{value}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── ExpandableDescription ─────────────────────────────────────────────────────
function ExpandableDescription({
  summary,
  fullText,
  highlights,
  readMoreLabel,
  readLessLabel,
}: {
  summary: string | null;
  fullText: string | null;
  highlights: HighlightRow[];
  readMoreLabel: string;
  readLessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  // Show button if there is a full description different from summary, or structured highlights
  const hasMore = (!!fullText && fullText !== summary) || highlights.length > 0;

  return (
    <div className="flex-1">
      {/* Summary — always visible, never falls back to fullText */}
      {summary && (
        <div className="relative">
          <p className="text-sm leading-relaxed text-zinc-500">{summary}</p>
          {hasMore && !expanded && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>
      )}

      {/* Full story + highlights — animated expand */}
      <AnimatePresence initial={false}>
        {expanded && hasMore && (
          <motion.div
            key="full"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="mt-3 border-t border-zinc-100 pt-3 space-y-3">
              {fullText && fullText !== summary && (
                <p className="text-sm leading-relaxed text-zinc-500">{fullText}</p>
              )}
              {highlights.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Key Highlights</p>
                  <HighlightGrid rows={highlights} />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm transition-all duration-200 hover:bg-primary/10 hover:shadow-sm active:scale-95"
        >
          {expanded ? readLessLabel : readMoreLabel}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="inline-flex"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.span>
        </button>
      )}
    </div>
  );
}

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function BreedersPage() {
  const { breeders, isLoading } = useBreeders();
  const { t, locale } = useLanguage();
  const active = breeders.filter((b) => b.is_active);

  return (
    <div className="min-h-screen bg-white pb-24 pt-24">
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <BreederRibbon compact />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Page Header */}
        <div className="mb-12 mt-10 text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Leaf className="h-3.5 w-3.5" />
            {t("แบรนด์ที่เราคัดสรร", "Our Curated Breeders")}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            {t("Breeders ชั้นนำระดับโลก", "World-Class Breeders")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">
            {t(
              "เราคัดสรรเฉพาะ Breeder ที่มีชื่อเสียงและผ่านการตรวจสอบคุณภาพ เพื่อมอบสายพันธุ์ที่ดีที่สุดให้แก่คุณ",
              "We partner only with reputable, quality-verified breeders to bring you the finest genetics available."
            )}
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && active.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <Leaf className="h-12 w-12 text-zinc-200" />
            <p className="text-sm text-zinc-400">{t("ยังไม่มี Breeder", "No breeders yet")}</p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && active.length > 0 && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {active.map((breeder) => (
              <motion.div
                key={breeder.id}
                variants={cardVariant}
                className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Logo area */}
                <div className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-zinc-50">
                  <div className="flex h-28 w-28 items-center justify-center">
                    <BreederLogoImage
                      src={breeder.logo_url}
                      breederName={breeder.name}
                      width={112}
                      height={112}
                      className="rounded-2xl transition-transform duration-300 group-hover:scale-110"
                      imgClassName="object-contain"
                      sizes="112px"
                    />
                  </div>
                  {/* Glassmorphism badge */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/10" />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 text-base font-bold text-zinc-900 group-hover:text-primary">
                    {breeder.name}
                  </h3>
                  {(() => {
                    const isEn = locale === "en";
                    const summaryRaw = isEn
                      ? (breeder.summary_en ?? breeder.summary_th)
                      : (breeder.summary_th ?? breeder.summary_en);
                    const fullText = isEn
                      ? (breeder.description_en ?? breeder.description)
                      : (breeder.description ?? breeder.description_en);

                    // Collapsed shows ONLY the dedicated summary — never truncated description
                    const collapsedText = summaryRaw ?? null;

                    // Build structured highlights from DB fields
                    const highlights: HighlightRow[] = [
                      {
                        icon: MapPin,
                        label: t("แหล่งกำเนิด", "Origin"),
                        value: isEn
                          ? (breeder.highlight_origin_en ?? breeder.highlight_origin_th ?? "")
                          : (breeder.highlight_origin_th ?? breeder.highlight_origin_en ?? ""),
                      },
                      {
                        icon: Star,
                        label: t("ความเชี่ยวชาญ", "Specialty"),
                        value: isEn
                          ? (breeder.highlight_specialty_en ?? breeder.highlight_specialty_th ?? "")
                          : (breeder.highlight_specialty_th ?? breeder.highlight_specialty_en ?? ""),
                      },
                      {
                        icon: Trophy,
                        label: t("ชื่อเสียง", "Reputation"),
                        value: isEn
                          ? (breeder.highlight_reputation_en ?? breeder.highlight_reputation_th ?? "")
                          : (breeder.highlight_reputation_th ?? breeder.highlight_reputation_en ?? ""),
                      },
                      {
                        icon: Zap,
                        label: t("จุดเด่น", "Focus"),
                        value: isEn
                          ? (breeder.highlight_focus_en ?? breeder.highlight_focus_th ?? "")
                          : (breeder.highlight_focus_th ?? breeder.highlight_focus_en ?? ""),
                      },
                    ].filter((r) => !!r.value);

                    const hasContent = !!collapsedText || !!fullText || highlights.length > 0;
                    return hasContent ? (
                      <ExpandableDescription
                        summary={collapsedText}
                        fullText={fullText}
                        highlights={highlights}
                        readMoreLabel={t("อ่านประวัติเต็ม", "Read Full Story")}
                        readLessLabel={t("ย่อลง", "Show Less")}
                      />
                    ) : (
                      <p className="flex-1 text-sm italic text-zinc-300">
                        {t("ยังไม่มีคำอธิบาย", "No description yet")}
                      </p>
                    );
                  })()}

                  {/* CTA */}
                  <Link
                    href={`/shop?breeder=${breeder.id}`}
                    className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    <Dna className="h-4 w-4" />
                    {t("ดูสายพันธุ์", "Explore Genetics")}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Back to shop */}
        <div className="mt-14 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-primary"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            {t("กลับไปร้านค้า", "Back to Shop")}
          </Link>
        </div>

      </div>
    </div>
  );
}
