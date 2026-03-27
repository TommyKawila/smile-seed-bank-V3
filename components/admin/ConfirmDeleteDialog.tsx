"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const DEFAULT_TITLE = "ยืนยันการลบ / Confirm Deletion";
const DEFAULT_DESCRIPTION =
  "คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้? การกระทำนี้ไม่สามารถย้อนกลับได้ / Are you sure you want to delete this? This action cannot be undone.";

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  loading = false,
  variant = "destructive",
  confirmLabel = "ลบ / Delete",
  cancelLabel = "ยกเลิก / Cancel",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  loading?: boolean;
  variant?: "destructive" | "default";
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !loading) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-wrap">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={loading}
            className={variant === "default" ? "bg-primary hover:bg-primary/90" : undefined}
            onClick={() => void onConfirm()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
