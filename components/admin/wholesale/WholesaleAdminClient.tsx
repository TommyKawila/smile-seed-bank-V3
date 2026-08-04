"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { WholesaleTier } from "@/lib/wholesale-public-pricing";

type Tab = "catalog" | "pricing" | "rfqs";

type TierEdit = Omit<WholesaleTier, "id">;

type WholesaleSettingsDTO = {
  moq: number;
  gacpFeeThb: number;
  gacpFeeEur: number;
  tiers: WholesaleTier[];
};

type WholesaleStrainDTO = {
  id: string;
  name: string;
  typeLabel: string;
  sortOrder: number;
  isActive: boolean;
};

type WholesaleRfqListItem = {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  currency: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export function WholesaleAdminClient() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("catalog");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [strains, setStrains] = useState<WholesaleStrainDTO[]>([]);
  const [settings, setSettings] = useState<WholesaleSettingsDTO | null>(null);
  const [rfqs, setRfqs] = useState<WholesaleRfqListItem[]>([]);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Feminized");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, stRes, rRes] = await Promise.all([
        fetch("/api/admin/wholesale/strains", { cache: "no-store" }),
        fetch("/api/admin/wholesale/settings", { cache: "no-store" }),
        fetch("/api/admin/wholesale/rfqs", { cache: "no-store" }),
      ]);
      const sJson = (await sRes.json()) as {
        strains?: WholesaleStrainDTO[];
        error?: string;
      };
      const stJson = (await stRes.json()) as {
        settings?: WholesaleSettingsDTO;
        error?: string;
      };
      const rJson = (await rRes.json()) as {
        rfqs?: WholesaleRfqListItem[];
        error?: string;
      };
      if (!sRes.ok) throw new Error(sJson.error ?? "strains");
      if (!stRes.ok) throw new Error(stJson.error ?? "settings");
      if (!rRes.ok) throw new Error(rJson.error ?? "rfqs");
      setStrains(sJson.strains ?? []);
      setSettings(stJson.settings ?? null);
      setRfqs(rJson.rfqs ?? []);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "โหลด Wholesale ไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const addStrain = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/wholesale/strains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          typeLabel: newType.trim() || "Feminized",
          sortOrder: strains.length,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "create failed");
      setNewName("");
      await load();
      toast({ title: "เพิ่มสายพันธุ์แล้ว" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "เพิ่มไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  const patchStrain = async (
    id: string,
    patch: Partial<{
      name: string;
      typeLabel: string;
      sortOrder: number;
      isActive: boolean;
    }>
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/wholesale/strains/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "update failed");
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "อัปเดตไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  const removeStrain = async (id: string) => {
    if (!confirm("ลบสายพันธุ์นี้?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/wholesale/strains/${id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "delete failed");
      await load();
      toast({ title: "ลบแล้ว" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "ลบไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  const savePricing = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const tiers: TierEdit[] = settings.tiers.map(
        ({ minQty, maxQty, thbPerSeed, eurPerSeed, bestValue }) => ({
          minQty,
          maxQty,
          thbPerSeed,
          eurPerSeed,
          bestValue,
        })
      );
      const res = await fetch("/api/admin/wholesale/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moq: settings.moq,
          gacpFeeThb: settings.gacpFeeThb,
          gacpFeeEur: settings.gacpFeeEur,
          tiers,
        }),
      });
      const json = (await res.json()) as {
        settings?: WholesaleSettingsDTO;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "save failed");
      setSettings(json.settings ?? settings);
      toast({ title: "บันทึกราคาแล้ว" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "บันทึกไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  const updateTier = (index: number, patch: Partial<TierEdit>) => {
    if (!settings) return;
    const tiers = settings.tiers.map((t, i) =>
      i === index ? { ...t, ...patch } : t
    );
    setSettings({ ...settings, tiers });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "catalog", label: "Catalog" },
    { id: "pricing", label: "Pricing" },
    { id: "rfqs", label: "RFQs" },
  ];

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading wholesale…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Wholesale</h1>
          <p className="text-sm text-slate-500">
            Catalog, tiers &amp; public RFQ inbox for{" "}
            <Link href="/wholesale" className="text-emerald-700 underline">
              /wholesale
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={tab === t.id ? "default" : "outline"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === "rfqs" && rfqs.length > 0 ? ` (${rfqs.length})` : ""}
            </Button>
          ))}
        </div>
      </div>

      {tab === "catalog" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Catalog strains</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Strain name"
                  className="w-56"
                />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button type="button" onClick={() => void addStrain()} disabled={saving}>
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-24">Sort</TableHead>
                  <TableHead className="w-24">Active</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {strains.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Input
                        defaultValue={s.name}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== s.name) void patchStrain(s.id, { name: v });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={s.typeLabel}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== s.typeLabel) {
                            void patchStrain(s.id, { typeLabel: v });
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        defaultValue={s.sortOrder}
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n !== s.sortOrder) {
                            void patchStrain(s.id, { sortOrder: n });
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={s.isActive}
                        onChange={(e) =>
                          void patchStrain(s.id, { isActive: e.target.checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => void removeStrain(s.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!strains.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-slate-500">
                      No strains yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === "pricing" && settings && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pricing &amp; GACP</CardTitle>
            <Button type="button" onClick={() => void savePricing()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>MOQ (seeds)</Label>
                <Input
                  type="number"
                  value={settings.moq}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      moq: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>GACP fee (THB)</Label>
                <Input
                  type="number"
                  value={settings.gacpFeeThb}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      gacpFeeThb: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>GACP fee (EUR)</Label>
                <Input
                  type="number"
                  value={settings.gacpFeeEur}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      gacpFeeEur: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tiers</Label>
              {settings.tiers.map((tier, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-6"
                >
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">Min qty</span>
                    <Input
                      type="number"
                      value={tier.minQty}
                      onChange={(e) =>
                        updateTier(i, {
                          minQty: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">Max qty</span>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={tier.maxQty ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        updateTier(i, {
                          maxQty: raw === "" ? null : Math.floor(Number(raw) || 0),
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">THB / seed</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={tier.thbPerSeed}
                      onChange={(e) =>
                        updateTier(i, {
                          thbPerSeed: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">EUR / seed</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={tier.eurPerSeed}
                      onChange={(e) =>
                        updateTier(i, {
                          eurPerSeed: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={tier.bestValue}
                        onChange={(e) =>
                          updateTier(i, { bestValue: e.target.checked })
                        }
                      />
                      Best value
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "rfqs" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Public RFQ inbox</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/documents/b2b-quote">
                Open B2B Pro-Forma
                <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link
                        href="/admin/documents/b2b-quote"
                        className="font-medium text-emerald-700 underline"
                      >
                        {r.quoteNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{r.clientName}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {r.clientEmail}
                    </TableCell>
                    <TableCell>
                      {r.currency}{" "}
                      {r.totalAmount.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(r.updatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {!rfqs.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-slate-500">
                      No wholesale RFQs yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
