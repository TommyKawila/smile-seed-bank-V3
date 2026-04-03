"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CustomerTier = "Retail" | "Wholesale" | "VIP";

type Customer = {
  id: string;
  name: string;
  phone: string;
  line_id: string | null;
  tier: CustomerTier;
  points: number;
  total_spend: string | number;
  preference: string | null;
  notes: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

const TIER_OPTIONS: { value: CustomerTier | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "Retail", label: "Retail" },
  { value: "Wholesale", label: "Wholesale" },
  { value: "VIP", label: "VIP" },
];

function PreferenceBadge({ preference }: { preference: string | null }) {
  if (!preference?.trim()) return null;
  const p = preference.toLowerCase();
  const label =
    p.includes("indica") && !p.includes("sativa")
      ? "Indica Lover"
      : p.includes("sativa") && !p.includes("indica")
        ? "Sativa Lover"
        : p.includes("hybrid") || (p.includes("indica") && p.includes("sativa"))
          ? "Hybrid Fan"
          : preference;
  return (
    <Badge variant="secondary" className="ml-1.5 text-xs font-normal">
      {label}
    </Badge>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<CustomerTier | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    line_id: "",
    tier: "Retail" as CustomerTier,
    preference: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (tierFilter !== "all") params.set("tier", tierFilter);
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search, tierFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(), 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", phone: "", line_id: "", tier: "Retail", preference: "", notes: "" });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      line_id: c.line_id ?? "",
      tier: c.tier,
      preference: c.preference ?? "",
      notes: c.notes ?? "",
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("กรุณากรอกชื่อ");
      return;
    }
    if (!form.phone.trim()) {
      setError("กรุณากรอกเบอร์โทร");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/customers/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
            line_id: form.line_id.trim() || null,
            tier: form.tier,
            preference: form.preference.trim() || null,
            notes: form.notes.trim() || null,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
      } else {
        const res = await fetch("/api/admin/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
            line_id: form.line_id.trim() || null,
            tier: form.tier,
            preference: form.preference.trim() || null,
            notes: form.notes.trim() || null,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error ?? "สร้างไม่สำเร็จ");
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">จัดการลูกค้า</h1>
          <p className="text-sm text-zinc-500">{customers.length} รายการ</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-white hover:bg-primary/90">
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่มลูกค้า
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">กรอง</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">ค้นหา (ชื่อ/เบอร์โทร)</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="ค้นหา..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-[220px] pl-8"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tier</Label>
            <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as CustomerTier | "all")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">รายการลูกค้า</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50">
                <TableHead>ชื่อ</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>LINE</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="text-right">ยอดซื้อรวม</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                    <p className="text-sm text-zinc-400">
                      {search || tierFilter !== "all" ? "ไม่พบลูกค้าที่ค้นหา" : "ยังไม่มีลูกค้า"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-zinc-50">
                    <TableCell className="font-medium">
                      <span>{c.name}</span>
                      <PreferenceBadge preference={c.preference} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{c.phone}</TableCell>
                    <TableCell className="text-sm text-zinc-500">{c.line_id ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          c.tier === "VIP"
                            ? "border-amber-300 text-amber-700"
                            : c.tier === "Wholesale"
                              ? "border-primary/30 text-primary"
                              : ""
                        }
                      >
                        {c.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.points}</TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(c.total_spend).toLocaleString("th-TH")} ฿
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-primary"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขลูกค้า" : "เพิ่มลูกค้า"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>ชื่อ *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ชื่อลูกค้า"
              />
            </div>
            <div className="space-y-2">
              <Label>เบอร์โทร *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="08xxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label>LINE ID</Label>
              <Input
                value={form.line_id}
                onChange={(e) => setForm((f) => ({ ...f, line_id: e.target.value }))}
                placeholder="@username หรือ Line ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Preference (ประเภทพันธุกรรม)</Label>
              <Input
                value={form.preference}
                onChange={(e) => setForm((f) => ({ ...f, preference: e.target.value }))}
                placeholder="เช่น Indica, Sativa, Hybrid 50/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Tier</Label>
              <Select
                value={form.tier}
                onValueChange={(v) => setForm((f) => ({ ...f, tier: v as CustomerTier }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Wholesale">Wholesale</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="หมายเหตุเพิ่มเติม"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {editing ? "บันทึก" : "เพิ่ม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
