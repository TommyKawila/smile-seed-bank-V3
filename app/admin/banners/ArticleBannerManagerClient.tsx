"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ImagePlus, Loader2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ArticleCampaignBannerAdminRow } from "@/services/promotion-campaign-service";

type ImageField =
  | "articleBannerThUrl"
  | "articleBannerEnUrl"
  | "articleBannerMobileThUrl"
  | "articleBannerMobileEnUrl";

type FormState = Pick<
  ArticleCampaignBannerAdminRow,
  "id" | "articleBannerThUrl" | "articleBannerEnUrl" | "articleBannerMobileThUrl" | "articleBannerMobileEnUrl"
>;

const IMAGE_FIELDS: { key: ImageField; label: string; size: string }[] = [
  { key: "articleBannerThUrl", label: "Desktop TH", size: "1200x400" },
  { key: "articleBannerEnUrl", label: "Desktop EN", size: "1200x400" },
  { key: "articleBannerMobileThUrl", label: "Mobile TH", size: "600x400" },
  { key: "articleBannerMobileEnUrl", label: "Mobile EN", size: "600x400" },
];

function formFromCampaign(campaign: ArticleCampaignBannerAdminRow): FormState {
  return {
    id: campaign.id,
    articleBannerThUrl: campaign.articleBannerThUrl,
    articleBannerEnUrl: campaign.articleBannerEnUrl,
    articleBannerMobileThUrl: campaign.articleBannerMobileThUrl,
    articleBannerMobileEnUrl: campaign.articleBannerMobileEnUrl,
  };
}

async function uploadArticleBannerFile(field: ImageField, file: File): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  form.set("key", `article-campaign-${field}`);
  form.set("bucket", "site-assets");

  const res = await fetch("/api/admin/settings/upload?preset=campaign", {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return data.url;
}

function BannerPreview({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="relative aspect-[3/1] overflow-hidden rounded-lg bg-zinc-100">
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" sizes="180px" />
      ) : (
        <div className="flex h-full items-center justify-center text-zinc-400">
          <ImagePlus className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

export function ArticleBannerManagerClient({
  initialCampaigns,
}: {
  initialCampaigns: ArticleCampaignBannerAdminRow[];
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [form, setForm] = useState<FormState | null>(null);
  const [files, setFiles] = useState<Partial<Record<ImageField, File>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openEdit = (campaign: ArticleCampaignBannerAdminRow) => {
    setForm(formFromCampaign(campaign));
    setFiles({});
    setError(null);
  };

  const saveCampaign = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form };
      for (const field of IMAGE_FIELDS) {
        const file = files[field.key];
        if (file) payload[field.key] = await uploadArticleBannerFile(field.key, file);
      }

      const res = await fetch(`/api/admin/banners/article-campaigns/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { campaign?: ArticleCampaignBannerAdminRow; error?: string };
      if (!res.ok || !data.campaign) throw new Error(data.error ?? "Save failed");

      const savedCampaign = data.campaign;
      setCampaigns((prev) =>
        prev.map((campaign) => (campaign.id === savedCampaign.id ? savedCampaign : campaign))
      );
      setForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="border-zinc-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Article Banners</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              Quick edit active campaign banners used inside blog articles.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/promotions">
              <ExternalLink className="h-4 w-4" />
              Manage in Promotions
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
              No active campaign article banners yet.
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm lg:grid-cols-[180px_minmax(0,1fr)_auto]"
                >
                  <BannerPreview src={campaign.articleBannerThUrl} alt={campaign.name} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-medium text-zinc-900">{campaign.name}</h3>
                      <Badge>{campaign.status}</Badge>
                      {campaign.discountPercent != null ? (
                        <Badge variant="outline">{campaign.discountPercent}%</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {campaign.breederName ?? "All campaigns"} · expires{" "}
                      {campaign.endsAt ? new Date(campaign.endsAt).toLocaleDateString("th-TH") : "-"}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-400">{campaign.href}</p>
                  </div>
                  <div className="flex items-center gap-2 lg:justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(campaign)}>
                      <Pencil className="h-4 w-4" />
                      Edit banners
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={form !== null} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Article Banners</DialogTitle>
            <DialogDescription>Desktop 1200x400, mobile 600x400 for Thai and English.</DialogDescription>
          </DialogHeader>

          {form ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {IMAGE_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2 rounded-xl border border-zinc-200 p-3">
                  <Label>
                    {field.label} <span className="text-xs font-normal text-zinc-400">{field.size}</span>
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setFiles((prev) => ({ ...prev, [field.key]: file }));
                    }}
                  />
                  <Input
                    value={form[field.key] ?? ""}
                    placeholder="Image URL"
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value || null })}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveCampaign} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
