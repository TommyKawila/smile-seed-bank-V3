"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  DollarSign,
  Leaf,
  Package,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/utils";

const DynamicInventoryBreederPie = dynamic(
  () =>
    import("@/components/admin/inventory/InventoryDashboardCharts").then((m) => ({
      default: m.InventoryBreederValuePie,
    })),
  {
    ssr: false,
    loading: () => <div className="h-[280px] animate-pulse rounded-md bg-muted" aria-hidden />,
  }
);

const DynamicInventoryCategoryBar = dynamic(
  () =>
    import("@/components/admin/inventory/InventoryDashboardCharts").then((m) => ({
      default: m.InventoryStockByCategoryBar,
    })),
  {
    ssr: false,
    loading: () => <div className="h-[280px] animate-pulse rounded-md bg-muted" aria-hidden />,
  }
);

type Stats = {
  totalInventoryValue: number;
  totalVarieties: number;
  totalItemsInStock: number;
  outOfStockCount: number;
  valueByBreeder: { breederId: string; name: string; value: number }[];
  stockByCategory: { name: string; stock: number }[];
  lowStock: {
    variantId: number;
    productName: string;
    masterSku: string;
    breederName: string;
    unitLabel: string;
    stock: number;
    sku: string | null;
  }[];
};

function Scorecard({
  title,
  value,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  variant?: "default" | "alert";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500">{title}</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                variant === "alert" ? "text-amber-600" : "text-zinc-900"
              }`}
            >
              {value}
            </p>
          </div>
          <div
            className={`rounded-xl p-2.5 ${
              variant === "alert" ? "bg-amber-100" : "bg-primary/10"
            }`}
          >
            <Icon
              className={`h-5 w-5 ${variant === "alert" ? "text-amber-600" : "text-primary"}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InventoryDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/inventory/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setStats(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <h1 className="text-xl font-bold text-zinc-900">Inventory Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-16 animate-pulse rounded bg-zinc-200" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-zinc-200" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <h1 className="text-xl font-bold text-zinc-900">Inventory Dashboard</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">{error ?? "Failed to load stats"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pieData = stats.valueByBreeder.map((b) => ({ name: b.name, value: b.value }));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="text-xl font-bold text-zinc-900">Inventory Dashboard</h1>
      <p className="text-sm text-zinc-500">ภาพรวมสต็อกและมูลค่าสินค้าคงคลัง</p>

      {/* Top Row Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Scorecard
          title="Total Inventory Value (ต้นทุน)"
          value={formatPrice(stats.totalInventoryValue)}
          icon={DollarSign}
        />
        <Scorecard
          title="Total Varieties"
          value={stats.totalVarieties.toLocaleString()}
          icon={Leaf}
        />
        <Scorecard
          title="Total Items in Stock"
          value={stats.totalItemsInStock.toLocaleString()}
          icon={Package}
        />
        <Scorecard
          title="Out of Stock Alert"
          value={stats.outOfStockCount.toString()}
          icon={AlertTriangle}
          variant={stats.outOfStockCount > 0 ? "alert" : "default"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Value by Breeder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicInventoryBreederPie pieData={pieData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Stock by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicInventoryCategoryBar stockByCategory={stats.stockByCategory} />
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Low Stock (Top 20)</CardTitle>
          <p className="text-sm text-zinc-500">สินค้าที่เหลือ 1–4 ชิ้น (ไม่รวมหมดสต็อก)</p>
        </CardHeader>
        <CardContent>
          {stats.lowStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">ไม่มีสินค้าใกล้หมด</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden sm:table-cell">SKU</TableHead>
                    <TableHead>Breeder</TableHead>
                    <TableHead>Pack</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.lowStock.map((row) => (
                    <TableRow key={row.variantId}>
                      <TableCell className="font-medium">{row.productName}</TableCell>
                      <TableCell className="hidden sm:table-cell text-zinc-500">
                        {row.masterSku || row.sku || "—"}
                      </TableCell>
                      <TableCell>{row.breederName}</TableCell>
                      <TableCell>{row.unitLabel}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-amber-600">{row.stock}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
