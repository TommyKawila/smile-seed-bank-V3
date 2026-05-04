"use client";

import { useState } from "react";
import { CalendarDays, Loader2, Percent, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { toastErrorMessage } from "@/lib/admin-toast";
import {
  ImageUploadField,
  type ImageUploadPhase,
} from "@/components/admin/ImageUploadField";

type BreederOption = {
  id: number;
  name: string;
};

type BulkDiscountResponse = {
  breederId: string;
  discountPercent: number;
  endsAt: string | null;
  articleBanners?: {
    thUrl?: string | null;
    enUrl?: string | null;
    mobileThUrl?: string | null;
    mobileEnUrl?: string | null;
  };
  campaignId?: string | null;
  updatedVariants: number;
};

function dateInputToEndOfDay(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function BulkDiscountDialog({
  breeders,
  onApplied,
}: {
  breeders: BreederOption[];
  onApplied?: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [breederId, setBreederId] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [dateValue, setDateValue] = useState("");
  const [articleBannerThUrl, setArticleBannerThUrl] = useState("");
  const [articleBannerEnUrl, setArticleBannerEnUrl] = useState("");
  const [articleBannerMobileThUrl, setArticleBannerMobileThUrl] = useState("");
  const [articleBannerMobileEnUrl, setArticleBannerMobileEnUrl] = useState("");
  const [uploadPhase, setUploadPhase] = useState<ImageUploadPhase>("idle");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const endsAt = dateInputToEndOfDay(dateValue);
      const res = await fetch("/api/admin/promotions/bulk-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          breederId,
          discountPercent: Number(discountPercent),
          endsAt: endsAt?.toISOString() ?? null,
          articleBannerThUrl: articleBannerThUrl.trim() || null,
          articleBannerEnUrl: articleBannerEnUrl.trim() || null,
          articleBannerMobileThUrl: articleBannerMobileThUrl.trim() || null,
          articleBannerMobileEnUrl: articleBannerMobileEnUrl.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as
        | BulkDiscountResponse
        | { error?: string };
      if (!res.ok) throw new Error("error" in data ? data.error : "Bulk discount failed");
      const result = data as BulkDiscountResponse;
      toast({
        title: "อัปเดตส่วนลดสำเร็จ",
        description: `Updated ${result.updatedVariants} variants. Discount ${result.discountPercent}%.`,
      });
      onApplied?.();
      setOpen(false);
    } catch (err) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: toastErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const disabled =
    !breederId ||
    discountPercent === "" ||
    Number.isNaN(Number(discountPercent)) ||
    Number(discountPercent) < 0 ||
    Number(discountPercent) > 100 ||
    uploadPhase !== "idle" ||
    saving;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="border-primary/20 text-primary hover:bg-accent">
          <Percent className="h-4 w-4" />
          Bulk Discount
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Discount by Breeder</DialogTitle>
          <DialogDescription>
            ตั้งส่วนลดแบบตรงให้ทุก pack ของ breeder ที่เลือก / Apply direct discount to all packs.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              การทำงานนี้จะ override `discount_percent` และ `discount_ends_at` เดิมของ breeder นี้ทั้งหมด.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Breeder</Label>
            <Select value={breederId} onValueChange={setBreederId}>
              <SelectTrigger>
                <SelectValue placeholder="เลือก Breeder" />
              </SelectTrigger>
              <SelectContent>
                {breeders.map((breeder) => (
                  <SelectItem key={breeder.id} value={String(breeder.id)}>
                    {breeder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Discount Percentage (0-100)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={discountPercent}
              onChange={(event) => setDiscountPercent(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Expiry Date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-start">
                  <CalendarDays className="h-4 w-4" />
                  {dateValue || "No expiry date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto">
                <Input
                  type="date"
                  value={dateValue}
                  onChange={(event) => setDateValue(event.target.value)}
                />
                {dateValue ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => setDateValue("")}
                  >
                    Clear date
                  </Button>
                ) : null}
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3 rounded-xl border border-primary/10 bg-accent/20 p-3">
            <div>
              <Label className="text-primary">Article Banner Images</Label>
              <p className="mt-1 text-xs text-zinc-500">
                Desktop target 1200x400, Mobile target 600x400.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Thai
                </p>
                <ImageUploadField
                  label="TH Desktop 1200x400"
                  value={articleBannerThUrl}
                  onChange={setArticleBannerThUrl}
                  onPhaseChange={setUploadPhase}
                  disabled={saving}
                  compact
                  campaignTransparency
                />
                <ImageUploadField
                  label="TH Mobile 600x400"
                  value={articleBannerMobileThUrl}
                  onChange={setArticleBannerMobileThUrl}
                  onPhaseChange={setUploadPhase}
                  disabled={saving}
                  compact
                  campaignTransparency
                />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  English
                </p>
                <ImageUploadField
                  label="EN Desktop 1200x400"
                  value={articleBannerEnUrl}
                  onChange={setArticleBannerEnUrl}
                  onPhaseChange={setUploadPhase}
                  disabled={saving}
                  compact
                  campaignTransparency
                />
                <ImageUploadField
                  label="EN Mobile 600x400"
                  value={articleBannerMobileEnUrl}
                  onChange={setArticleBannerMobileEnUrl}
                  onPhaseChange={setUploadPhase}
                  disabled={saving}
                  compact
                  campaignTransparency
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={disabled}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Apply Discount
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
