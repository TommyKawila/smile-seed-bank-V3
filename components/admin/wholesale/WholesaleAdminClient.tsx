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
import {
  DEFAULT_BULK_PRICING,
  type BulkPricingConfig,
} from "@/lib/wholesale-bulk-pricing";

type Tab = "catalog" | "pricing" | "rfqs";

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
  const [pricing, setPricing] = useState<BulkPricingConfig>(DEFAULT_BULK_PRICING);
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
        settings?: { bulkPricing?: BulkPricingConfig };
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
      setPricing(stJson.settings?.bulkPricing ?? DEFAULT_BULK_PRICING);
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
    setSaving(true);
    try {
      const res = await fetch("/api/admin/wholesale/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricing),
      });
      const json = (await res.json()) as {
        settings?: { bulkPricing?: BulkPricingConfig };
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "save failed");
      setPricing(json.settings?.bulkPricing ?? pricing);
      toast({ title: "บันทึกราคาแล้ว (จำนวนเต็ม THB)" });
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
            Bulk pricing (editable) &amp; RFQ inbox for{" "}
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

      {tab === "pricing" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Bulk pricing (v2)</CardTitle>
              <p className="text-xs text-slate-500">
                ราคาบันทึกเป็นจำนวนเต็ม THB (ปัดขึ้น) · แก้ได้เมื่อต้นทุนขึ้น
              </p>
            </div>
            <Button type="button" onClick={() => void savePricing()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>EUR → THB rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={pricing.eurThb}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      eurThb: Math.max(0.01, Number(e.target.value) || 38.44),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Micro pack qty</Label>
                <Input
                  type="number"
                  value={pricing.microPackQty}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      microPackQty: Math.max(1, Math.floor(Number(e.target.value) || 100)),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Micro pack THB/seed</Label>
                <Input
                  type="number"
                  value={pricing.microPackThb}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      microPackThb: Math.max(0, Math.ceil(Number(e.target.value) || 0)),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Strain tiers (per strain qty)</Label>
              {pricing.strainTiers.map((tier, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-3"
                >
                  <Input
                    type="number"
                    placeholder="Min"
                    value={tier.minQty}
                    onChange={(e) => {
                      const strainTiers = [...pricing.strainTiers];
                      strainTiers[i] = {
                        ...tier,
                        minQty: Math.floor(Number(e.target.value) || 0),
                      };
                      setPricing({ ...pricing, strainTiers });
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={tier.maxQty ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      const strainTiers = [...pricing.strainTiers];
                      strainTiers[i] = {
                        ...tier,
                        maxQty: raw === "" ? null : Math.floor(Number(raw) || 0),
                      };
                      setPricing({ ...pricing, strainTiers });
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="THB/seed"
                    value={tier.thbPerSeed}
                    onChange={(e) => {
                      const strainTiers = [...pricing.strainTiers];
                      strainTiers[i] = {
                        ...tier,
                        thbPerSeed: Math.ceil(Number(e.target.value) || 0),
                      };
                      setPricing({ ...pricing, strainTiers });
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Bulk perks (total qty, all lines ≥500)</Label>
              {pricing.bulkPerks.map((perk, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-4"
                >
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">Min total</span>
                    <Input
                      type="number"
                      value={perk.minTotalQty}
                      onChange={(e) => {
                        const bulkPerks = [...pricing.bulkPerks];
                        bulkPerks[i] = {
                          ...perk,
                          minTotalQty: Math.floor(Number(e.target.value) || 0),
                        };
                        setPricing({ ...pricing, bulkPerks });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">THB/seed</span>
                    <Input
                      type="number"
                      value={perk.thbPerSeed}
                      onChange={(e) => {
                        const bulkPerks = [...pricing.bulkPerks];
                        bulkPerks[i] = {
                          ...perk,
                          thbPerSeed: Math.ceil(Number(e.target.value) || 0),
                        };
                        setPricing({ ...pricing, bulkPerks });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">Free COAs</span>
                    <Input
                      type="number"
                      value={perk.freeCoaCount}
                      onChange={(e) => {
                        const bulkPerks = [...pricing.bulkPerks];
                        bulkPerks[i] = {
                          ...perk,
                          freeCoaCount: Math.max(
                            0,
                            Math.floor(Number(e.target.value) || 0)
                          ),
                        };
                        setPricing({ ...pricing, bulkPerks });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">COA value each</span>
                    <Input
                      type="number"
                      value={perk.freeCoaValueEachThb}
                      onChange={(e) => {
                        const bulkPerks = [...pricing.bulkPerks];
                        bulkPerks[i] = {
                          ...perk,
                          freeCoaValueEachThb: Math.ceil(
                            Number(e.target.value) || 0
                          ),
                        };
                        setPricing({ ...pricing, bulkPerks });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>COA Package A (THB)</Label>
                <Input
                  type="number"
                  value={pricing.coaPackageAThb}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      coaPackageAThb: Math.ceil(Number(e.target.value) || 0),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>COA Package B (THB)</Label>
                <Input
                  type="number"
                  value={pricing.coaPackageBThb}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      coaPackageBThb: Math.ceil(Number(e.target.value) || 0),
                    })
                  }
                />
              </div>
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
