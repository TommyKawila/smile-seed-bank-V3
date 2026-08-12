"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGreenFutureCatalog } from "@/hooks/useGreenFutureCatalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { resolvePartnerDocumentHref } from "@/lib/partner-doc-files";
import {
  formatPartnerVarietyRef,
  type PartnerSeedFormat,
  type PartnerStrainRecord,
  type PartnerPriceListRecord,
} from "@/types/partner-catalog";

function fmtEur(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? `€ ${n.toFixed(2)}` : value;
}

function fmtThb(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(2)} THB` : value;
}

function fmtUsd(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? `$ ${n.toFixed(2)}` : value;
}

function CostTermsPanel({ priceList }: { priceList: PartnerPriceListRecord }) {
  const priceDoc = priceList.sourceDocumentId;
  return (
    <Card className="border-amber-200/80 bg-amber-50/30 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <ShieldAlert className="h-4 w-4 text-amber-700" />
            Supplier cost & terms
          </CardTitle>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
            {priceList.status}
          </span>
        </div>
        <p className="text-xs text-amber-900/80">
          Internal only · {priceList.refCode ?? "—"} · {priceList.issuedAt ?? "—"}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Advance payment</p>
            <p className="font-medium">{priceList.advancePaymentPct}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Without COA (ship)</p>
            <p className="font-medium">{priceList.leadWithoutCoaDays ?? "—"} days</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">COA lab time</p>
            <p className="font-medium">~{priceList.coaLabDays ?? "—"} days</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Ship after COA</p>
            <p className="font-medium">{priceList.shipAfterCoaDays ?? "—"} days</p>
          </div>
        </div>
        {priceList.notes ? (
          <p className="rounded-lg border border-amber-100 bg-white/60 px-3 py-2 text-xs leading-relaxed text-slate-600">
            {priceList.notes}
          </p>
        ) : null}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">Seed price tiers</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>EUR/seed</TableHead>
                  <TableHead>THB/seed</TableHead>
                  <TableHead>COA included</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceList.tiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell className="text-sm font-medium">{tier.label}</TableCell>
                    <TableCell className="max-w-[180px] text-xs text-slate-600">
                      {tier.qtyDescription ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{fmtEur(tier.eurPerSeed)}</TableCell>
                    <TableCell className="font-mono text-xs">{fmtThb(tier.thbPerSeed)}</TableCell>
                    <TableCell className="text-xs">
                      {tier.coaIncludedCount > 0 ? (
                        <span className="text-emerald-700">≤ {tier.coaIncludedCount}</span>
                      ) : (
                        "Add-on"
                      )}
                      {tier.coaNotes ? (
                        <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{tier.coaNotes}</p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {priceList.coaServices.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-800">Additional COA services</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Analysis</TableHead>
                    <TableHead>USD/strain</TableHead>
                    <TableHead>THB/strain</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceList.coaServices.map((coa) => (
                    <TableRow key={coa.id}>
                      <TableCell className="text-sm">{coa.label}</TableCell>
                      <TableCell className="font-mono text-xs">{fmtUsd(coa.usdPerStrain)}</TableCell>
                      <TableCell className="font-mono text-xs">{fmtThb(coa.thbPerStrain)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}

        {priceDoc ? (
          <p className="text-xs text-slate-500">
            Source: {priceList.title}
            {priceList.refCode ? ` · ${priceList.refCode}` : ""}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function stockLabel(status: string): string {
  if (status === "IN_STOCK") return "In stock";
  if (status === "PRE_ORDER") return "Pre-order";
  if (status === "OUT") return "Out";
  return "Unknown";
}

function formatLabel(format: PartnerSeedFormat): string {
  return format === "AUTO_FEM" ? "Auto FEM" : "FEM";
}

export function GreenFutureCatalogClient() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [format, setFormat] = useState<PartnerSeedFormat | "ALL">("ALL");
  const [stock, setStock] = useState<"IN_STOCK" | "PRE_ORDER" | "ALL">("ALL");
  const [istaOnly, setIstaOnly] = useState(false);
  const [selected, setSelected] = useState<PartnerStrainRecord | null>(null);

  const filters = useMemo(
    () => ({
      q,
      format,
      stock,
      ista: istaOnly ? ("CONFIRMED" as const) : ("ALL" as const),
    }),
    [q, format, stock, istaOnly]
  );

  const { loading, supplier, documents, strains, priceList, total, error } =
    useGreenFutureCatalog(filters);

  const copyRef = async (strain: PartnerStrainRecord) => {
    const ref = formatPartnerVarietyRef(strain.varietyCode, strain.strainName);
    try {
      await navigator.clipboard.writeText(ref);
      toast({ title: "Copied", description: ref });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {supplier ? (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">
              {supplier.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-slate-600">
            <p>{supplier.legalName}</p>
            <p>{supplier.address}</p>
            <p>Tax ID: {supplier.taxId}</p>
            <p>{supplier.email}</p>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Documents</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start gap-2 text-sm font-semibold text-slate-800">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#12463e]" />
                  {doc.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-500">
                {doc.refCode ? <p>Ref: {doc.refCode}</p> : null}
                {doc.issuedAt ? <p>Date: {doc.issuedAt}</p> : null}
                <Button asChild size="sm" variant="outline" className="h-8">
                  <a
                    href={resolvePartnerDocumentHref(doc.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Open PDF
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {priceList ? <CostTermsPanel priceList={priceList} /> : null}

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">
            Strain catalog
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Search code / name</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="AF99, Pineapple, Runtz…"
                  className="h-9 pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Format</Label>
              <div className="flex flex-wrap gap-1.5">
                {(["ALL", "AUTO_FEM", "FEM"] as const).map((f) => (
                  <Button
                    key={f}
                    type="button"
                    size="sm"
                    variant={format === f ? "default" : "outline"}
                    className={format === f ? "bg-[#12463e] hover:bg-[#0f3a34]" : ""}
                    onClick={() => setFormat(f)}
                  >
                    {f === "ALL" ? "All" : formatLabel(f)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Stock</Label>
              <div className="flex flex-wrap gap-1.5">
                {(["ALL", "IN_STOCK", "PRE_ORDER"] as const).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={stock === s ? "default" : "outline"}
                    className={stock === s ? "bg-[#12463e] hover:bg-[#0f3a34]" : ""}
                    onClick={() => setStock(s)}
                  >
                    {s === "ALL" ? "All" : stockLabel(s)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">ISTA</Label>
              <Button
                type="button"
                size="sm"
                variant={istaOnly ? "default" : "outline"}
                className={istaOnly ? "bg-[#12463e] hover:bg-[#0f3a34]" : ""}
                onClick={() => setIstaOnly((v) => !v)}
              >
                ISTA confirmed
              </Button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                {total} strain{total === 1 ? "" : "s"} · Use variety code as primary ref (
                <span className="font-mono">AF99 (BUBBA KUSH AUTO)</span>)
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>THC</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>ISTA</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-8 text-center text-slate-400">
                          No strains match filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      strains.map((s) => (
                        <TableRow
                          key={s.id}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => setSelected(s)}
                        >
                          <TableCell className="font-mono text-xs font-medium">
                            {s.varietyCode}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate text-sm">
                            {s.strainName}
                          </TableCell>
                          <TableCell className="text-xs">{formatLabel(s.seedFormat)}</TableCell>
                          <TableCell className="text-xs">{s.thcRange ?? "—"}</TableCell>
                          <TableCell className="text-xs">{s.cycleDays ?? "—"}</TableCell>
                          <TableCell className="max-w-[120px] truncate text-xs">
                            {s.typeLabel ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs">{stockLabel(s.stockStatus)}</TableCell>
                          <TableCell className="text-xs">
                            {s.istaStatus === "CONFIRMED" ? (
                              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                                ISTA
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                void copyRef(s);
                              }}
                              aria-label="Copy variety ref"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500">
        Use in B2B quotes:{" "}
        <Link href="/admin/documents/b2b-quote" className="text-[#12463e] underline">
          B2B Pro-Forma
        </Link>
      </p>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono text-base">
                  {formatPartnerVarietyRef(selected.varietyCode, selected.strainName)}
                </SheetTitle>
              </SheetHeader>
              <dl className="mt-6 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Format</dt>
                  <dd>{formatLabel(selected.seedFormat)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">THC / CBD</dt>
                  <dd>
                    {selected.thcRange ?? "—"} · {selected.cbdNote ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Cycle / Height / Yield</dt>
                  <dd>
                    {selected.cycleDays ?? "—"} days · {selected.heightCm ?? "—"} cm ·{" "}
                    {selected.yieldGm2 ?? "—"} g/m²
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Type / Stock</dt>
                  <dd>
                    {selected.typeLabel ?? "—"} · {stockLabel(selected.stockStatus)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Terpenes</dt>
                  <dd>
                    {selected.dominantTerpene ?? "—"}
                    {selected.secondaryTerpene ? ` · ${selected.secondaryTerpene}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Flavors</dt>
                  <dd>
                    {[selected.flavor1, selected.flavor2].filter(Boolean).join(" · ") || "—"}
                  </dd>
                </div>
                {selected.istaStatus === "CONFIRMED" ? (
                  <div>
                    <dt className="text-xs text-slate-500">ISTA</dt>
                    <dd className="text-emerald-700">Confirmed for GACP licensing use</dd>
                  </div>
                ) : null}
              </dl>
              <Button
                type="button"
                className="mt-6 w-full bg-[#12463e] hover:bg-[#0f3a34]"
                onClick={() => void copyRef(selected)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy variety ref
              </Button>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
