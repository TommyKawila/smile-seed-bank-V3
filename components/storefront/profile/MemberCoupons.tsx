"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, Ticket } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import type { ApiSavedCoupon } from "@/services/checkout-service";
import { partitionMemberSavedCoupons } from "@/services/checkout-service";

type TFn = (th: string, en: string) => string;

function formatValidUntil(iso: string, locale: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  const loc = locale === "th" ? "th-TH" : "en-GB";
  return d.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" });
}

function discountDetail(c: ApiSavedCoupon, t: TFn): string {
  const dt = String(c.discount_type ?? "").toUpperCase();
  const v = c.discount_value;
  if (dt === "PERCENTAGE" || dt === "PERCENT") {
    return t(`ลด ${v}%`, `${v}% off`);
  }
  const n = Number(v);
  const safe = Number.isFinite(n) ? n : 0;
  return t(`ลด ${formatPrice(safe)}`, `${formatPrice(safe)} off`);
}

function CouponRow({
  c,
  variant,
  locale,
  t,
  mono,
  serif,
}: {
  c: ApiSavedCoupon;
  variant: "available" | "expired";
  locale: string;
  t: TFn;
  mono: string;
  serif: string;
}) {
  const expired = variant === "expired";
  const validLabel = formatValidUntil(c.end_at ?? "", locale);

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        expired
          ? "border-zinc-200/90 bg-zinc-50/80 opacity-[0.72]"
          : "border-emerald-200/80 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-900/5",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className={cn(mono, "text-base font-semibold tracking-tight", expired ? "text-zinc-600" : "text-emerald-900")}>
            {c.promo_code}
          </p>
          {c.name ? (
            <p className={cn(serif, "text-xs", expired ? "text-zinc-500" : "text-emerald-800/85")}>{c.name}</p>
          ) : null}
          <p className={cn(serif, "text-sm font-medium", expired ? "text-zinc-600" : "text-emerald-900")}>
            {discountDetail(c, t)}
          </p>
        </div>
        {expired ? (
          <Badge variant="outline" className="shrink-0 border-zinc-300 bg-white/70 text-[10px] uppercase text-zinc-500">
            {t("หมดอายุ", "Expired")}
          </Badge>
        ) : null}
      </div>
      <div
        className={cn(
          "mt-3 border-t pt-3 text-[11px] uppercase tracking-wide",
          serif,
          expired ? "border-zinc-200 text-zinc-500" : "border-emerald-200/70 text-emerald-800/80",
        )}
      >
        <span className="font-medium">{t("ใช้ได้ถึง", "Valid until")}</span>
        <span className={cn(mono, "ml-2 font-normal normal-case tracking-normal")}>{validLabel}</span>
      </div>
    </div>
  );
}

export function MemberCoupons({
  locale,
  t,
  mono,
  serif,
}: {
  locale: string;
  t: TFn;
  mono: string;
  serif: string;
}) {
  const [items, setItems] = useState<ApiSavedCoupon[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancel = false;
    void fetch("/api/storefront/profile/member-saved-campaigns", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("fetch failed");
        const j = (await res.json()) as { items?: ApiSavedCoupon[] };
        if (!cancel) setItems(Array.isArray(j.items) ? j.items : []);
      })
      .catch(() => {
        if (!cancel) {
          setErr(true);
          setItems([]);
        }
      });
    return () => {
      cancel = true;
    };
  }, []);

  const { available, expired } = useMemo(
    () => partitionMemberSavedCoupons(items ?? [], new Date()),
    [items],
  );

  const loading = items === null;

  return (
    <div className="overflow-hidden rounded-sm border border-zinc-100 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-2">
          <Ticket className={cn("h-4 w-4 shrink-0 text-primary")} strokeWidth={1.5} />
          <h2 className={cn(serif, "text-base font-medium text-zinc-900")}>
            {t("คูปองสมาชิก", "Member coupons")}
          </h2>
        </div>
        <p className={cn("mt-1 text-xs text-zinc-500", serif)}>
          {t("จากแคมเปญที่คุณกดเก็บไว้ในร้าน", "Saved from storefront campaigns")}
        </p>
      </div>

      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
          </div>
        ) : err ? (
          <p className="text-center text-sm text-red-600">
            {t("โหลดคูปองไม่สำเร็จ", "Could not load coupons")}
          </p>
        ) : items!.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            {t(
              "ยังไม่มีคูปองที่เก็บจากแคมเปญ — เก็บได้จากป๊อปอัพหรือแบนเนอร์ส่วนลด",
              "No campaign coupons saved yet — save offers from promotions on the shop.",
            )}
          </p>
        ) : (
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-sm bg-zinc-100 p-1">
              <TabsTrigger
                value="available"
                className="rounded-sm text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm sm:text-sm"
              >
                {t("ใช้ได้", "Available")}
                {available.length > 0 ? (
                  <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0 text-[10px] font-semibold text-emerald-800">
                    {available.length}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="expired"
                className="rounded-sm text-xs font-medium text-zinc-600 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm sm:text-sm"
              >
                {t("หมดอายุแล้ว", "Expired")}
                {expired.length > 0 ? (
                  <span className="ml-1.5 rounded-full bg-zinc-200/90 px-2 py-0 text-[10px] font-semibold text-zinc-600">
                    {expired.length}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="mt-4 space-y-3 focus-visible:outline-none">
              {available.length === 0 ? (
                <p className="rounded-lg border border-dashed border-emerald-200/60 bg-emerald-50/20 px-3 py-6 text-center text-sm text-emerald-800/80">
                  {t("ไม่มีคูปองที่ใช้ได้ในขณะนี้", "No available coupons right now")}
                </p>
              ) : (
                available.map((c) => (
                  <CouponRow key={`a-${c.campaign_id}-${c.promo_code}`} c={c} variant="available" locale={locale} t={t} mono={mono} serif={serif} />
                ))
              )}
            </TabsContent>

            <TabsContent value="expired" className="mt-4 space-y-3 focus-visible:outline-none">
              {expired.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-500">
                  {t("ไม่มีคูปองที่หมดอายุในบัญชีนี้", "No expired coupons")}
                </p>
              ) : (
                expired.map((c) => (
                  <CouponRow key={`e-${c.campaign_id}-${c.promo_code}`} c={c} variant="expired" locale={locale} t={t} mono={mono} serif={serif} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
