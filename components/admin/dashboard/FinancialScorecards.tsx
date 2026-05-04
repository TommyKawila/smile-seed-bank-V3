"use client";

import { BadgeDollarSign, ShoppingBag, TrendingUp, Warehouse } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type FinancialScorecardStats = {
  totalRevenue: number;
  grossProfit: number;
  totalOrders: number;
  totalInventoryValue: number;
};

function formatBaht(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function FinancialScorecards({ stats }: { stats: FinancialScorecardStats }) {
  const cards = [
    {
      title: "Total Revenue",
      value: formatBaht(stats.totalRevenue),
      icon: TrendingUp,
      className: "border-primary/15 bg-primary/5 text-primary",
    },
    {
      title: "Gross Profit",
      value: formatBaht(stats.grossProfit),
      icon: BadgeDollarSign,
      className: "border-secondary/80 bg-secondary/50 text-secondary-foreground",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString("th-TH"),
      icon: ShoppingBag,
      className: "border-zinc-200 bg-zinc-50 text-zinc-700",
    },
    {
      title: "Inventory Value",
      value: formatBaht(stats.totalInventoryValue),
      icon: Warehouse,
      className: "border-accent/80 bg-accent/50 text-accent-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, className }) => (
        <Card key={title} className="border-zinc-200/80 shadow-sm">
          <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500 sm:text-sm">{title}</p>
              <p className="mt-1 break-words text-xl font-bold tabular-nums tracking-tight text-zinc-900 sm:text-2xl">
                {value}
              </p>
            </div>
            <div className={`shrink-0 rounded-xl border p-2.5 ${className}`}>
              <Icon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
