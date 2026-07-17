"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";
import { Loader2, Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const orderMono = JetBrains_Mono({ subsets: ["latin"] });

type TrackPayload = {
  order_number: string;
  status: string;
  carrier_label: string;
  tracking_number: string | null;
  tracking_url: string | null;
};

function statusDescription(status: string): string {
  const m: Record<string, string> = {
    PENDING_INFO: "รอให้คุณกรอกข้อมูลผ่านลิงก์ที่ได้รับ",
    AWAITING_VERIFICATION: "รอทีมตรวจสอบการชำระเงิน",
    PAID: "ชำระเงินแล้ว — กำลังเตรียมจัดส่ง",
    PENDING: "รอดำเนินการ",
    SHIPPED: "จัดส่งแล้ว",
    COMPLETED: "เสร็จสมบูรณ์",
    CANCELLED: "ยกเลิก",
    VOIDED: "ยกเลิก",
  };
  return m[status] ?? status;
}

export function OrderStatusClient({ token }: { token: string }) {
  const [data, setData] = useState<TrackPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/storefront/orders/track/${encodeURIComponent(token)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError((json as { error?: string }).error ?? "ไม่พบออเดอร์");
        setData(null);
        return;
      }
      setData(json as TrackPayload);
    } catch {
      setLoadError("โหลดไม่สำเร็จ");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
        <p className="text-sm">กำลังโหลดสถานะ…</p>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">{loadError ?? "ไม่พบข้อมูล"}</p>
      </div>
    );
  }

  const shippedWithNumber = data.status === "SHIPPED" && !!data.tracking_number;

  return (
    <div className="mx-auto max-w-lg px-1">
      <header className="mb-6 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Genetic Vault
        </p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          สถานะคำสั่งซื้อ
        </h1>
        <p className={cn("mt-3 text-sm text-primary/90", orderMono.className)}>
          #{data.order_number}
        </p>
      </header>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3 rounded-xl bg-muted/30 px-3 py-3">
          <Package className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{statusDescription(data.status)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{data.status}</p>
          </div>
        </div>

        {shippedWithNumber ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-900/80">
              {data.carrier_label}
            </p>
            <p className={cn("mt-2 break-all text-lg font-bold text-blue-950", orderMono.className)}>
              {data.tracking_number}
            </p>
            {data.tracking_url ? (
              <Button
                asChild
                className="mt-4 w-full bg-primary hover:bg-primary/90"
              >
                <a href={data.tracking_url} target="_blank" rel="noopener noreferrer">
                  ติดตามพัสดุ
                </a>
              </Button>
            ) : (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                ใช้เลขด้านบนไปติดตามที่เว็บขนส่งโดยตรง
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            {data.status === "SHIPPED"
              ? "เลขพัสดุจะแสดงที่นี่เมื่อทีมงานบันทึกแล้ว — ลองรีเฟรชด้านล่าง"
              : "เมื่อจัดส่งแล้ว เลขพัสดุและลิงก์ติดตามจะปรากฏที่หน้านี้"}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-emerald-800/25"
            onClick={() => void load()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            รีเฟรชสถานะ
          </Button>
          <Button asChild variant="ghost" className="flex-1 text-primary">
            <Link href="/shop">กลับไปร้านค้า</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
