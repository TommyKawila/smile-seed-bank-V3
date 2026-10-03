"use client";

import { Banknote, Layers, Package, Sprout } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const ITEMS = [
  {
    icon: Sprout,
    titleTh: "เมล็ด GF จากไทย",
    titleEn: "Thai GF genetics",
    bodyTh: "สายพันธุ์ SGF Seeds จาก Green Future ผลิตในประเทศไทย",
    bodyEn: "SGF Seeds strains from Green Future, produced in Thailand.",
  },
  {
    icon: Package,
    titleTh: "ซองซีล 50 เมล็ด",
    titleEn: "Sealed 50-seed pouches",
    bodyTh: "บรรจุแพ็กจากโรงงานผู้ผลิต ขายเป็นซองละ 50 เมล็ด",
    bodyEn: "Factory-packed sealed pouches, sold in 50-seed units.",
  },
  {
    icon: Layers,
    titleTh: "เรท 125 / 100 / 80",
    titleEn: "125 / 100 / 80 THB",
    bodyTh: "เริ่ม 125 บาท/เมล็ด ที่ขั้นต่ำ 50 เมล็ด ลดตามยอดรวมตะกร้า",
    bodyEn: "From 125 THB/seed at a 50-seed minimum, with cart-total volume tiers.",
  },
  {
    icon: Banknote,
    titleTh: "มัดจำ 50%",
    titleEn: "50% deposit",
    bodyTh: "โอนเข้า หจก.ทีเอ็มวาย อะโกรเทรด แล้วแนบสลิป — ไม่ใช้ตะกร้าร้าน",
    bodyEn: "Transfer to T.M.Y Agro Trade Limited Partnership and attach the slip — not the shop cart.",
  },
] as const;

export function GacpTrustGrid() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-slate-200 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t("เมล็ดขายส่ง SGF Seeds", "SGF Seeds wholesale")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {t(
            "เลือกสายพันธุ์ ใส่จำนวนซอง แล้วจองมัดจำ 50% — ราคาลดตามยอดรวมทั้งคำสั่ง",
            "Pick strains, set pouch counts, then reserve with a 50% deposit — volume pricing follows the cart total."
          )}
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.titleEn}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {t(item.titleTh, item.titleEn)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {t(item.bodyTh, item.bodyEn)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
