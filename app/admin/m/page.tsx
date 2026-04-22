"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Package, Printer, RefreshCw, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  bluetoothUnsupportedUserMessage,
  buildAndPrintLabel,
  connectPeripagePrinter,
  isPrinterConnected,
  isWebBluetoothPrintingSupported,
  type LabelPrintPayload,
} from "@/lib/peripage-printer";
import type { AdminOrder } from "@/hooks/useAdminOrders";

const MOBILE_JSON_HEADERS = {
  "Content-Type": "application/json",
  "X-Admin-UI": "m",
} as const;

const CARRIERS: { value: string; label: string }[] = [
  { value: "THAILAND_POST", label: "Thailand Post" },
  { value: "KERRY_EXPRESS", label: "Kerry" },
  { value: "FLASH_EXPRESS", label: "Flash" },
  { value: "J&T_EXPRESS", label: "J&T" },
];

function sortOrders(orders: AdminOrder[]): AdminOrder[] {
  const rank = (s: string) => {
    if (s === "AWAITING_VERIFICATION") return 0;
    if (s === "PAID" || s === "COMPLETED") return 1;
    return 2;
  };
  return [...orders].sort((a, b) => {
    const d = rank(a.status) - rank(b.status);
    if (d !== 0) return d;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "AWAITING_VERIFICATION":
      return "bg-amber-500/20 text-amber-200 border-amber-500/40";
    case "PENDING":
    case "PENDING_INFO":
      return "bg-zinc-500/25 text-zinc-200 border-zinc-500/40";
    case "PAID":
      return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
    case "COMPLETED":
      return "bg-cyan-500/15 text-cyan-200 border-cyan-500/30";
    case "SHIPPED":
      return "bg-sky-500/20 text-sky-200 border-sky-500/40";
    case "CANCELLED":
    case "VOIDED":
      return "bg-red-500/20 text-red-200 border-red-500/40";
    default:
      return "bg-zinc-600/30 text-zinc-300 border-zinc-600/50";
  }
}

function shortStatus(status: string): string {
  if (status === "AWAITING_VERIFICATION") return "รอตรวจ / Verify";
  return status;
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

function isLikelyImage(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url) || /\/object\//.test(url);
}

export default function AdminMobileOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [slipView, setSlipView] = useState<string | null>(null);
  const [tracking, setTracking] = useState<Record<number, string>>({});
  const [provider, setProvider] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [printBusy, setPrintBusy] = useState(false);
  const [pendingPrintOrder, setPendingPrintOrder] = useState<AdminOrder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = (await res.json()) as { orders?: AdminOrder[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      setOrders(data.orders ?? []);
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const supabase = createClient();
    const tick = () => {
      void supabase.auth.refreshSession();
    };
    tick();
    const t = setInterval(tick, 3 * 60 * 1000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const sorted = useMemo(() => sortOrders(orders), [orders]);

  const toLabelPayload = useCallback((o: AdminOrder): LabelPrintPayload => {
    return {
      customerName: o.customer_name?.trim() || "—",
      customerPhone: o.customer_phone?.trim() || "—",
      address: o.shipping_address?.trim() || "—",
      orderId: o.order_number,
      orderDate: o.created_at,
      trackingNumber: o.tracking_number,
      status: o.status,
    };
  }, []);

  const runPrint = useCallback(
    async (o: AdminOrder) => {
      if (!isWebBluetoothPrintingSupported()) {
        toast({ title: "Bluetooth", description: bluetoothUnsupportedUserMessage(), variant: "destructive" });
        return;
      }
      if (!isPrinterConnected()) {
        setPendingPrintOrder(o);
        setConnectOpen(true);
        return;
      }
      setPrintBusy(true);
      try {
        toast({ title: "Printing…", description: `#${o.order_number}` });
        await buildAndPrintLabel(toLabelPayload(o));
        toast({ title: "Printed", description: "Label sent to printer" });
      } catch (e) {
        toast({ title: "Print failed", description: String(e), variant: "destructive" });
      } finally {
        setPrintBusy(false);
      }
    },
    [toast, toLabelPayload]
  );

  const handleConnectSubmit = useCallback(async () => {
    if (!isWebBluetoothPrintingSupported()) {
      toast({ title: "Bluetooth", description: bluetoothUnsupportedUserMessage(), variant: "destructive" });
      return;
    }
    setPrintBusy(true);
    try {
      await connectPeripagePrinter();
      setConnectOpen(false);
      toast({ title: "Connected", description: "Printer ready" });
      if (pendingPrintOrder) {
        const o = pendingPrintOrder;
        setPendingPrintOrder(null);
        try {
          toast({ title: "Printing…", description: `#${o.order_number}` });
          await buildAndPrintLabel(toLabelPayload(o));
          toast({ title: "Printed", description: "Label sent to printer" });
        } catch (e) {
          toast({ title: "Print failed", description: String(e), variant: "destructive" });
        }
      }
    } catch (e) {
      toast({ title: "Connect failed", description: String(e), variant: "destructive" });
    } finally {
      setPrintBusy(false);
    }
  }, [pendingPrintOrder, toast, toLabelPayload]);

  const patchStatus = useCallback(
    async (orderId: number, body: object) => {
      setBusy(orderId);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/status`, {
          method: "PATCH",
          headers: { ...MOBILE_JSON_HEADERS },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Request failed");
        toast({ title: "OK", description: "Updated" });
        await load();
      } catch (e) {
        toast({ title: "Error", description: String(e), variant: "destructive" });
      } finally {
        setBusy(null);
      }
    },
    [load, toast]
  );

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 py-1">
        <p className="text-[11px] text-zinc-500">Tap slip to verify · newest first within queue</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 border-zinc-600 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">No orders</p>
      ) : (
        sorted.map((o) => (
          <div
            key={o.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-zinc-100">#{o.order_number}</p>
                <p className="truncate text-sm text-zinc-300">
                  {o.customer_name?.trim() || "—"}
                </p>
                <p className="mt-0.5 text-base font-semibold text-emerald-400">
                  {formatPrice(o.total_amount)}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 border text-[10px] ${statusBadgeClass(o.status)}`}
              >
                {shortStatus(o.status)}
              </Badge>
            </div>

            {o.slip_url && !isPdfUrl(o.slip_url) && isLikelyImage(o.slip_url) ? (
              <button
                type="button"
                onClick={() => setSlipView(o.slip_url)}
                className="relative mt-2 w-full overflow-hidden rounded-lg border border-zinc-700 bg-black/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.slip_url}
                  alt="Slip"
                  className="h-40 w-full object-contain"
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 text-[9px] text-zinc-200">
                  Fullscreen
                </span>
              </button>
            ) : o.slip_url ? (
              <a
                href={o.slip_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-center text-xs font-medium text-sky-400 hover:bg-zinc-800"
              >
                Open payment slip (PDF or file) →
              </a>
            ) : null}

            {o.status === "AWAITING_VERIFICATION" ? (
              <Button
                type="button"
                className="mt-3 h-11 w-full bg-emerald-600 font-bold text-white hover:bg-emerald-500"
                disabled={busy === o.id}
                onClick={() => void patchStatus(o.id, { action: "approve" })}
              >
                {busy === o.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Confirm payment
                  </>
                )}
              </Button>
            ) : null}

            {o.status === "PAID" || o.status === "COMPLETED" ? (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
                  <Input
                    placeholder="Tracking number"
                    value={tracking[o.id] ?? o.tracking_number ?? ""}
                    onChange={(e) =>
                      setTracking((m) => ({ ...m, [o.id]: e.target.value }))
                    }
                    className="border-zinc-600 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-500"
                  />
                  <select
                    className="h-9 rounded-md border border-zinc-600 bg-zinc-950/80 px-2 text-sm text-zinc-100"
                    value={provider[o.id] ?? o.shipping_provider ?? "FLASH_EXPRESS"}
                    onChange={(e) =>
                      setProvider((m) => ({ ...m, [o.id]: e.target.value }))
                    }
                  >
                    {CARRIERS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  className="h-11 w-full bg-sky-600 font-bold text-white hover:bg-sky-500"
                  disabled={
                    busy === o.id || (tracking[o.id] ?? o.tracking_number ?? "").trim().length < 3
                  }
                  onClick={() => {
                    const tn = (tracking[o.id] ?? o.tracking_number ?? "").trim();
                    const sp = provider[o.id] ?? o.shipping_provider ?? "FLASH_EXPRESS";
                    if (tn.length < 3) return;
                    void patchStatus(o.id, {
                      action: "ship",
                      trackingNumber: tn,
                      shippingProvider: sp,
                    });
                  }}
                >
                  {busy === o.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Truck className="mr-2 h-4 w-4" />
                      Mark shipped
                    </>
                  )}
                </Button>
              </div>
            ) : null}

            {(o.status === "PAID" || o.status === "SHIPPED") && (
              <Button
                type="button"
                variant="outline"
                className="mt-2 h-10 w-full border-zinc-500 bg-zinc-800/50 text-zinc-100 hover:bg-zinc-800"
                disabled={printBusy}
                onClick={() => void runPrint(o)}
              >
                {printBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    Print label
                  </>
                )}
              </Button>
            )}
          </div>
        ))
      )}

      <Dialog open={!!slipView} onOpenChange={(open) => !open && setSlipView(null)}>
        <DialogContent className="max-h-[100dvh] w-full max-w-full border-0 bg-black/95 p-0 sm:max-w-[100vw]">
          <DialogHeader className="sr-only">
            <DialogTitle>Slip</DialogTitle>
          </DialogHeader>
          {slipView && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slipView}
              alt="Payment slip"
              className="max-h-[100dvh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="max-w-sm border-zinc-700 bg-zinc-900 text-zinc-100 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Connect to printer</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Peripage / 58mm BLE. Pick your device — pairing runs once per session.
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-zinc-500">
            {isWebBluetoothPrintingSupported()
              ? "Bluetooth available."
              : bluetoothUnsupportedUserMessage()}
          </p>
          <DialogFooter className="gap-2 sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-600"
              onClick={() => {
                setConnectOpen(false);
                setPendingPrintOrder(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-500"
              disabled={!isWebBluetoothPrintingSupported() || printBusy}
              onClick={() => void handleConnectSubmit()}
            >
              {printBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect Bluetooth"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
