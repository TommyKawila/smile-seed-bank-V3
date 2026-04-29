"use client";

import { Fragment } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import { Loader2, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CategoryBadge,
  EditableCell,
  TypeBadge,
  type InventoryRow,
  type ProductGroup,
} from "@/components/admin/inventory/inventory-shared";

export function InventoryGrid({
  loading,
  rowsLength,
  filteredGrouped,
  table,
  handleEditProduct,
  loadingEditId,
  savingId,
  patchVariant,
}: {
  loading: boolean;
  rowsLength: number;
  filteredGrouped: ProductGroup[];
  table: Table<InventoryRow>;
  handleEditProduct: (productId: number) => void;
  loadingEditId: number | null;
  savingId: number | null;
  patchVariant: (id: number, patch: Partial<Pick<InventoryRow, "stock" | "cost_price" | "price">>) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rowsLength === 0 ? (
          <div className="py-12 text-center text-zinc-500">ไม่มี variant ในระบบ หรือกรองแล้วไม่ตรง</div>
        ) : filteredGrouped.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">ไม่พบผลลัพธ์ที่ตรงกับคำค้นหา</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b bg-zinc-50">
                    {hg.headers.map((h) => (
                      <th key={h.id} className="px-4 py-3 text-left font-medium text-zinc-700">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {filteredGrouped.map((grp) => (
                  <Fragment key={grp.product_id}>
                    <tr className="border-b bg-zinc-100/80 font-medium">
                      <td className="w-10 px-2 py-2.5" />
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-900">{grp.product_name}</span>
                          <button
                            type="button"
                            onClick={() => handleEditProduct(grp.product_id)}
                            disabled={loadingEditId === grp.product_id}
                            className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-50"
                            title="แก้ไขสินค้า"
                          >
                            {loadingEditId === grp.product_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Pencil className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">{grp.brand}</td>
                      <td className="px-4 py-2.5"><CategoryBadge value={grp.category} /></td>
                      <td className="px-4 py-2.5"><TypeBadge value={grp.type} /></td>
                      <td className="px-4 py-2.5 text-xs">{grp.thc_level}</td>
                      <td colSpan={6} className="px-4 py-2.5 text-xs text-zinc-500">{grp.variants.length} SKU(s)</td>
                    </tr>
                    {grp.variants.map((v, vIdx) => (
                      <tr
                        key={v.id}
                        className={`border-b transition-colors hover:bg-accent/50 ${v.stock === 0 ? "bg-red-50" : ""} ${v.stock <= (v.low_stock_threshold ?? 5) && v.stock > 0 ? "bg-red-50/50" : ""} ${vIdx % 2 === 1 ? "bg-zinc-50/30" : ""}`}
                      >
                        <td className="w-10 px-2 py-2" />
                        <td className="pl-8 pr-4 py-2 text-zinc-500">
                          ↳ {v.unit_label}
                          {!v.is_active && (
                            <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                              ปิด / Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2" />
                        <td className="px-4 py-2" />
                        <td className="px-4 py-2" />
                        <td className="px-4 py-2" />
                        <td className="px-4 py-2 font-mono text-xs">{v.sku ?? "—"}</td>
                        <td className="px-4 py-2">
                          {(() => {
                            const th = v.low_stock_threshold ?? 5;
                            const low = v.stock > 0 && v.stock <= th;
                            return (
                              <div className={low ? "inline-flex items-center gap-1 rounded bg-red-100/80 px-1.5 py-0.5" : "inline-flex items-center gap-1"}>
                                <EditableCell
                                  value={v.stock}
                                  saving={savingId === v.id}
                                  onSave={(val) => patchVariant(v.id, { stock: Math.max(0, Math.round(val)) })}
                                />
                                {low && <span className="text-[10px] font-medium text-red-700 shrink-0" title={`แจ้งต่ำ ≤ ${th}`}>ต่ำ ≤{th}</span>}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-2">
                          <EditableCell
                            value={v.cost_price}
                            saving={savingId === v.id}
                            onSave={(val) => patchVariant(v.id, { cost_price: val })}
                            prefix="฿"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <EditableCell
                            value={v.price}
                            saving={savingId === v.id}
                            onSave={(val) => patchVariant(v.id, { price: val })}
                            prefix="฿"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <span className={`text-xs ${v.margin < 0 ? "text-red-600" : "text-slate-500"}`}>{v.margin}%</span>
                        </td>
                        <td className="px-4 py-2">{v.unit_label}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
