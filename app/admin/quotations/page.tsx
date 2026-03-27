"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Loader2,
  RefreshCw,
  Send,
  ShoppingCart,
  Search,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice, cn } from "@/lib/utils";
import { generateReceiptPDF } from "@/lib/receipt-pdf";
import { quotationPdfFileName } from "@/lib/pdf-filename";
import { fetchPdfSettings } from "@/lib/pdf-settings";
import { saveQuotationHandoff, type QuotationDuplicateLine } from "@/lib/quotation-grid-handoff";
import { parsePackFromUnitLabel } from "@/lib/sku-utils";
import { useToast } from "@/hooks/use-toast";
import { toastErrorMessage } from "@/lib/admin-toast";

type QuotationRow = {
  id: number;
  quotationNumber: string;
  customerName: string | null;
  status: string;
  totalAmount: number;
  validUntil: string | null;
  convertedOrderId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type LifecycleTab = "all" | "pending" | "converted";

const STATUS_OPTS = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "DRAFT", label: "ร่าง (Draft)" },
  { value: "SENT", label: "ส่งแล้ว (Sent)" },
  { value: "CONVERTED", label: "แปลงเป็นออเดอร์" },
  { value: "SHIPPED", label: "ส่งสินค้าแล้ว (จากออเดอร์)" },
  { value: "EXPIRED", label: "หมดอายุ" },
];

function statusBadgeClass(s: string) {
  switch (s) {
    case "DRAFT":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    case "SENT":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "CONVERTED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "SHIPPED":
      return "bg-emerald-800 text-white border-emerald-900";
    case "EXPIRED":
      return "bg-amber-50 text-amber-900 border-amber-200";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

function statusLabelTh(s: string) {
  return STATUS_OPTS.find((o) => o.value === s)?.label ?? s;
}

function quotationStatusBadge(row: QuotationRow): { label: string; className: string } {
  if (row.convertedOrderId != null && row.status === "SHIPPED") {
    return {
      label: "ส่งแล้ว (ปิดดีล) ✅",
      className: "border-emerald-800 bg-emerald-800 text-white shadow-sm",
    };
  }
  if (row.convertedOrderId != null) {
    return {
      label: "ปิดดีลแล้ว ✅",
      className: "border-emerald-600 bg-emerald-700 text-white shadow-sm",
    };
  }
  if (row.status === "SENT") {
    return { label: "ส่งแล้ว (รอโอน)", className: statusBadgeClass("SENT") };
  }
  return { label: statusLabelTh(row.status), className: statusBadgeClass(row.status) };
}

export default function QuotationsHistoryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [rows, setRows] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lifecycleTab, setLifecycleTab] = useState<LifecycleTab>("pending");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [convertTargetId, setConvertTargetId] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const pushToast = useCallback(
    (msg: string, type: "success" | "error" | "info") => {
      if (type === "error") {
        toast({
          title: "เกิดข้อผิดพลาด (Error)",
          description: msg,
          variant: "destructive",
        });
      } else if (type === "success") {
        toast({ title: "สำเร็จ (Success)", description: msg });
      } else {
        toast({ title: "ข้อมูล (Info)", description: msg });
      }
    },
    [toast]
  );

  const duplicateQuotation = async (id: number) => {
    pushToast("กำลังคัดลอกข้อมูลใบเสนอราคา...", "info");
    setBusyId(id);
    try {
      const qRes = await fetch(`/api/admin/quotations/${id}`);
      const q = await qRes.json();
      if (!qRes.ok) throw new Error(q.error ?? "โหลดไม่สำเร็จ");
      const rawItems = q.items as Array<{
        productId: number;
        variantId: number;
        productName: string;
        unitLabel: string | null;
        breederName?: string | null;
        quantity: number;
        unitPrice: number;
        discount: number;
        lineTotal: number;
      }>;
      if (!rawItems?.length) throw new Error("ไม่มีรายการสินค้า");

      const stockRes = await fetch("/api/admin/quotations/variant-stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantIds: rawItems.map((it) => it.variantId) }),
      });
      const stockData = await stockRes.json();
      if (!stockRes.ok) throw new Error(stockData.error ?? "โหลดสต็อกไม่สำเร็จ");
      const stocks = (stockData.stocks ?? {}) as Record<string, number>;

      const lines: QuotationDuplicateLine[] = rawItems.map((it) => {
        const stock = stocks[String(it.variantId)] ?? 0;
        const unitLabel = it.unitLabel?.trim() || "1 Seed";
        const packSize = parsePackFromUnitLabel(unitLabel);
        let qty = it.quantity;
        if (stock >= 1) qty = Math.min(qty, stock);
        else qty = 0;
        if (stock >= 1 && qty < 1) qty = 1;
        const price = Number(it.unitPrice) || 0;
        const rawDisc = Number(it.discount) || 0;
        const discount = Math.min(rawDisc, price * qty);
        const lineTotal = Math.max(0, price * qty - discount);
        return {
          productId: it.productId,
          variantId: it.variantId,
          productName: it.productName,
          unitLabel,
          packSize,
          unitPrice: price,
          quantity: qty,
          discount,
          lineTotal,
          breederName: it.breederName ?? null,
          masterSku: "",
          stock,
        };
      });

      saveQuotationHandoff({
        v: 2,
        source: "duplicate",
        customer: {
          name: q.customerName ?? "",
          phone: q.customerPhone ?? "",
          email: q.customerEmail ?? "",
          address: q.customerAddress ?? "",
          note: q.customerNote ?? "",
        },
        lines,
      });
      router.push("/admin/quotations/new?from=duplicate");
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setBusyId(null);
    }
  };

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (search.trim()) p.set("search", search.trim());
      if (lifecycleTab !== "all") p.set("lifecycle", lifecycleTab);
      if (statusFilter && statusFilter !== "all") p.set("status", statusFilter);
      if (dateFrom) p.set("dateFrom", dateFrom);
      if (dateTo) p.set("dateTo", dateTo);
      const res = await fetch(`/api/admin/quotations?${p}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setRows(data.quotations ?? []);
    } catch (e) {
      setError(String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, lifecycleTab, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const viewPdf = async (id: number) => {
    setBusyId(id);
    try {
      const [qRes, pdfSettings] = await Promise.all([
        fetch(`/api/admin/quotations/${id}`),
        fetchPdfSettings(),
      ]);
      const q = await qRes.json();
      if (!qRes.ok) throw new Error(q.error ?? "โหลดไม่สำเร็จ");
      const orderDate = q.createdAt ? new Date(q.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      const items = (q.items as Array<Record<string, unknown>>).map((i) => ({
        productName: String(i.productName),
        breeder: i.breederName as string | undefined,
        unitLabel: String(i.unitLabel ?? ""),
        quantity: Number(i.quantity),
        price: Number(i.unitPrice),
        discount: Number(i.discount ?? 0),
        subtotal: Number(i.lineTotal),
      }));
      const doc = generateReceiptPDF({
        docType: "quotation",
        orderNumber: q.quotationNumber,
        orderDate,
        customerName: q.customerName ?? "",
        customerEmail: q.customerEmail ?? null,
        customerPhone: q.customerPhone ?? null,
        customerAddress: q.customerAddress ?? null,
        customerNote: q.customerNote ?? null,
        items,
        grandTotal: Number(q.totalAmount),
        logoDataUrl: pdfSettings.logoDataUrl,
        validityDate: q.validUntil ?? null,
        companyName: pdfSettings.companyName,
        companyAddress: pdfSettings.companyAddress,
        companyEmail: pdfSettings.companyEmail,
        companyPhone: pdfSettings.companyPhone,
        companyLineId: pdfSettings.companyLineId,
        bankName: pdfSettings.bankName,
        bankAccountName: pdfSettings.bankAccountName,
        bankAccountNo: pdfSettings.bankAccountNo,
        socialLinks: pdfSettings.socialLinks ?? [],
      });
      doc.save(
        quotationPdfFileName(String(q.quotationNumber), (q.customerName as string | null) ?? null)
      );
    } catch (e) {
      console.error(e);
      toast({
        title: "เกิดข้อผิดพลาด (Error)",
        description: toastErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const markSent = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/quotations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SENT" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "ไม่สำเร็จ");
      await fetchList();
    } catch (e) {
      console.error(e);
      toast({
        title: "เกิดข้อผิดพลาด (Error)",
        description: toastErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const runConvert = async (idStr: string) => {
    const id = Number(idStr);
    if (!Number.isFinite(id)) return;
    setIsConverting(true);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/quotations/${id}/convert`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "แปลงไม่สำเร็จ");
      await fetchList();
      setConvertTargetId(null);
      pushToast("แปลงเป็นออเดอร์สำเร็จ", "success");
      const oid = typeof data.orderId === "number" ? data.orderId : Number(data.orderId);
      if (Number.isFinite(oid)) router.push(`/admin/orders?openOrder=${oid}`);
      else router.push("/admin/orders");
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setIsConverting(false);
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">ประวัติใบเสนอราคา</h1>
          <p className="text-sm text-zinc-500">ค้นหา ดู PDF แปลงเป็นออเดอร์จากข้อมูลที่บันทึกแล้ว</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchList()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Link href="/admin/quotations/new">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <FileText className="mr-1.5 h-4 w-4" />
              สร้างใบเสนอราคา
            </Button>
          </Link>
        </div>
      </div>

      <Tabs
        value={lifecycleTab}
        onValueChange={(v) => setLifecycleTab(v as LifecycleTab)}
        className="w-full"
      >
        <TabsList className="grid h-auto w-full max-w-2xl grid-cols-3 gap-1 bg-zinc-100/90 p-1.5 text-zinc-600">
          <TabsTrigger
            value="all"
            className="rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm sm:text-sm"
          >
            ทั้งหมด
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm sm:text-sm"
          >
            รอจัดการ
          </TabsTrigger>
          <TabsTrigger
            value="converted"
            className="rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-zinc-700 data-[state=active]:shadow-sm sm:text-sm"
          >
            แปลงเป็นออเดอร์แล้ว
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="ค้นหาเลขที่ / ชื่อลูกค้า..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
        <span className="self-center text-zinc-400">—</span>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Dialog open={convertTargetId !== null} onOpenChange={(o) => !o && setConvertTargetId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แปลงเป็นออเดอร์</DialogTitle>
            <DialogDescription>ต้องการแปลงใบเสนอราคานี้เป็นออเดอร์ใช่หรือไม่?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setConvertTargetId(null)}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={convertTargetId === null || isConverting}
              onClick={() => convertTargetId != null && void runConvert(convertTargetId)}
            >
              {isConverting ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยัน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">เลขที่</th>
              <th className="px-4 py-3">ลูกค้า</th>
              <th className="px-4 py-3">วันที่</th>
              <th className="px-4 py-3">ยอดรวม</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-zinc-400">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-400">
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const busy = busyId === r.id;
                const isConverted = r.convertedOrderId != null;
                const badge = quotationStatusBadge(r);
                const markSentDisabled =
                  busy || r.status === "SENT" || r.status === "SHIPPED" || isConverted;
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-zinc-100 hover:bg-zinc-50/60",
                      isConverted && "bg-zinc-50/50 text-zinc-500 hover:bg-zinc-100/60"
                    )}
                  >
                    <td
                      className={cn(
                        "px-4 py-3 font-mono font-medium",
                        isConverted ? "text-zinc-500" : "text-emerald-800"
                      )}
                    >
                      {r.quotationNumber}
                    </td>
                    <td className="px-4 py-3">{r.customerName ?? "—"}</td>
                    <td className="px-4 py-3 opacity-90">
                      {r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : "—"}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 font-semibold",
                        isConverted ? "text-zinc-500" : "text-emerald-700"
                      )}
                    >
                      {formatPrice(r.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-xs font-normal", badge.className)}>
                        {badge.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-violet-500 text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                          disabled={busy}
                          onClick={() => void duplicateQuotation(r.id)}
                        >
                          {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant={isConverted ? "outline" : "default"}
                          className={cn(
                            isConverted
                              ? "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                              : "bg-emerald-700 text-white hover:bg-emerald-800"
                          )}
                          disabled={busy}
                          onClick={() => void viewPdf(r.id)}
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1 h-3.5 w-3.5" />}
                          View PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                          disabled={markSentDisabled}
                          onClick={() => void markSent(r.id)}
                        >
                          <Send className="mr-1 h-3.5 w-3.5" />
                          Mark as Sent
                        </Button>
                        {!isConverted && (
                          <Button
                            size="sm"
                            className="bg-teal-600 text-white hover:bg-teal-700"
                            disabled={busy || isConverting}
                            onClick={() => setConvertTargetId(String(r.id))}
                          >
                            {isConverting && busyId === r.id ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                            )}
                            Convert to Order
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
