"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Copy,
  Loader2,
  MessageCircle,
  MoreVertical,
  Package,
  Printer,
  RefreshCw,
  Truck,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import {
  formatAdminOrderLineSummary,
  formatAdminOrderPackingCopyLine,
} from "@/lib/admin-order-line-summary";
import { orderIsReadyToShip, orderIsPaymentReceived } from "@/lib/order-paid";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  bluetoothUnsupportedUserMessage,
  buildAndPrintLabel,
  connectPeripagePrinter,
  isPrinterConnected,
  isWebBluetoothPrintingSupported,
  type LabelPrintPayload,
} from "@/lib/peripage-printer";
import type { AdminOrder } from "@/hooks/useAdminOrders";
import type { AdminOrderLineItem } from "@/types/admin-order";

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

type StatusTab = "waiting" | "paid" | "shipped" | "completed" | "cancelled";
type DateRangeFilter = "week" | "month" | "year" | "all";

const STATUS_TABS: { id: StatusTab; label: string; labelTh: string }[] = [
  { id: "waiting", label: "Waiting", labelTh: "รอ" },
  { id: "paid", label: "Paid", labelTh: "ชำระแล้ว" },
  { id: "shipped", label: "Shipped", labelTh: "ส่งแล้ว" },
  { id: "completed", label: "Completed", labelTh: "เสร็จ" },
  { id: "cancelled", label: "Cancelled", labelTh: "ยกเลิก" },
];

function formatOrderDateBangkok(iso: string): string {
  const d = new Date(iso);
  const dateStr = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "2-digit",
    calendar: "buddhist",
  }).format(d);
  const timeStr = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${dateStr} - ${timeStr}`;
}

function sortWaitingQueue(orders: AdminOrder[]): AdminOrder[] {
  const rank = (o: AdminOrder) => {
    if (o.status === "AWAITING_VERIFICATION") return 0;
    return 1;
  };
  return [...orders].sort((a, b) => {
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function sortOrdersForTab(orders: AdminOrder[], tab: StatusTab): AdminOrder[] {
  if (tab === "waiting") return sortWaitingQueue(orders);
  return [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function statusBadgeClass(status: string, paymentStatus?: string): string {
  const ps = (paymentStatus ?? "").toLowerCase();
  if (ps === "paid" && (status === "PENDING" || status === "PROCESSING")) {
    return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  }
  switch (status) {
    case "AWAITING_VERIFICATION":
      return "bg-amber-500/20 text-amber-200 border-amber-500/40";
    case "PENDING":
    case "PENDING_INFO":
      return "bg-zinc-500/25 text-zinc-200 border-zinc-500/40";
    case "PAID": // legacy
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

function shortStatus(status: string, paymentStatus?: string): string {
  const ps = (paymentStatus ?? "").toLowerCase();
  if (ps === "paid" && (status === "PENDING" || status === "PROCESSING"))
    return "ชำระแล้ว / Pack";
  if (status === "AWAITING_VERIFICATION") return "รอตรวจ / Verify";
  return status;
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

function isLikelyImage(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url) || /\/object\//.test(url);
}

const LINE_SYNTHETIC_EMAIL_DOMAIN = "line.smileseedbank.local";

function loginInsightKind(o: AdminOrder): "guest" | "line" | "google" {
  if (!o.customer_id) return "guest";
  const em = (o.customer_email ?? "").toLowerCase();
  if (em.endsWith(`@${LINE_SYNTHETIC_EMAIL_DOMAIN}`) || em.startsWith("line_")) return "line";
  return "google";
}

function buildShippingLabelText(o: AdminOrder): string {
  const name = o.customer_name?.trim() || "—";
  const phone = o.customer_phone?.trim() || "—";
  const addr = o.shipping_address?.trim() || "—";
  return `${name}\n${phone}\n${addr}`;
}

/** Compact lines for Nimbot / thermal paste (order #, qty lines, total). */
function buildNimbotSummaryText(o: AdminOrder): string {
  const itemsBlock =
    (o.line_items?.length ?? 0) === 0
      ? "—"
      : (o.line_items ?? [])
          .map((li) => `${(li.product_name ?? "").trim()} x${li.quantity}`)
          .join("\n");
  return [`Order: ${o.order_number}`, itemsBlock, `Total: ${formatPrice(o.total_amount)}`].join(
    "\n"
  );
}

function packingListProductLines(o: AdminOrder): string[] {
  if ((o.line_items?.length ?? 0) === 0) return ["(no items)"];
  return (o.line_items ?? []).map((li) =>
    formatAdminOrderPackingCopyLine(li as AdminOrderLineItem)
  );
}

/** English-style packing list (copy for warehouse). */
function buildOrderSummaryText(o: AdminOrder): string {
  const note = (o.customer_note ?? "").trim();
  return [
    `Order: #${o.order_number}`,
    "------------------",
    ...packingListProductLines(o),
    "------------------",
    `Note: ${note || "—"}`,
  ].join("\n");
}

/** Thai header + address + order lines for courier / packing. */
function buildAddressAndPackingListText(o: AdminOrder): string {
  const name = o.customer_name?.trim() || "—";
  const phone = o.customer_phone?.trim() || "—";
  const addr = o.shipping_address?.trim() || "—";
  const note = (o.customer_note ?? "").trim();
  const lines =
    (o.line_items?.length ?? 0) === 0
      ? ["(no items)"]
      : (o.line_items ?? []).map((li) =>
          formatAdminOrderPackingCopyLine(li as AdminOrderLineItem)
        );
  return [
    `คุณ ${name} (${phone})`,
    addr,
    "------------------",
    `Order: #${o.order_number}`,
    "รายการ:",
    ...lines,
    "------------------",
    `Note: ${note || "—"}`,
  ].join("\n");
}

type AlertKind = "cancel" | "reject" | "revert";

export default function AdminMobileOrdersPage() {
  const { toast } = useToast();
  const [statusTab, setStatusTab] = useState<StatusTab>("waiting");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("month");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [slipView, setSlipView] = useState<string | null>(null);
  const [tracking, setTracking] = useState<Record<number, string>>({});
  const [provider, setProvider] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [printBusy, setPrintBusy] = useState(false);
  const [pendingPrintOrder, setPendingPrintOrder] = useState<AdminOrder | null>(null);
  const [alertDialog, setAlertDialog] = useState<
    { kind: AlertKind; order: AdminOrder } | null
  >(null);
  const [voidOrder, setVoidOrder] = useState<AdminOrder | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [paidQueueCount, setPaidQueueCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("statusTab", statusTab);
      params.set("dateRange", dateRange);
      params.set("includePaidCount", "1");
      const res = await fetch(`/api/admin/orders?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json()) as {
        orders?: AdminOrder[];
        paidQueueCount?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      const list = data.orders ?? [];
      setPaidQueueCount(typeof data.paidQueueCount === "number" ? data.paidQueueCount : 0);
      setOrders(
        list.map((o) => ({
          ...o,
          customer_note: (o as { customer_note?: string | null }).customer_note ?? null,
          payment_status: (o as { payment_status?: string }).payment_status ?? "unpaid",
          line_items: o.line_items ?? [],
          discount_amount: Number(o.discount_amount ?? 0),
          points_discount_amount: Number(o.points_discount_amount ?? 0),
          promotion_discount_amount: Number(o.promotion_discount_amount ?? 0),
        }))
      );
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [toast, statusTab, dateRange]);

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

  const sorted = useMemo(
    () => sortOrdersForTab(orders, statusTab),
    [orders, statusTab]
  );

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

  const copyOrderText = useCallback(
    async (text: string, description: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!", description });
      } catch (e) {
        toast({
          title: "Copy failed",
          description: String(e),
          variant: "destructive",
        });
      }
    },
    [toast]
  );

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

  const patchCancel = useCallback(
    async (orderId: number, note?: string) => {
      setBusy(orderId);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
          method: "PATCH",
          headers: { ...MOBILE_JSON_HEADERS },
          body: JSON.stringify({ note: note ?? "" }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Cancel failed");
        toast({ title: "Cancelled", description: "Order cancelled" });
        await load();
      } catch (e) {
        toast({ title: "Error", description: String(e), variant: "destructive" });
      } finally {
        setBusy(null);
      }
    },
    [load, toast]
  );

  const patchVoid = useCallback(
    async (orderId: number, reason: string) => {
      setBusy(orderId);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/void`, {
          method: "PATCH",
          headers: { ...MOBILE_JSON_HEADERS },
          body: JSON.stringify({ void_reason: reason.trim() || undefined }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Void failed");
        toast({ title: "Voided", description: "Stock restored" });
        setVoidOrder(null);
        setVoidReason("");
        await load();
      } catch (e) {
        toast({ title: "Error", description: String(e), variant: "destructive" });
      } finally {
        setBusy(null);
      }
    },
    [load, toast]
  );

  const patchRevert = useCallback(
    async (orderId: number) => {
      setBusy(orderId);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/revert-approval`, {
          method: "PATCH",
          headers: { ...MOBILE_JSON_HEADERS },
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Revert failed");
        toast({ title: "Reverted", description: "Back to pending / verify" });
        await load();
      } catch (e) {
        toast({ title: "Error", description: String(e), variant: "destructive" });
      } finally {
        setBusy(null);
      }
    },
    [load, toast]
  );

  const runAlertConfirm = useCallback(async () => {
    if (!alertDialog) return;
    const { kind, order } = alertDialog;
    setAlertDialog(null);
    if (kind === "cancel") {
      await patchCancel(order.id);
      return;
    }
    if (kind === "reject") {
      await patchStatus(order.id, {
        action: "reject",
        note: "Rejected from mobile admin",
      });
      return;
    }
    if (kind === "revert") {
      await patchRevert(order.id);
    }
  }, [alertDialog, patchCancel, patchRevert, patchStatus]);

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-30 -mx-2 space-y-2 bg-zinc-950/95 px-2 pb-2 pt-1 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STATUS_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setStatusTab(t.id)}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusTab === t.id
                    ? "border-emerald-500/70 bg-emerald-950/50 text-emerald-100"
                    : "border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                {t.id === "paid" ? t.labelTh : t.label}
                {t.id === "paid" && paidQueueCount > 0 ? (
                  <span className="min-w-[1.125rem] rounded-full bg-emerald-500/90 px-1 text-center text-[10px] font-bold text-zinc-950">
                    {paidQueueCount > 99 ? "99+" : paidQueueCount}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 shrink-0 border-zinc-600 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
          <Select
            value={dateRange}
            onValueChange={(v) => setDateRange(v as DateRangeFilter)}
          >
            <SelectTrigger className="h-9 max-w-[200px] border-zinc-600 bg-zinc-900 text-xs text-zinc-100">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
              <SelectItem value="week" className="focus:bg-zinc-800 focus:text-zinc-100">
                This week (7 days)
              </SelectItem>
              <SelectItem value="month" className="focus:bg-zinc-800 focus:text-zinc-100">
                This month (30 days)
              </SelectItem>
              <SelectItem value="year" className="focus:bg-zinc-800 focus:text-zinc-100">
                This year
              </SelectItem>
              <SelectItem value="all" className="focus:bg-zinc-800 focus:text-zinc-100">
                All time
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {statusTab === "waiting" ? (
          <p className="text-[10px] leading-snug text-zinc-500">
            Tap slip to verify · queue order: verify first
          </p>
        ) : null}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 py-14 text-center">
          <Package className="h-12 w-12 text-zinc-600 opacity-50" aria-hidden />
          <p className="text-sm font-medium text-zinc-400">ไม่มีออเดอร์ในแท็บนี้</p>
          <p className="max-w-[260px] text-xs text-zinc-500">
            No orders for this status and date range — try All time or another tab.
          </p>
        </div>
      ) : (
        sorted.map((o) => (
          <div
            key={o.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold text-zinc-100">#{o.order_number}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {formatOrderDateBangkok(o.created_at)}
                  <span className="text-zinc-600"> · </span>
                  <span className="font-mono text-zinc-400">ID {o.id}</span>
                </p>
                <p className="truncate text-sm text-zinc-300">
                  {o.customer_name?.trim() || "—"}
                </p>
                {o.customer_phone?.trim() ? (
                  <a
                    href={`tel:${o.customer_phone.replace(/[\s-]/g, "")}`}
                    className="mt-0.5 inline-block text-sm font-medium text-sky-400 underline-offset-2 hover:text-sky-300 hover:underline"
                  >
                    {o.customer_phone.trim()}
                  </a>
                ) : (
                  <p className="mt-0.5 text-[11px] text-zinc-600">No phone on order</p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {loginInsightKind(o) === "guest" ? (
                    <Badge
                      variant="outline"
                      className="border-zinc-600 bg-zinc-800/60 text-[9px] text-zinc-300"
                    >
                      <User className="mr-0.5 h-2.5 w-2.5" />
                      Guest
                    </Badge>
                  ) : loginInsightKind(o) === "line" ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-700/50 bg-emerald-950/40 text-[9px] text-emerald-200"
                    >
                      LINE login
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-sky-700/50 bg-sky-950/40 text-[9px] text-sky-200"
                    >
                      Google / Web
                    </Badge>
                  )}
                  {o.line_user_id?.trim() ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-600/40 bg-emerald-900/20 text-[9px] text-emerald-300"
                    >
                      <MessageCircle className="mr-0.5 h-2.5 w-2.5" />
                      LINE linked
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-zinc-600 bg-zinc-800/40 text-[9px] text-zinc-500"
                    >
                      No LINE
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-base font-semibold text-emerald-400">
                  {formatPrice(o.total_amount)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge
                  variant="outline"
                  className={`border text-[10px] ${statusBadgeClass(o.status, o.payment_status)}`}
                >
                  {shortStatus(o.status, o.payment_status)}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                      disabled={busy === o.id}
                      aria-label="More actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-52 border-zinc-700 bg-zinc-900 text-zinc-100"
                  >
                    {(o.status === "PENDING" || o.status === "PENDING_INFO") &&
                      (o.payment_status ?? "").toLowerCase() !== "paid" && (
                      <DropdownMenuItem
                        className="focus:bg-zinc-800 focus:text-zinc-100"
                        onSelect={() => setAlertDialog({ kind: "cancel", order: o })}
                      >
                        Cancel order…
                      </DropdownMenuItem>
                    )}
                    {o.status === "AWAITING_VERIFICATION" && (
                      <DropdownMenuItem
                        className="focus:bg-zinc-800 focus:text-zinc-100"
                        onSelect={() => setAlertDialog({ kind: "reject", order: o })}
                      >
                        Reject slip / cancel…
                      </DropdownMenuItem>
                    )}
                    {orderIsReadyToShip(o.status, o.payment_status) && (
                      <DropdownMenuItem
                        className="focus:bg-zinc-800 focus:text-zinc-100"
                        onSelect={() => setAlertDialog({ kind: "revert", order: o })}
                      >
                        Reset to pending…
                      </DropdownMenuItem>
                    )}
                    {(orderIsReadyToShip(o.status, o.payment_status) || o.status === "COMPLETED") && (
                      <DropdownMenuItem
                        className="focus:bg-zinc-800 focus:text-amber-200"
                        onSelect={() => {
                          setVoidReason("");
                          setVoidOrder(o);
                        }}
                      >
                        Void order (restock)…
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {(o.line_items?.length ?? 0) > 0 ? (
              <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-950/40">
                <p className="border-b border-zinc-800/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Items summary
                </p>
                <div className="divide-y divide-zinc-800/80 px-2 py-1">
                  {(o.line_items ?? []).map((li, idx) => {
                    const effectiveForPack =
                      li.unit_label?.trim() || li.variant_unit_label?.trim() || "";
                    const showSeedCount = effectiveForPack.length > 0;
                    return (
                      <div key={idx} className="py-1.5 font-sans first:pt-1 last:pb-1">
                        <p className="font-sans text-[11px] leading-snug text-zinc-200">
                          {formatAdminOrderLineSummary(li)}
                        </p>
                        <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-zinc-400">
                          <span>
                            {li.quantity} × {formatPrice(li.unit_price)}
                            {!showSeedCount && li.unit_label ? (
                              <span className="text-zinc-600"> · {li.unit_label}</span>
                            ) : null}
                          </span>
                          {li.subtotal != null ? (
                            <span className="shrink-0 font-mono text-zinc-300">
                              {formatPrice(li.subtotal)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(o.discount_amount > 0 ||
                  o.promotion_discount_amount > 0 ||
                  o.points_discount_amount > 0) && (
                  <div className="space-y-0.5 border-t border-zinc-800/80 px-2 py-1.5 text-[10px] text-amber-200/90">
                    {o.discount_amount > 0 && (
                      <div>Coupon / order discount: −{formatPrice(o.discount_amount)}</div>
                    )}
                    {o.promotion_discount_amount > 0 && (
                      <div>Promotion: −{formatPrice(o.promotion_discount_amount)}</div>
                    )}
                    {o.points_discount_amount > 0 && (
                      <div>Points: −{formatPrice(o.points_discount_amount)}</div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

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

            {orderIsReadyToShip(o.status, o.payment_status) ? (
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

            {(orderIsPaymentReceived(o.status, o.payment_status) ||
              o.status === "SHIPPED" ||
              o.status === "COMPLETED") && (
              <div className="mt-2 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full border-zinc-500 bg-zinc-800/50 text-zinc-100 hover:bg-zinc-800"
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
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-[44px] h-auto gap-2 rounded-lg px-3 py-2.5 text-sm font-medium"
                    onClick={() =>
                      void copyOrderText(buildShippingLabelText(o), "Address ready for label")
                    }
                  >
                    <Copy className="h-4 w-4 shrink-0" aria-hidden />
                    Copy Address
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-[44px] h-auto gap-2 rounded-lg border border-zinc-600/80 bg-zinc-900/40 px-3 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800/80 hover:text-white"
                    onClick={() =>
                      void copyOrderText(buildNimbotSummaryText(o), "Order summary (compact)")
                    }
                  >
                    <Copy className="h-4 w-4 shrink-0" aria-hidden />
                    Copy Summary
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="col-span-2 min-h-[44px] gap-2 rounded-lg border-emerald-700/45 bg-emerald-950/20 py-2.5 text-emerald-100 hover:bg-emerald-950/40"
                    onClick={() =>
                      void copyOrderText(
                        buildAddressAndPackingListText(o),
                        "Full TH address + packing list"
                      )
                    }
                  >
                    <Copy className="h-4 w-4 shrink-0" aria-hidden />
                    Copy address + packing (TH)
                  </Button>
                </div>
              </div>
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

      <AlertDialog
        open={!!alertDialog}
        onOpenChange={(open) => !open && setAlertDialog(null)}
      >
        <AlertDialogContent className="border-zinc-700 bg-zinc-900 text-zinc-100 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertDialog?.kind === "cancel" && "Cancel this order?"}
              {alertDialog?.kind === "reject" && "Reject slip / cancel verification?"}
              {alertDialog?.kind === "revert" && "Reset to pending?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {alertDialog?.kind === "cancel" &&
                "For PENDING / PENDING_INFO only. Stock will be restored."}
              {alertDialog?.kind === "reject" &&
                "Rejects this awaiting-verification order and restores stock."}
              {alertDialog?.kind === "revert" &&
                "Undoes mistaken approval: PAID → AWAITING_VERIFICATION (if slip) or PENDING. Clears tracking."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
              Back
            </AlertDialogCancel>
            <Button
              type="button"
              className="bg-amber-600 text-white hover:bg-amber-500"
              onClick={() => void runAlertConfirm()}
            >
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!voidOrder}
        onOpenChange={(open) => {
          if (!open) {
            setVoidOrder(null);
            setVoidReason("");
          }
        }}
      >
        <DialogContent className="border-zinc-700 bg-zinc-900 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Void order</DialogTitle>
            <DialogDescription className="text-zinc-400">
              PAID or COMPLETED only. Restores stock to variants. Optional reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            placeholder="Reason (optional)"
            className="min-h-[72px] border-zinc-600 bg-zinc-950 text-sm text-zinc-100"
          />
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-600 bg-zinc-800 text-zinc-200"
              onClick={() => {
                setVoidOrder(null);
                setVoidReason("");
              }}
            >
              Back
            </Button>
            <Button
              type="button"
              className="bg-red-700 text-white hover:bg-red-600"
              disabled={!voidOrder || busy === voidOrder.id}
              onClick={() => voidOrder && void patchVoid(voidOrder.id, voidReason)}
            >
              {busy === voidOrder?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Void & restock"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
