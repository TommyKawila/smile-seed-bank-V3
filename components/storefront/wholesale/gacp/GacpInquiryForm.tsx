"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type FormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  estimatedQty: string;
  message: string;
};

const empty: FormState = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  licenseNumber: "",
  estimatedQty: "",
  message: "",
};

export function GacpInquiryForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(empty);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const patch = (partial: Partial<FormState>) => setForm((f) => ({ ...f, ...partial }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/wholesale/gacp-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          licenseNumber: form.licenseNumber.trim() || undefined,
          estimatedQty: form.estimatedQty.trim() || undefined,
          message: form.message.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setSent(true);
      setForm(empty);
      toast({
        title: t("ส่งคำขอแล้ว", "Inquiry sent"),
        description: t(
          "ทีมจะติดต่อกลับเรื่องแคตตาล็อกและเอกสารล็อต",
          "Our team will follow up on catalog and lot documents."
        ),
      });
    } catch (err) {
      toast({
        title: t("ส่งไม่สำเร็จ", "Send failed"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="gacp-inquiry" className="scroll-mt-20 bg-white py-14 sm:py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("ขอแคตตาล็อกและชุดเอกสารล็อต", "Request catalog & lot documents")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {t(
              "สำหรับเจ้าของฟาร์มที่ต้องการชุดเอกสารหรือใบเสนอราคาจำนวนมาก กรอกข้อมูลด้านล่าง ทีมจะติดต่อภายใน 1–2 วันทำการ",
              "For farm owners requesting document packages or bulk quotes. Submit below — our team replies within 1–2 business days."
            )}
          </p>
          {sent ? (
            <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {t(
                "ได้รับคำขอแล้ว — ตรวจอีเมลและรอการติดต่อจากทีม",
                "Request received — check your email and wait for our specialist."
              )}
            </p>
          ) : null}
        </div>

        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="gacp-company" className="text-xs text-slate-600">
                {t("ชื่อฟาร์ม / บริษัท", "Farm / Company Name")} *
              </Label>
              <Input
                id="gacp-company"
                required
                value={form.companyName}
                onChange={(e) => patch({ companyName: e.target.value })}
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gacp-contact" className="text-xs text-slate-600">
                {t("ผู้ติดต่อ", "Contact Person")} *
              </Label>
              <Input
                id="gacp-contact"
                required
                value={form.contactName}
                onChange={(e) => patch({ contactName: e.target.value })}
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gacp-email" className="text-xs text-slate-600">
                Email *
              </Label>
              <Input
                id="gacp-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => patch({ email: e.target.value })}
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gacp-phone" className="text-xs text-slate-600">
                {t("โทรศัพท์", "Phone")}
              </Label>
              <Input
                id="gacp-phone"
                value={form.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gacp-license" className="text-xs text-slate-600">
                {t("เลขใบอนุญาต (ถ้ามี)", "License Number (optional)")}
              </Label>
              <Input
                id="gacp-license"
                value={form.licenseNumber}
                onChange={(e) => patch({ licenseNumber: e.target.value })}
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="gacp-qty" className="text-xs text-slate-600">
                {t("ปริมาณเมล็ดโดยประมาณ", "Estimated Seed Quantity")}
              </Label>
              <Input
                id="gacp-qty"
                placeholder={t("เช่น 5,000–20,000 เมล็ด", "e.g. 5,000–20,000 seeds")}
                value={form.estimatedQty}
                onChange={(e) => patch({ estimatedQty: e.target.value })}
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="gacp-message" className="text-xs text-slate-600">
                {t("ข้อความ", "Message")}
              </Label>
              <Textarea
                id="gacp-message"
                rows={4}
                value={form.message}
                onChange={(e) => patch({ message: e.target.value })}
                placeholder={t(
                  "สายพันธุ์ที่สนใจ, เอกสารที่ต้องการ, ไทม์ไลน์โปรเจกต์…",
                  "Strains of interest, documents needed, project timeline…"
                )}
                className="resize-y bg-white text-sm"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={sending}
            className="min-h-12 w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t("ส่งคำขอเอกสาร / ปรึกษา", "Submit document / consult request")}
          </Button>
        </form>
      </div>
    </section>
  );
}
