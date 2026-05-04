"use client";

import { CheckCircle2, Loader2, RotateCcw, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OrderStatusActions({
  busy,
  canApprove,
  canCancelPending,
  canShip,
  canVoid,
  completedVoid,
  onApprove,
  onReject,
  onCancelPending,
  onShip,
  onVoid,
}: {
  busy: boolean;
  canApprove: boolean;
  canCancelPending: boolean;
  canShip: boolean;
  canVoid: boolean;
  completedVoid?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onCancelPending: () => void;
  onShip: () => void;
  onVoid: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {canApprove && (
        <>
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={onApprove} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
            อนุมัติ
          </Button>
          <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={onReject} disabled={busy}>
            <XCircle className="mr-1 h-3.5 w-3.5" /> ปฏิเสธ
          </Button>
        </>
      )}
      {canCancelPending && (
        <Button size="sm" variant="ghost" className="border border-red-200/80 text-red-600 hover:bg-red-50" onClick={onCancelPending} disabled={busy}>
          ยกเลิก
        </Button>
      )}
      {canShip && (
        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={onShip} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="mr-1 h-3.5 w-3.5" />}
          จัดส่ง
        </Button>
      )}
      {canVoid && (
        <Button
          size="sm"
          variant={completedVoid ? "ghost" : "outline"}
          className={cn(completedVoid ? "text-red-600 hover:bg-red-50 hover:text-red-700" : "border-red-300 text-red-700 hover:bg-red-50")}
          onClick={onVoid}
          disabled={busy}
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Void
        </Button>
      )}
    </div>
  );
}
