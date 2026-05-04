"use client";

import { useEffect, useRef, useState } from "react";
import type { jsPDF } from "jspdf";
import { Loader2, Download, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isReceiptEligibleStatus } from "@/lib/receipt-pdf";
import { receiptPdfFileName } from "@/lib/pdf-filename";

type OrderFetchPayload = {
  orderNumber?: string;
  customerName?: string | null;
  sourceQuotationNumber?: string | null;
  status?: string;
  paymentStatus?: string;
};

type BuildDocFn = (detail: unknown) => Promise<jsPDF>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | null;
  buildDoc: BuildDocFn;
  onError: (msg: string) => void;
};

export function ReceiptPreviewModal({ open, onOpenChange, orderId, buildDoc, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("receipt.pdf");
  const [previewReady, setPreviewReady] = useState(false);
  const docRef = useRef<jsPDF | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const revokeBlob = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
    docRef.current = null;
    setPreviewReady(false);
  };

  useEffect(() => {
    if (!open || orderId == null) {
      revokeBlob();
      setLoadError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setPreviewReady(false);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
    docRef.current = null;

    (async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        const data = (await res.json()) as OrderFetchPayload & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "โหลดออเดอร์ไม่สำเร็จ");
        if (!isReceiptEligibleStatus(data.status ?? "", data.paymentStatus)) {
          throw new Error("ไม่สามารถออกใบเสร็จสำหรับสถานะนี้");
        }
        const doc = await buildDoc(data);
        if (cancelled) return;
        docRef.current = doc;
        const blob = doc.output("blob");
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
        setFileName(
          receiptPdfFileName(
            String(data.orderNumber ?? orderId),
            data.customerName ?? null,
            data.sourceQuotationNumber ?? null
          )
        );
        setPreviewReady(true);
      } catch (e) {
        if (!cancelled) {
          const msg = String(e instanceof Error ? e.message : e);
          setLoadError(msg);
          onErrorRef.current(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      docRef.current = null;
    };
  }, [open, orderId, buildDoc]);

  const handleClose = (next: boolean) => {
    if (!next) {
      revokeBlob();
      setLoadError(null);
    }
    onOpenChange(next);
  };

  const handleDownload = () => {
    docRef.current?.save(fileName);
  };

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.focus();
    iframeRef.current?.contentWindow?.print();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] h-[min(90vh,800px)] flex flex-col gap-0 p-0">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0 border-b border-zinc-200">
          <DialogTitle className="text-[#003366]">ตัวอย่างใบเสร็จ / Receipt preview</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 flex flex-col px-4 pb-2">
          {loading && (
            <div className="flex flex-1 items-center justify-center gap-2 py-16 text-zinc-500">
              <Loader2 className="h-8 w-8 animate-spin text-[#003366]" />
              <span>กำลังโหลดข้อมูลล่าสุด...</span>
            </div>
          )}
          {!loading && loadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
          )}
          {!loading && !loadError && blobUrl && (
            <iframe
              ref={iframeRef}
              title="Receipt PDF"
              src={blobUrl}
              className="w-full flex-1 min-h-[50vh] rounded-md border border-zinc-200 bg-zinc-100"
            />
          )}
        </div>
        <DialogFooter className="px-4 py-3 border-t border-zinc-200 gap-2 sm:gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            ปิด
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-[#003366] text-[#003366] hover:bg-[#003366]/10"
            disabled={!previewReady}
            onClick={handlePrint}
          >
            <Printer className="mr-1.5 h-4 w-4" />
            พิมพ์ (Print)
          </Button>
          <Button
            type="button"
            className="bg-[#003366] hover:bg-[#00264d] text-white"
            disabled={!previewReady}
            onClick={handleDownload}
          >
            <Download className="mr-1.5 h-4 w-4" />
            ดาวน์โหลด PDF (Download)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
