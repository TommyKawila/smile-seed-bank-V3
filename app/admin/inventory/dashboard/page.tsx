"use client";

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
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatPrice } from "@/lib/utils";

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

const EMERALD_COLORS = ["#047857", "#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];

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

  const formatBaht = (v: number) =>
    `฿${v.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`;

  const pieData = stats.valueByBreeder.map((b) => ({ name: b.name, value: b.value }));
  const totalPie = pieData.reduce((s, d) => s + d.value, 0);

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
            {totalPie === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
                ยังไม่มีข้อมูล
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={EMERALD_COLORS[i % EMERALD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) => [formatBaht(value ?? 0), "มูลค่า"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e4e4e7",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
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
            {stats.stockByCategory.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
                ยังไม่มีข้อมูล
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={stats.stockByCategory}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#71717a" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 11, fill: "#71717a" }}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [
                      (value ?? 0).toLocaleString(),
                      "จำนวน",
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e4e4e7",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="stock" fill="#047857" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
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
