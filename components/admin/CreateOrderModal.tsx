"use client";

import { useState, useMemo, useEffect } from "react";
import { Loader2, FileText, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateReceiptPDF } from "@/lib/receipt-pdf";
import { quotationPdfFileName } from "@/lib/pdf-filename";
import { fetchPdfSettings } from "@/lib/pdf-settings";

type GridRow = {
  productId: number;
  masterSku: string;
  name: string;
  packs: number[];
  byPack: Record<number, { stock: number; cost: number; price: number }>;
  variantIdsByPack?: Record<number, number | null>;
  isNew?: boolean;
};

type LineItem = {
  productId: number;
  variantId: number;
  productName: string;
  masterSku: string;
  packSize: number;
  unitLabel: string;
  price: number;
  quantity: number;
  discount: number;
  subtotal: number;
};

type CreateOrderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: GridRow[];
  selectedProductIds: Set<number>;
  breederName?: string;
  onSuccess?: () => void;
};

export function CreateOrderModal({
  open,
  onOpenChange,
  rows,
  selectedProductIds,
  breederName,
  onSuccess,
}: CreateOrderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfSettings, setPdfSettings] = useState<Awaited<ReturnType<typeof fetchPdfSettings>> | null>(null);
  const [attachLegalDocuments, setAttachLegalDocuments] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPdfSettings().then(setPdfSettings);
      fetch("/api/admin/quotations/number", { method: "POST" })
        .then((r) => r.json())
        .then((d) => d.number && setOrderNumber(d.number))
        .catch(() => setOrderNumber("SSB-QT-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-001"));
    }
  }, [open]);

  const selectedRows = useMemo(
    () => rows.filter((r) => selectedProductIds.has(r.productId) && !r.isNew),
    [rows, selectedProductIds]
  );

  const updateLineItem = (idx: number, updates: Partial<LineItem>) => {
    setLineItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx], ...updates };
      if ("packSize" in updates && updates.packSize != null) {
        const row = selectedRows.find((r) => r.productId === item.productId);
        const pack = row?.byPack?.[updates.packSize] ?? { price: 0 };
        item.price = pack.price || 0;
        item.unitLabel = updates.packSize === 1 ? "1 Seed" : `${updates.packSize} Seeds`;
        item.variantId = row?.variantIdsByPack?.[updates.packSize] ?? 0;
      }
      item.subtotal = item.price * item.quantity - (item.discount ?? 0);
      next[idx] = item;
      return next;
    });
  };

  const grandTotal = useMemo(
    () => lineItems.reduce((s, i) => s + i.subtotal, 0),
    [lineItems]
  );

  const getValidityDate = () => {
    const d = new Date(orderDate);
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  };

  const generatePDF = async (orderNoOverride?: string) => {
    const num = orderNoOverride ?? orderNumber;
    const items = lineItems.map((i) => ({
      productName: i.productName,
      breeder: breederName,
      unitLabel: i.unitLabel,
      quantity: i.quantity,
      price: i.price,
      discount: i.discount,
      subtotal: i.subtotal,
    }));
    return generateReceiptPDF({
      docType: "quotation",
      orderNumber: num,
      orderDate,
      customerName,
      customerEmail: customerEmail.trim() || null,
      customerPhone: customerPhone.trim() || null,
      customerNote: customerNote.trim() || null,
      items,
      grandTotal,
      logoDataUrl: pdfSettings?.logoDataUrl ?? null,
      validityDate: getValidityDate(),
      companyName: pdfSettings?.companyName,
      companyAddress: pdfSettings?.companyAddress,
      companyEmail: pdfSettings?.companyEmail,
      companyPhone: pdfSettings?.companyPhone,
      companyLineId: pdfSettings?.companyLineId,
      bankName: pdfSettings?.bankName,
      bankAccountName: pdfSettings?.bankAccountName,
      bankAccountNo: pdfSettings?.bankAccountNo,
      socialLinks: pdfSettings?.socialLinks ?? [],
      legalSeedLicenseNumber: pdfSettings?.legalSeedLicenseNumber ?? null,
      legalBusinessRegistrationNumber: pdfSettings?.legalBusinessRegistrationNumber ?? null,
      attachLegalDocuments,
    });
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const doc = await generatePDF();
      const blob = doc.output("blob");
      await new Promise((r) => setTimeout(r, 50));
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    setError(null);
    setConfirming(true);
    try {
      const validItems = lineItems.filter((i) => i.quantity > 0 && i.variantId > 0);
      if (validItems.length === 0) {
        setError("กรุณาระบุจำนวนและแพ็กที่ถูกต้อง");
        return;
      }

      const res = await fetch("/api/admin/orders/simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validItems.map((i) => ({
            variantId: i.variantId,
            productId: i.productId,
            productName: i.productName,
            unitLabel: i.unitLabel,
            quantity: i.quantity,
            price: i.discount > 0 ? (i.subtotal / i.quantity) : i.price,
          })),
          status: "COMPLETED",
          totalAmount: grandTotal,
          customer: {
            full_name: customerName || undefined,
            phone: customerPhone.trim() || undefined,
            note: customerNote.trim() || undefined,
            payment_method: "CASH",
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "สร้างออเดอร์ไม่สำเร็จ");
      const savedNo = String(data.orderNumber ?? orderNumber);
      setOrderNumber(savedNo);
      const doc = await generatePDF(savedNo);
      doc.save(quotationPdfFileName(savedNo, customerName || null));
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setConfirming(false);
    }
  };

  const getFirstAvailablePack = (row: GridRow) => {
    const packs = row.packs?.length ? row.packs : Object.keys(row.byPack || {}).map(Number).filter(Boolean);
    const withStock = packs.find((p) => (row.byPack?.[p]?.stock ?? 0) > 0);
    return withStock ?? packs[0] ?? 1;
  };

  useEffect(() => {
    if (open && selectedRows.length > 0) {
      setOrderDate(new Date().toISOString().slice(0, 10));
      setError(null);
      const items: LineItem[] = selectedRows.map((row) => {
        const packSize = getFirstAvailablePack(row);
        const pack = row.byPack?.[packSize] ?? { stock: 0, cost: 0, price: 0 };
        const variantId = row.variantIdsByPack?.[packSize] ?? 0;
        const price = pack.price || 0;
        const quantity = 1;
        const discount = 0;
        return {
          productId: row.productId,
          variantId,
          productName: row.name || row.masterSku || "—",
          masterSku: row.masterSku || "—",
          packSize,
          unitLabel: packSize === 1 ? "1 Seed" : `${packSize} Seeds`,
          price,
          quantity,
          discount,
          subtotal: price * quantity - discount,
        };
      });
      setLineItems(items);
    }
  }, [open, selectedRows]);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ใบเสนอราคา / บันทึกรายการสั่งซื้อ</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              สร้างใบเสนอราคา (PDF) และบันทึกออเดอร์ — ใบเสร็จออกได้จากประวัติออเดอร์เมื่อชำระแล้วเท่านั้น
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">ชื่อลูกค้า</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="ชื่อลูกค้า"
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">เบอร์โทร</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="เบอร์โทร"
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">อีเมล</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="อีเมล"
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">เลขที่</Label>
                <Input
                  value={orderNumber}
                  readOnly
                  placeholder="SSB-QT-YYYYMMDD-XXX"
                  className="h-8 bg-slate-50"
                />
              </div>
            </div>
            <div className="flex gap-4 items-end">
              <div className="space-y-1 min-w-[120px]">
                <Label className="text-sm">วันที่</Label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="flex-1 space-y-1 min-w-0">
              <Label className="text-sm">หมายเหตุ</Label>
              <Textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="หมายเหตุ (Customer Note)"
                className="min-h-[60px] resize-none border-slate-200"
              />
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left font-medium text-slate-700">ชื่อ</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Master SKU</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">แพ็ก</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-700 w-20">จำนวน</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-700 w-24">ส่วนลด</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-700 w-24">รวม</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => {
                  const row = selectedRows.find((r) => r.productId === item.productId);
                  const packSizes = row?.packs?.length ? row.packs : Object.keys(row?.byPack || {}).map(Number).filter(Boolean);
                  const getPackLabel = (p: number) => {
                    const stock = row?.byPack?.[p]?.stock ?? 0;
                    const label = `${p} ${p === 1 ? "Seed" : "Seeds"}`;
                    if (stock <= 0) return `${label} (Out of Stock)`;
                    return `${label} (Stock: ${stock})`;
                  };
                  const isPackDisabled = (p: number) => (row?.byPack?.[p]?.stock ?? 0) <= 0;
                  const availablePacks = packSizes.filter((p) => !isPackDisabled(p));
                  const currentStock = row?.byPack?.[item.packSize]?.stock ?? 0;
                  const needFallback = currentStock <= 0 && availablePacks.length > 0;
                  return (
                    <tr key={`${item.productId}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-3 py-2 text-slate-800">{item.productName}</td>
                      <td className="px-3 py-2 text-slate-600 font-mono text-xs">{item.masterSku}</td>
                      <td className="px-3 py-2">
                        <select
                          value={needFallback && availablePacks[0] != null ? availablePacks[0] : item.packSize}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!isPackDisabled(v)) updateLineItem(idx, { packSize: v });
                          }}
                          className="h-8 min-w-[140px] rounded border border-slate-200 bg-white px-2 text-sm"
                        >
                          {packSizes.map((p) => (
                            <option key={p} value={p} disabled={isPackDisabled(p)} className={isPackDisabled(p) ? "text-red-500" : ""}>
                              {getPackLabel(p)}
                            </option>
                          ))}
                        </select>
                        {needFallback && (
                          <p className="mt-0.5 text-[10px] text-amber-600">แพ็กที่เลือกหมดสต็อก — เลือกแพ็กอื่น</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(e) => updateLineItem(idx, { quantity: Math.max(0, Number(e.target.value) || 0) })}
                          className="h-8 w-16 text-right"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          value={item.discount || ""}
                          onChange={(e) => updateLineItem(idx, { discount: Math.max(0, Number(e.target.value) || 0) })}
                          className="h-8 w-20 text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-primary">
                        ฿{item.subtotal.toLocaleString("th-TH")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-end items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
              <input
                type="checkbox"
                checked={attachLegalDocuments}
                onChange={(e) => setAttachLegalDocuments(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              แนบเลขที่ใบอนุญาตใน PDF
            </label>
            <span className="text-sm text-slate-600">
              รวมทั้งสิ้น: <span className="font-semibold text-primary text-lg">฿{grandTotal.toLocaleString("th-TH")}</span>
            </span>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={previewing || lineItems.length === 0 || !pdfSettings}
          >
            {previewing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !pdfSettings ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-1.5 h-4 w-4" />
            )}
            {previewing ? "กำลังสร้าง..." : !pdfSettings ? "กำลังโหลด..." : "Preview"}
          </Button>
          <Button onClick={handleConfirm} disabled={confirming || lineItems.length === 0}>
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="mr-1.5 h-4 w-4" />}
            บันทึกคำสั่งซื้อ + PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
