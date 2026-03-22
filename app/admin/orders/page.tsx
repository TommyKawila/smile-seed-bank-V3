"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Loader2, CheckCircle2, XCircle,
  ImageIcon, User, RefreshCw, FileText, Clock, BadgeCheck,
  Truck, Package, Plus, Printer, RotateCcw, Receipt,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminOrders, type AdminOrder } from "@/hooks/useAdminOrders";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { openPackingSlipPrint } from "@/components/admin/PackingSlipPrint";
import { generateReceiptPDF, formatPaymentMethodForPdf, isReceiptEligibleStatus } from "@/lib/receipt-pdf";
import { fetchPdfSettings } from "@/lib/pdf-settings";
import { ReceiptPreviewModal } from "@/components/admin/ReceiptPreviewModal";

// ─── Shipping providers ────────────────────────────────────────────────────────
const SHIPPING_PROVIDERS = [
  { value: "THAILAND_POST", label: "ไปรษณีย์ไทย" },
  { value: "KERRY_EXPRESS", label: "Kerry" },
  { value: "FLASH_EXPRESS", label: "Flash" },
  { value: "J&T_EXPRESS",   label: "J&T" },
];

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: "", label: "ทั้งหมด" },
  { value: "AWAITING_VERIFICATION", label: "รอตรวจสอบ" },
  { value: "PENDING", label: "รอดำเนินการ" },
  { value: "PAID", label: "ชำระแล้ว" },
  { value: "COMPLETED", label: "เสร็จสิ้น" },
  { value: "SHIPPED", label: "จัดส่งแล้ว" },
  { value: "CANCELLED", label: "ยกเลิก" },
  { value: "VOIDED", label: "ยกเลิก/คืน" },
];

const PAYMENT_LABELS: Record<string, string> = {
  TRANSFER: "โอนเงิน",
  COD: "COD",
  CREDIT_CARD: "บัตรเครดิต",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statusStyle(status: string): string {
  switch (status) {
    case "AWAITING_VERIFICATION": return "bg-amber-100 text-amber-800 border-amber-200";
    case "PAID":
    case "COMPLETED":             return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "SHIPPED":
    case "DELIVERED":             return "bg-blue-100 text-blue-800 border-blue-200";
    case "CANCELLED":             return "bg-red-100 text-red-800 border-red-200";
    case "VOIDED":                return "bg-zinc-200 text-zinc-600 border-zinc-300";
    default:                      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

function statusLabel(status: string): string {
  return (
    { AWAITING_VERIFICATION: "รอตรวจสอบ", PENDING: "รอดำเนินการ",
      PAID: "ชำระแล้ว", COMPLETED: "เสร็จสิ้น", SHIPPED: "จัดส่งแล้ว", DELIVERED: "ส่งถึงแล้ว",
      CANCELLED: "ยกเลิก", VOIDED: "ยกเลิก/คืน" }[status] ?? status
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อกี้";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม. ที่แล้ว`;
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" })
    .format(new Date(iso));
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; msg: string; type: "success" | "error" }
let _toastId = 0;

function ToastStack({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onDismiss(t.id)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
            t.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          )}
        >
          {t.type === "success"
            ? <BadgeCheck className="h-4 w-4 shrink-0" />
            : <XCircle className="h-4 w-4 shrink-0" />}
          {t.msg}
        </button>
      ))}
    </div>
  );
}

// ─── Slip Thumbnail ───────────────────────────────────────────────────────────

function SlipThumb({ url, onClick }: { url: string; onClick: () => void }) {
  const isPdf = url.toLowerCase().includes(".pdf");
  return (
    <button
      type="button"
      onClick={onClick}
      title="ดูสลิป"
      className="mt-3 flex w-full items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-100 active:scale-[.98] transition-all"
    >
      {isPdf ? (
        <FileText className="h-9 w-9 shrink-0 text-emerald-600" />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={url} alt="Slip" className="h-9 w-9 shrink-0 rounded-lg object-cover border border-emerald-100" />
      )}
      <span className="font-medium">{isPdf ? "ดูไฟล์ PDF" : "ดูสลิปโอนเงิน"}</span>
      <ImageIcon className="ml-auto h-4 w-4 opacity-60" />
    </button>
  );
}

// ─── Order Card (Mobile) ───────────────────────────────────────────────────────

function OrderCard({
  order, onApprove, onReject, onShip, onVoid, onSlipClick, onDetailClick, onReceiptPdf, isUpdating,
}: {
  order: AdminOrder;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onShip: (id: number) => void;
  onVoid: (id: number) => void;
  onSlipClick: (url: string) => void;
  onDetailClick: (id: number) => void;
  onReceiptPdf: (id: number) => void;
  isUpdating: number | null;
}) {
  const canAct = order.status === "AWAITING_VERIFICATION";
  const canShip = order.status === "PAID" || order.status === "COMPLETED";
  const canVoid = order.status === "COMPLETED";
  const canReceipt = isReceiptEligibleStatus(order.status);
  const busy = isUpdating === order.id;
  const pmLabel = PAYMENT_LABELS[order.payment_method ?? ""] ?? order.payment_method ?? "—";

  return (
    <Card className="overflow-hidden border-zinc-200 shadow-sm">
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onDetailClick(order.id)}
              className="font-mono text-base font-bold tracking-wide text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              #{order.order_number}
            </button>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(order.created_at)}
            </div>
          </div>
          <Badge className={cn("shrink-0 text-xs", statusStyle(order.status))}>
            {statusLabel(order.status)}
          </Badge>
        </div>

        {/* Customer + Amount row */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onDetailClick(order.id)}
            className="flex min-w-0 items-center gap-1.5 text-left hover:opacity-80"
          >
            <User className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="truncate text-sm text-zinc-700">
              {order.customer_name ?? "ไม่ระบุ"}
            </span>
          </button>
          <span className="shrink-0 text-base font-bold text-emerald-700">
            {formatPrice(Number(order.total_amount))}
          </span>
        </div>

        {/* Payment method badge */}
        <div className="mt-2">
          <span className={cn(
            "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
            order.payment_method === "TRANSFER"
              ? "bg-blue-50 text-blue-700"
              : "bg-zinc-100 text-zinc-600"
          )}>
            {pmLabel}
          </span>
        </div>

        {/* Reject note */}
        {order.status === "CANCELLED" && order.reject_note && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            เหตุผล: {order.reject_note}
          </p>
        )}

        {/* Slip preview */}
        {order.slip_url && <SlipThumb url={order.slip_url} onClick={() => onSlipClick(order.slip_url!)} />}

        {/* Tracking info for shipped orders */}
        {order.status === "SHIPPED" && order.tracking_number && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            <Truck className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">{order.shipping_provider?.replace("_", " ")} · {order.tracking_number}</span>
          </div>
        )}

        {/* Action buttons */}
        {canAct && (
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[.97]"
              onClick={() => onApprove(order.id)}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><CheckCircle2 className="mr-1.5 h-4 w-4" /> อนุมัติ</>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 active:scale-[.97]"
              onClick={() => onReject(order.id)}
              disabled={busy}
            >
              <XCircle className="mr-1.5 h-4 w-4" /> ปฏิเสธ
            </Button>
          </div>
        )}
        {canReceipt && (
          <div className="mt-3">
            <Button
              size="sm"
              className="w-full bg-[#003366] hover:bg-[#00264d] text-white active:scale-[.97]"
              onClick={() => onReceiptPdf(order.id)}
            >
              <Receipt className="mr-1.5 h-4 w-4" /> ออกใบเสร็จ
            </Button>
          </div>
        )}
        {canShip && (
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[.97]"
              onClick={() => onShip(order.id)}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><Truck className="mr-1.5 h-4 w-4" /> ยืนยันการจัดส่ง</>
              )}
            </Button>
            {canVoid && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => onVoid(order.id)}
                disabled={busy}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Order Table Row (Desktop) ─────────────────────────────────────────────────

function OrderTableRow({
  order, onApprove, onReject, onShip, onVoid, onSlipClick, onDetailClick, onReceiptPdf, isUpdating,
}: {
  order: AdminOrder;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onShip: (id: number) => void;
  onVoid: (id: number) => void;
  onSlipClick: (url: string) => void;
  onDetailClick: (id: number) => void;
  onReceiptPdf: (id: number) => void;
  isUpdating: number | null;
}) {
  const canAct = order.status === "AWAITING_VERIFICATION";
  const canShip = order.status === "PAID" || order.status === "COMPLETED";
  const canVoid = order.status === "COMPLETED";
  const canReceipt = isReceiptEligibleStatus(order.status);
  const busy = isUpdating === order.id;
  const isPdf = order.slip_url?.toLowerCase().includes(".pdf");
  const pmLabel = PAYMENT_LABELS[order.payment_method ?? ""] ?? order.payment_method ?? "—";

  return (
    <tr className="border-b border-zinc-100 text-sm hover:bg-zinc-50/60">
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onDetailClick(order.id)}
          className="font-mono font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          #{order.order_number}
        </button>
        <p className="mt-0.5 text-xs text-zinc-400">{formatRelativeTime(order.created_at)}</p>
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onDetailClick(order.id)}
          className="flex items-center gap-1.5 text-left hover:opacity-80"
        >
          <User className="h-4 w-4 text-emerald-600" />
          <span className="text-zinc-700">{order.customer_name ?? "—"}</span>
        </button>
      </td>
      <td className="px-4 py-3 font-bold text-emerald-700">
        {formatPrice(Number(order.total_amount))}
      </td>
      <td className="px-4 py-3">
        <span className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-medium",
          order.payment_method === "TRANSFER" ? "bg-blue-50 text-blue-700" : "bg-zinc-100 text-zinc-600"
        )}>
          {pmLabel}
        </span>
      </td>
      <td className="px-4 py-3">
        <Badge className={cn("text-xs", statusStyle(order.status))}>
          {statusLabel(order.status)}
        </Badge>
      </td>
      <td className="px-4 py-3">
        {order.slip_url ? (
          <button
            type="button"
            onClick={() => onSlipClick(order.slip_url!)}
            className="group relative overflow-hidden rounded-lg border border-emerald-200 p-0.5 transition hover:border-emerald-400"
          >
            {isPdf ? (
              <FileText className="h-11 w-11 text-emerald-500 p-2" />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={order.slip_url} alt="Slip" className="h-11 w-11 rounded-md object-cover" />
            )}
          </button>
        ) : (
          <span className="text-zinc-300">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {canAct ? (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onApprove(order.id)}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "อนุมัติ"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => onReject(order.id)}
              disabled={busy}
            >
              ปฏิเสธ
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {canReceipt && (
                <Button
                  size="sm"
                  className="bg-[#003366] hover:bg-[#00264d] text-white"
                  onClick={() => onReceiptPdf(order.id)}
                >
                  <Receipt className="mr-1 h-3.5 w-3.5" />
                  ออกใบเสร็จ
                </Button>
              )}
              {canShip && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => onShip(order.id)}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Truck className="mr-1 h-3.5 w-3.5" />จัดส่ง</>}
                </Button>
              )}
              {canVoid && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onVoid(order.id)}
                  disabled={busy}
                >
                  <RotateCcw className="h-3.5 w-3.5" title="ยกเลิก/คืนสต็อก" />
                </Button>
              )}
            </div>
            {order.status === "SHIPPED" && order.tracking_number && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Package className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[140px] truncate">{order.tracking_number}</span>
              </div>
            )}
            {order.status === "CANCELLED" && order.reject_note && (
              <span className="text-xs text-zinc-400 max-w-[160px] truncate block" title={order.reject_note}>
                {order.reject_note}
              </span>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type OrderDetail = {
  id: number;
  orderNumber: string;
  sourceQuotationNumber?: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  customerNote: string | null;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  status: string;
  voidReason?: string | null;
  trackingNumber: string | null;
  shippingProvider: string | null;
  paymentMethod: string | null;
  createdAt: string;
  items: { productName: string; unitLabel: string; breederName: string | null; quantity: number; unitPrice: number; totalPrice: number }[];
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const openedOrderFromQuery = useRef(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [slipModalUrl, setSlipModalUrl] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ orderId: number } | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [shipModal, setShipModal] = useState<{ orderId: number } | null>(null);
  const [voidModal, setVoidModal] = useState<{ orderId: number } | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [shipTracking, setShipTracking] = useState("");
  const [shipProvider, setShipProvider] = useState(SHIPPING_PROVIDERS[1].value);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [receiptPreviewOrderId, setReceiptPreviewOrderId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [storeSettings, setStoreSettings] = useState<{ storeName: string; contactEmail: string | null; supportPhone: string | null; address: string | null } | null>(null);

  const { orders, isLoading, error, refetch } = useAdminOrders(statusFilter || undefined);

  const loadStoreSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/store-settings");
      const data = await res.json();
      setStoreSettings(data);
    } catch {
      setStoreSettings({ storeName: "Smile Seed Bank", contactEmail: null, supportPhone: null, address: null });
    }
  }, []);

  const pushToast = useCallback((msg: string, type: "success" | "error") => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const callStatus = useCallback(
    async (orderId: number, body: object, successMsg: string, isError = false) => {
      setUpdatingId(orderId);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
        if (data.quotationStatusSynced === true) {
          pushToast(
            "สถานะใบเสนอราคาถูกอัปเดตอัตโนมัติเนื่องจากมีการส่งสินค้าแล้ว",
            "success"
          );
        }
        pushToast(successMsg, isError ? "error" : "success");
        await refetch();
      } catch (err) {
        pushToast(String(err), "error");
      } finally {
        setUpdatingId(null);
      }
    },
    [pushToast, refetch]
  );

  const handleApprove = (orderId: number) =>
    void callStatus(orderId, { action: "approve" }, "อนุมัติการชำระเงินสำเร็จ ✓");

  const handleRejectOpen = (orderId: number) => {
    setRejectModal({ orderId });
    setRejectNote("");
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    await callStatus(
      rejectModal.orderId,
      { action: "reject", note: rejectNote || "ไม่ระบุเหตุผล" },
      "ปฏิเสธออเดอร์แล้ว",
      true
    );
    setRejectModal(null);
  };

  const handleShipOpen = (orderId: number) => {
    setShipModal({ orderId });
    setShipTracking("");
    setShipProvider(SHIPPING_PROVIDERS[1].value);
  };

  const handleShipSubmit = async () => {
    if (!shipModal || !shipTracking.trim()) return;
    await callStatus(
      shipModal.orderId,
      { action: "ship", trackingNumber: shipTracking.trim(), shippingProvider: shipProvider },
      "บันทึกการจัดส่งสำเร็จ ✓"
    );
    setShipModal(null);
  };

  const handleVoidOpen = (orderId: number) => {
    setVoidModal({ orderId });
    setVoidReason("");
  };

  const handleVoidSubmit = async () => {
    if (!voidModal) return;
    setUpdatingId(voidModal.orderId);
    try {
      const res = await fetch(`/api/admin/orders/${voidModal.orderId}/void`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ void_reason: voidReason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      pushToast("ยกเลิกออเดอร์และคืนสต็อกแล้ว ✓", "success");
      setVoidModal(null);
      await refetch();
    } catch (err) {
      pushToast(String(err), "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const buildOrderReceiptDoc = useCallback(async (detail: OrderDetail) => {
    const pdfSettings = await fetchPdfSettings();
    const orderDate = detail.createdAt ? new Date(detail.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const items = detail.items.map((i) => ({
      productName: i.productName,
      breeder: i.breederName,
      unitLabel: i.unitLabel ?? "—",
      quantity: i.quantity,
      price: i.unitPrice,
      discount: 0,
      subtotal: i.totalPrice,
    }));
    return generateReceiptPDF({
      docType: "receipt",
      orderNumber: detail.orderNumber,
      orderDate,
      customerName: detail.customerName ?? "",
      customerEmail: detail.customerEmail ?? null,
      customerPhone: detail.customerPhone ?? null,
      customerNote: detail.customerNote ?? null,
      items,
      grandTotal: detail.totalAmount,
      logoDataUrl: pdfSettings.logoDataUrl,
      companyName: pdfSettings.companyName,
      companyAddress: pdfSettings.companyAddress,
      companyEmail: pdfSettings.companyEmail,
      companyPhone: pdfSettings.companyPhone,
      companyLineId: pdfSettings.companyLineId,
      bankName: pdfSettings.bankName,
      bankAccountName: pdfSettings.bankAccountName,
      bankAccountNo: pdfSettings.bankAccountNo,
      socialLinks: pdfSettings.socialLinks ?? [],
      orderFinancials: {
        shippingFee: detail.shippingFee ?? 0,
        discountAmount: detail.discountAmount ?? 0,
      },
      paymentDate: orderDate,
      paymentMethod: formatPaymentMethodForPdf(detail.paymentMethod),
    });
  }, []);

  const buildReceiptFromPayload = useCallback(
    (d: unknown) => buildOrderReceiptDoc(d as OrderDetail),
    [buildOrderReceiptDoc]
  );

  const openReceiptPreview = useCallback((orderId: number) => {
    setReceiptPreviewOrderId(orderId);
  }, []);

  const handleDetailClick = useCallback(async (orderId: number) => {
    setDetailLoading(true);
    setDetailModal(null);
    try {
      const [orderRes, storeRes] = await Promise.all([
        fetch(`/api/admin/orders/${orderId}`),
        fetch("/api/admin/store-settings"),
      ]);
      const data = await orderRes.json();
      if (!orderRes.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setDetailModal(data);
      const storeData = await storeRes.json();
      setStoreSettings(storeData);
    } catch (err) {
      pushToast(String(err), "error");
    } finally {
      setDetailLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (openedOrderFromQuery.current) return;
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("openOrder");
    if (!raw) return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    openedOrderFromQuery.current = true;
    void handleDetailClick(n);
    router.replace("/admin/orders", { scroll: false });
  }, [router, handleDetailClick]);

  const handlePrintPackingSlip = useCallback(() => {
    if (!detailModal) return;
    const store = storeSettings ?? { storeName: "Smile Seed Bank", contactEmail: null, supportPhone: null, address: null };
    openPackingSlipPrint(detailModal, store);
  }, [detailModal, storeSettings]);

  const handleReceiptPDF = useCallback(() => {
    if (!detailModal?.id) return;
    if (!isReceiptEligibleStatus(detailModal.status)) {
      pushToast("ไม่สามารถออกใบเสร็จสำหรับสถานะนี้", "error");
      return;
    }
    openReceiptPreview(detailModal.id);
  }, [detailModal, openReceiptPreview, pushToast]);

  // Tab counts (from current full list — best-effort)
  const countByStatus = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const totalRevenue = orders
    .filter((o) => ["PAID", "SHIPPED", "COMPLETED"].includes(o.status))
    .reduce((s, o) => s + Number(o.total_amount), 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-emerald-700" />
          <h1 className="text-xl font-bold text-zinc-900">ออเดอร์</h1>
          {!isLoading && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {orders.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/quotations/new"
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Convert Quote to Order</span>
          </Link>
          <Link
            href="/admin/orders/create"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">สร้างออเดอร์</span>
          </Link>
          <button
          type="button"
          onClick={() => void refetch()}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          <span className="hidden sm:inline">รีเฟรช</span>
        </button>
        </div>
      </div>

      {!isLoading && orders.length > 0 && (
        <p className="text-sm text-zinc-500">
          รายได้รวม (ชำระแล้ว/จัดส่งแล้ว/เสร็จสิ้น): <span className="font-semibold text-emerald-700">{formatPrice(totalRevenue)}</span>
        </p>
      )}

      {/* Filter Tabs — horizontally scrollable on mobile */}
      <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:rounded-lg sm:bg-zinc-100 sm:p-1">
        {STATUS_TABS.map((t) => {
          const count = t.value ? (countByStatus[t.value] ?? 0) : orders.length;
          const active = statusFilter === t.value;
          return (
            <button
              key={t.value || "all"}
              type="button"
              onClick={() => setStatusFilter(t.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:rounded-md sm:py-1.5",
                active
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 sm:bg-transparent"
              )}
            >
              {t.label}
              {count > 0 && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  active ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-600"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-zinc-400">กำลังโหลด...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
            ลองใหม่
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-zinc-400">
          <ShoppingCart className="h-12 w-12 opacity-30" />
          <p className="text-sm">ไม่มีออเดอร์ในสถานะนี้</p>
        </div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="space-y-3 lg:hidden">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onApprove={handleApprove}
                onReject={handleRejectOpen}
                onShip={handleShipOpen}
                onVoid={handleVoidOpen}
                onSlipClick={setSlipModalUrl}
                onDetailClick={handleDetailClick}
                onReceiptPdf={openReceiptPreview}
                isUpdating={updatingId}
              />
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">เลขออเดอร์</th>
                  <th className="px-4 py-3">ลูกค้า</th>
                  <th className="px-4 py-3">ยอด</th>
                  <th className="px-4 py-3">ช่องทาง</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">สลิป</th>
                  <th className="px-4 py-3">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderTableRow
                    key={order.id}
                    order={order}
                    onApprove={handleApprove}
                    onReject={handleRejectOpen}
                    onShip={handleShipOpen}
                    onVoid={handleVoidOpen}
                    onSlipClick={setSlipModalUrl}
                    onDetailClick={handleDetailClick}
                    onReceiptPdf={openReceiptPreview}
                    isUpdating={updatingId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Order Detail Modal ── */}
      <Dialog open={!!detailModal || detailLoading} onOpenChange={(o) => !o && !detailLoading && setDetailModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="flex flex-row items-center justify-between gap-2 pr-10">
            <DialogTitle className="flex items-center gap-2 text-emerald-800">
              <ShoppingCart className="h-5 w-5" />
              รายละเอียดออเดอร์
            </DialogTitle>
            {detailModal && detailModal.id != null && (
              <div className="flex flex-wrap gap-2 shrink-0">
                {isReceiptEligibleStatus(detailModal.status) && (
                  <Button
                    size="sm"
                    className="bg-[#003366] hover:bg-[#00264d] text-white border-0"
                    onClick={() => void handleReceiptPDF()}
                  >
                    <Receipt className="mr-1.5 h-4 w-4" />
                    ออกใบเสร็จ
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={handlePrintPackingSlip}
                >
                  <Printer className="mr-1.5 h-4 w-4" />
                  พิมพ์ใบปะหน้า
                </Button>
                {detailModal.status === "COMPLETED" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => { setDetailModal(null); handleVoidOpen(detailModal.id); }}
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    ยกเลิกออเดอร์
                  </Button>
                )}
              </div>
            )}
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : detailModal ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                <span className="font-mono font-bold text-emerald-800">#{detailModal.orderNumber}</span>
                <Badge className={statusStyle(detailModal.status)}>{statusLabel(detailModal.status)}</Badge>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-700">รายการสินค้า</h4>
                <div className="space-y-2 rounded-lg border border-zinc-200 p-3">
                  {detailModal.items.map((item, i) => (
                    <div key={i} className="flex justify-between gap-2 text-sm">
                      <span className="min-w-0 text-zinc-800">
                        {item.productName} ({item.unitLabel})
                        {item.breederName && (
                          <span className="ml-1 text-xs text-zinc-500">— {item.breederName}</span>
                        )}
                        <span className="text-zinc-600"> × {item.quantity}</span>
                      </span>
                      <span className="shrink-0 font-medium text-emerald-700">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                  <div className="space-y-1 border-t border-zinc-200 pt-2 text-right text-sm text-zinc-600">
                    {(detailModal.discountAmount > 0 || detailModal.shippingFee > 0) && (
                      <>
                        <p>
                          ยอดสินค้า:{" "}
                          <span className="font-medium text-zinc-800">
                            {formatPrice(
                              detailModal.totalAmount -
                                detailModal.shippingFee +
                                detailModal.discountAmount
                            )}
                          </span>
                        </p>
                        {detailModal.discountAmount > 0 && (
                          <p>
                            ส่วนลด:{" "}
                            <span className="font-medium text-amber-700">
                              -{formatPrice(detailModal.discountAmount)}
                            </span>
                          </p>
                        )}
                        <p>
                          ค่าจัดส่ง:{" "}
                          <span className="font-medium text-zinc-800">
                            {detailModal.shippingFee <= 0
                              ? "ฟรี"
                              : formatPrice(detailModal.shippingFee)}
                          </span>
                        </p>
                      </>
                    )}
                    <p className="pt-1 text-base font-bold text-emerald-800">
                      รวมทั้งสิ้น {formatPrice(detailModal.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-700">ข้อมูลลูกค้า</h4>
                <div className="space-y-1 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 text-sm">
                  <p><span className="text-zinc-500">ชื่อ:</span> {detailModal.customerName ?? "—"}</p>
                  <p><span className="text-zinc-500">โทร:</span> {detailModal.customerPhone ?? "—"}</p>
                  <p className="whitespace-pre-wrap"><span className="text-zinc-500">ที่อยู่:</span> {detailModal.shippingAddress ?? "—"}</p>
                </div>
              </div>
              {detailModal.customerNote && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-zinc-700">หมายเหตุ</h4>
                  <p className="rounded-lg border border-zinc-200 bg-amber-50/50 p-3 text-sm text-zinc-700">
                    {detailModal.customerNote}
                  </p>
                </div>
              )}
              {detailModal.status === "VOIDED" && detailModal.voidReason && (
                <div className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600">
                  เหตุผลยกเลิก: {detailModal.voidReason}
                </div>
              )}
              {detailModal.trackingNumber && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  <Truck className="h-4 w-4 shrink-0" />
                  <span>{detailModal.shippingProvider?.replace("_", " ")} · {detailModal.trackingNumber}</span>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Slip Lightbox ── */}
      <Dialog open={!!slipModalUrl} onOpenChange={(o) => !o && setSlipModalUrl(null)}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="text-base">สลิปโอนเงิน</DialogTitle>
          </DialogHeader>
          {slipModalUrl && (
            <div className="p-4">
              {slipModalUrl.toLowerCase().includes(".pdf") ? (
                <a
                  href={slipModalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 py-8 text-emerald-700 hover:bg-emerald-50"
                >
                  <FileText className="h-10 w-10" />
                  <span className="font-medium">เปิดไฟล์ PDF ในแท็บใหม่</span>
                </a>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={slipModalUrl}
                  alt="Payment slip"
                  className="mx-auto max-h-[75vh] w-full rounded-xl object-contain"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={!!rejectModal} onOpenChange={(o) => !o && setRejectModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ระบุเหตุผลการปฏิเสธ</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="เช่น จำนวนเงินไม่ตรง, สลิปไม่ชัดเจน, สลิปซ้ำ..."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            className="mt-2 resize-none"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectModal(null)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleRejectSubmit()}
              disabled={updatingId !== null}
            >
              {updatingId !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันปฏิเสธ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Void Dialog ── */}
      <Dialog open={!!voidModal} onOpenChange={(o) => !o && setVoidModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <RotateCcw className="h-5 w-5" />
              ยกเลิกออเดอร์ (Void)
            </DialogTitle>
          </DialogHeader>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            แน่ใจหรือไม่? การยกเลิกจะคืนสต็อกและปรับคะแนนลูกค้าอัตโนมัติ
          </p>
          <Textarea
            placeholder="เหตุผล (ไม่บังคับ)"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVoidModal(null)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleVoidSubmit()}
              disabled={updatingId !== null}
            >
              {updatingId !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันยกเลิก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Ship Dialog (จัดส่ง) — Button group avoids Radix/select portal bug on mobile ── */}
      <Dialog open={!!shipModal} onOpenChange={(o) => !o && setShipModal(null)}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800">
              <Truck className="h-5 w-5 text-emerald-600" />
              บันทึกการจัดส่ง
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ผู้ให้บริการขนส่ง</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SHIPPING_PROVIDERS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setShipProvider(p.value)}
                    className={cn(
                      "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                      shipProvider === p.value
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-200 bg-white text-zinc-700 hover:border-emerald-400 hover:bg-emerald-50"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ship-tracking">เลขพัสดุ (Tracking Number)</Label>
              <Input
                id="ship-tracking"
                placeholder="เช่น EY123456789TH"
                value={shipTracking}
                onChange={(e) => setShipTracking(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShipModal(null)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => void handleShipSubmit()}
              disabled={!shipTracking.trim() || updatingId !== null}
            >
              {updatingId !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึกการจัดส่ง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptPreviewModal
        open={receiptPreviewOrderId != null}
        onOpenChange={(o) => {
          if (!o) setReceiptPreviewOrderId(null);
        }}
        orderId={receiptPreviewOrderId}
        buildDoc={buildReceiptFromPayload}
        onError={(msg) => pushToast(msg, "error")}
      />

      {/* ── Toast Stack ── */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
