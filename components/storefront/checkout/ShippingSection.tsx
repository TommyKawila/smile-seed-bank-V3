"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CheckoutForm = {
  full_name: string;
  phone: string;
  address: string;
  guest_email: string;
  order_note: string;
};

export function ShippingSection({
  user,
  form,
  fieldErrors,
  setField,
  t,
  serif,
}: {
  user: unknown;
  form: CheckoutForm;
  fieldErrors: Partial<Record<keyof CheckoutForm, string>>;
  setField: (field: keyof CheckoutForm, value: string) => void;
  t: (th: string, en: string) => string;
  serif: string;
}) {
  return (
    <Card className="rounded-sm border-zinc-200 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <h2 className={cn(serif, "text-sm font-medium text-zinc-800")}>
          {t("ข้อมูลจัดส่ง", "Shipping details")}
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="full_name" className="text-xs font-light text-zinc-600">
              {t("ชื่อ-นามสกุล *", "Full name *")}
            </Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => setField("full_name", e.target.value)}
              placeholder={t("ชื่อผู้รับ", "Recipient name")}
              className="rounded-sm border-zinc-200 bg-white"
            />
            {fieldErrors.full_name && <p className="text-xs text-red-500">{fieldErrors.full_name}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-xs font-light text-zinc-600">
              {t("เบอร์โทร *", "Phone *")}
            </Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="08x-xxx-xxxx"
              type="tel"
              className="rounded-sm border-zinc-200 bg-white"
            />
            {fieldErrors.phone && <p className="text-xs text-red-500">{fieldErrors.phone}</p>}
          </div>
        </div>

        {!user && (
          <div className="space-y-1">
            <Label htmlFor="guest_email" className="text-xs font-light text-zinc-600">
              {t("อีเมล *", "Email *")}
            </Label>
            <Input
              id="guest_email"
              type="email"
              value={form.guest_email}
              onChange={(e) => setField("guest_email", e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="rounded-sm border-zinc-200 bg-white"
            />
            {fieldErrors.guest_email && <p className="text-xs text-red-500">{fieldErrors.guest_email}</p>}
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="address" className="text-xs font-light text-zinc-600">
            {t("ที่อยู่จัดส่ง *", "Shipping address *")}
          </Label>
          <Textarea
            id="address"
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder={t("บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์", "Street, district, province, postal code")}
            rows={3}
            className="rounded-sm border-zinc-200 bg-white"
          />
          {fieldErrors.address && <p className="text-xs text-red-500">{fieldErrors.address}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="order_note" className="text-xs font-light text-zinc-600">
            {t("หมายเหตุถึงผู้ขาย (ไม่บังคับ)", "Order note (optional)")}
          </Label>
          <Textarea
            id="order_note"
            value={form.order_note}
            onChange={(e) => setField("order_note", e.target.value)}
            placeholder={t("เช่น วันเวลาที่สะดวกรับ", "e.g. preferred delivery time")}
            rows={3}
            className="resize-none rounded-sm border-zinc-200 bg-white"
          />
          {fieldErrors.order_note && <p className="text-xs text-red-500">{fieldErrors.order_note}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
