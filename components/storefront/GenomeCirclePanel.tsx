"use client";

import { BookOpen, FlaskConical, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
const serif = "font-[family-name:var(--font-journal-product-serif)]";
const mono = "font-[family-name:var(--font-journal-product-mono)] tabular-nums";

type Translate = (th: string, en: string) => string;

type OrderLite = { total_amount: number; status: string };

const COUNTED_STATUSES = new Set([
  "PAID",
  "COMPLETED",
  "SHIPPED",
  "DELIVERED",
  "AWAITING_VERIFICATION",
  "PENDING",
]);

const TIERS = [
  { id: "observer", minOrders: 0, label: "THE OBSERVER" },
  { id: "cultivator", minOrders: 1, label: "THE CULTIVATOR" },
  { id: "breeder", minOrders: 5, label: "THE BREEDER" },
  { id: "archivist", minOrders: 15, label: "THE ARCHIVIST" },
] as const;

function membershipFromOrders(orderCount: number, isWholesale: boolean) {
  if (isWholesale) {
    return {
      tierLabel: "THE CURATOR",
      nextTierLabel: null as string | null,
      progress: 1,
    };
  }
  let idx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (orderCount >= TIERS[i].minOrders) {
      idx = i;
      break;
    }
  }
  const current = TIERS[idx];
  const next = TIERS[idx + 1];
  if (!next) {
    return {
      tierLabel: current.label,
      nextTierLabel: null as string | null,
      progress: 1,
    };
  }
  const span = next.minOrders - current.minOrders;
  const pos = orderCount - current.minOrders;
  const progress = Math.min(1, Math.max(0, span <= 0 ? 1 : pos / span));
  return {
    tierLabel: current.label,
    nextTierLabel: next.label,
    progress,
  };
}

function seedPointsFromOrders(orders: OrderLite[]) {
  return orders
    .filter((o) => COUNTED_STATUSES.has(o.status))
    .reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
}

function formatRef(userId: string) {
  const compact = userId.replace(/-/g, "").toUpperCase();
  const suffix = compact.slice(0, 8);
  return `REF#SSB-USER-${suffix}`;
}

export function GenomeCirclePanel({
  orders,
  isWholesale,
  userId,
  t,
}: {
  orders: OrderLite[];
  isWholesale: boolean;
  userId: string;
  t: Translate;
}) {
  const orderCount = orders.length;
  const { tierLabel, nextTierLabel, progress } = membershipFromOrders(orderCount, isWholesale);
  const seedPoints = seedPointsFromOrders(orders);
  const refId = formatRef(userId);

  const benefits = [
    {
      icon: Sparkles,
      title: t("เข้าถึงก่อนใคร", "Early access"),
      sub: t("สายพันธุ์ใหม่ก่อนวางขายทั่วไป", "New drops before public release"),
    },
    {
      icon: BookOpen,
      title: t("รายงานวิจัย", "Research reports"),
      sub: t("สรุปจาก Smile Seed Blog และคลังความรู้", "Curated from our journal & lab notes"),
    },
    {
      icon: FlaskConical,
      title: t("ห้องปฏิบัติการสมาชิก", "Lab briefings"),
      sub: t("เทคนิคเพาะเมล็ดระดับลึก", "Advanced cultivation protocols"),
    },
    {
      icon: MessageSquare,
      title: t("ที่ปรึกษาเฉพาะทาง", "Private consult"),
      sub: t("คิวสอบถามสายพันธุ์แบบจำกัด", "Priority Q&A — limited slots"),
    },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-4 border-b border-zinc-100 pb-8">
        <div className="space-y-1">
          <p className={cn(mono, "text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400")}>
            {t("โครงการสมาชิก", "Membership program")}
          </p>
          <h1 className={cn(serif, "text-2xl font-medium tracking-tight text-zinc-900 sm:text-3xl")}>
            The Genome Circle
          </h1>
        </div>

        <div className="space-y-2">
          <p className={cn(mono, "text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-800")}>
            {t(`ระดับสมาชิก: ${tierLabel}`, `Member level: ${tierLabel}`)}
          </p>
          <p className={cn(mono, "text-[10px] uppercase tracking-wider text-zinc-500")}>{refId}</p>
        </div>

        {nextTierLabel ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className={cn(mono, "text-[10px] uppercase tracking-widest text-zinc-400")}>
                {t("ความคืบหน้าสู่ระดับถัดไป", "Progress to next tier")}
              </span>
              <span className={cn(mono, "text-[10px] text-zinc-500")}>{nextTierLabel}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-emerald-600/20">
              <div
                className="h-full rounded-full bg-emerald-700 transition-[width] duration-500 ease-out"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="h-1 w-full overflow-hidden rounded-full bg-emerald-600/20">
            <div className="h-full w-full rounded-full bg-emerald-700" />
          </div>
        )}
      </header>

      <section className="space-y-3">
        <h2 className={cn(serif, "text-sm font-medium text-zinc-800")}>
          {t("สิทธิประโยชน์", "Benefits")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-sm border border-zinc-100 bg-zinc-50/50 p-4 transition-colors hover:border-zinc-200 hover:bg-white"
            >
              <b.icon className="mb-3 h-5 w-5 text-emerald-800/80" strokeWidth={1} aria-hidden />
              <p className={cn(mono, "text-[11px] font-medium uppercase tracking-wide text-zinc-800")}>
                {b.title}
              </p>
              <p className="mt-1.5 text-xs font-light leading-relaxed text-zinc-500">{b.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-sm border border-zinc-100 bg-white px-4 py-5 shadow-sm">
        <p className={cn(mono, "text-[10px] font-medium uppercase tracking-widest text-zinc-400")}>
          {t("Seed Points", "Seed Points")}
        </p>
        <p className={cn(mono, "mt-2 text-3xl font-medium tracking-tight text-zinc-900")}>
          {seedPoints.toLocaleString("en-US")}
        </p>
        <p className="mt-1 text-[11px] font-light leading-relaxed text-zinc-500">
          {t(
            "สะสมจากยอดสั่งซื้อที่ยืนยันแล้ว (หน่วย: บาทเทียบเท่า)",
            "Accrued from confirmed order value (THB-equivalent units)."
          )}
        </p>
      </section>
    </div>
  );
}
