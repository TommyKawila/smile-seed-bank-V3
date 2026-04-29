"use client";

import { Filter, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategoryOption = { id: string; name: string };
type BreederOption = { id: number | string; name: string };

export function InventorySearch({
  searchQuery,
  setSearchQuery,
  category,
  setCategory,
  typeFilter,
  setTypeFilter,
  brandId,
  setBrandId,
  stockLevel,
  setStockLevel,
  categories,
  breeders,
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  brandId: string;
  setBrandId: (value: string) => void;
  stockLevel: string;
  setStockLevel: (value: string) => void;
  categories: CategoryOption[];
  breeders: BreederOption[];
}) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" /> กรอง
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">ค้นหา</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="ค้นหาชื่อสายพันธุ์ หรือ SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-[220px] pl-8 rounded-md border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="Indica">Indica</SelectItem>
              <SelectItem value="Sativa">Sativa</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">แบรนด์</Label>
          <Select value={brandId || "all"} onValueChange={(v) => setBrandId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {breeders.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">สต็อก</Label>
          <Select value={stockLevel || "all"} onValueChange={(v) => setStockLevel(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="low">ต่ำ</SelectItem>
              <SelectItem value="out">หมด</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
