"use client";

/**
 * Inventory price list PDF — no photo column; 535pt grid (4×65 packs).
 */

import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";

export type PackFooterTotalsPdf = {
  totalStrains: number;
  totalStockAll: number;
  grandCostValue: number;
  grandPriceValue: number;
  perPackStock: Record<number, number>;
  perPackCostValue: Record<number, number>;
  perPackPriceValue: Record<number, number>;
};

export type InventoryPdfRowData = {
  productId: number;
  index: number;
  name: string;
  geneticsLabel: string;
  categoryLabel: string;
  byPack: Record<number, { stock: number; cost: number; price: number }>;
};

export type InventoryPdfDocumentProps = {
  rows: InventoryPdfRowData[];
  breederName: string;
  logoMainSrc?: string | null;
  breederLogoSrc?: string | null;
  websiteLine?: string;
  qrCodeDataUri?: string | null;
  packs: number[];
  showCost: boolean;
  showFooter: boolean;
  footerTotals: PackFooterTotalsPdf;
};

const PAGE_MARGIN_H = 30;

/** 20+145+45+65 + n×65 = 275 + n×65 → 4 packs = 535pt */
const COL = {
  NO: 20,
  NAME: 145,
  CAT: 45,
  GEN: 65,
  PACK: 65,
  STK: 25,
  PRC: 40,
} as const;

const MARGIN = PAGE_MARGIN_H;
const ROW_PAD_V = 2;
const V_RULE = 0.5;
const RULE_COLOR = "#e5e7eb";

const TEXT_MAIN = "#374151";
const PRICE_GREEN = "#047857";
const OUT_STOCK = "#9ca3af";

function tableInnerWidthPt(packCount: number): number {
  return COL.NO + COL.NAME + COL.CAT + COL.GEN + packCount * COL.PACK;
}

let fontReady = false;

export function ensurePdfPromptFont(): void {
  if (typeof window === "undefined" || fontReady) return;
  try {
    Font.register({
      family: "Prompt",
      src: `${window.location.origin}/fonts/Prompt-Regular.ttf`,
    });
    fontReady = true;
  } catch {
    fontReady = true;
  }
}

/** Must clear fixed block (fixedTop paddingBottom 0). */
const FIXED_TOP_PT = 222;

const borderRight = { borderRightWidth: V_RULE, borderRightColor: RULE_COLOR };

const pdf = StyleSheet.create({
  page: {
    paddingTop: FIXED_TOP_PT,
    paddingBottom: 40,
    paddingLeft: MARGIN,
    paddingRight: MARGIN,
    fontFamily: "Prompt",
    fontSize: 7,
    color: TEXT_MAIN,
  },
  fixedTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingLeft: MARGIN,
    paddingRight: MARGIN,
    paddingTop: MARGIN,
    paddingBottom: 0,
    backgroundColor: "#fff",
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerCenter: { alignItems: "center", justifyContent: "center" },
  headerSide: { width: 45 },
  qrImg: { width: 45, height: 45 },
  logo: { width: 56, height: 28, objectFit: "contain", marginBottom: 4 },
  brandUrl: { fontSize: 7, color: "#64748b", marginTop: 2 },
  breederBlock: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10 },
  breederLogo: { width: 32, height: 18, objectFit: "contain", marginRight: 6 },
  breederName: { fontSize: 8, color: "#334155", fontWeight: "bold" },
  greenDivider: { height: 2, backgroundColor: "#166534", marginTop: 10, marginBottom: 8 },
  docTitle: { fontSize: 9, fontWeight: "bold", color: "#334155", textAlign: "center", marginBottom: 6 },
  tableHeader: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    backgroundColor: "#eefcf4",
    borderBottomWidth: 2,
    borderBottomColor: "#166534",
    paddingVertical: ROW_PAD_V,
    marginBottom: 0,
    marginTop: 0,
  },
  th: { fontSize: 7, fontWeight: "bold", color: "#065f46" },
  td: { fontSize: 7, color: TEXT_MAIN },
  tbodyRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    borderBottomWidth: V_RULE,
    borderBottomColor: RULE_COLOR,
    paddingVertical: ROW_PAD_V,
    minHeight: 12,
  },
  zebra: { backgroundColor: "#f9fafb" },
  packTitle: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#047857",
    textAlign: "center",
    paddingVertical: 2,
    borderBottomWidth: V_RULE,
    borderBottomColor: "#d1fae5",
    width: "100%",
  },
  packSubRow: { flexDirection: "row", width: COL.PACK, flexWrap: "nowrap" },
  packHdrStk: {
    width: COL.STK,
    borderRightWidth: V_RULE,
    borderRightColor: RULE_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  packHdrPrc: {
    width: COL.PRC,
    justifyContent: "center",
    alignItems: "center",
  },
  subTh: { fontSize: 6, color: "#64748b", textAlign: "center", width: "100%" },
  packDataInner: {
    flexDirection: "row",
    width: COL.PACK,
    flexWrap: "nowrap",
    alignItems: "center",
  },
  stkCol: {
    width: COL.STK,
    borderRightWidth: V_RULE,
    borderRightColor: RULE_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  stkColOut: {
    width: COL.STK,
    borderRightWidth: V_RULE,
    borderRightColor: RULE_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  prcCol: { width: COL.PRC, justifyContent: "center", alignItems: "center" },
  tdNum: { fontSize: 7, color: TEXT_MAIN, textAlign: "center", width: "100%" },
  tdOut: { fontSize: 7, color: OUT_STOCK, textAlign: "center", width: "100%" },
  tdPrice: { fontSize: 7, fontWeight: "bold", color: PRICE_GREEN, textAlign: "center", width: "100%" },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderWidth: V_RULE,
    borderColor: RULE_COLOR,
    marginTop: 0,
    paddingTop: 0,
    paddingBottom: 4,
    paddingHorizontal: 6,
    minHeight: 16,
  },
  catText: { fontSize: 8, fontWeight: "bold", color: "#334155" },
  summary: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#f1f5f9",
    borderWidth: V_RULE,
    borderColor: RULE_COLOR,
  },
  sumTitle: { fontSize: 8, fontWeight: "bold", marginBottom: 4, color: "#0f172a" },
  sumLine: { fontSize: 7, color: "#334155", marginBottom: 2 },
  pageNum: { position: "absolute", bottom: 28, right: MARGIN, fontSize: 8, color: "#64748b" },
});

function cellStyle(
  width: number,
  opts: { last: boolean; justify?: "center" | "flex-start" }
): object[] {
  const centered = opts.justify === "center";
  const base: object = {
    width,
    justifyContent: "center",
    alignItems: centered ? "center" : "flex-start",
    paddingLeft: centered ? 0 : 3,
    paddingRight: 2,
  };
  return [base, !opts.last ? borderRight : {}];
}

function PackHeader({ pack, last }: { pack: number; last: boolean }): ReactElement {
  const label = `${pack} Seed${pack > 1 ? "s" : ""}`;
  return (
    <View style={[{ width: COL.PACK }, !last ? borderRight : {}]} wrap={false}>
      <Text style={pdf.packTitle}>{label}</Text>
      <View style={pdf.packSubRow}>
        <View style={pdf.packHdrStk}>
          <Text style={pdf.subTh}>Stk</Text>
        </View>
        <View style={pdf.packHdrPrc}>
          <Text style={pdf.subTh}>Price</Text>
        </View>
      </View>
    </View>
  );
}

function PackData({ stock, price, last }: { stock: number; price: number; last: boolean }): ReactElement {
  const stockNode =
    stock <= 0 ? (
      <Text style={pdf.tdOut}>หมด</Text>
    ) : (
      <Text style={pdf.tdNum}>{stock}</Text>
    );
  return (
    <View style={[pdf.packDataInner, !last ? borderRight : {}]} wrap={false}>
      <View style={stock <= 0 ? pdf.stkColOut : pdf.stkCol}>{stockNode}</View>
      <View style={pdf.prcCol}>
        <Text style={pdf.tdPrice}>{price > 0 ? price.toLocaleString("th-TH") : "—"}</Text>
      </View>
    </View>
  );
}

function TableHeaderRow({ packs, totalWidth }: { packs: number[]; totalWidth: number }): ReactElement {
  const nPack = packs.length;
  const genLast = nPack === 0;
  return (
    <View style={[pdf.tableHeader, { width: totalWidth }]} wrap={false}>
      <View style={cellStyle(COL.NO, { last: false, justify: "center" })}>
        <Text style={[pdf.th, { textAlign: "center", width: "100%" }]}>#</Text>
      </View>
      <View style={cellStyle(COL.NAME, { last: false })}>
        <Text style={pdf.th}>Name / ชื่อ</Text>
      </View>
      <View style={cellStyle(COL.CAT, { last: false })}>
        <Text style={pdf.th}>Category</Text>
      </View>
      <View style={cellStyle(COL.GEN, { last: genLast })}>
        <Text style={pdf.th}>Genetic Type</Text>
      </View>
      {packs.map((p, i) => (
        <PackHeader key={p} pack={p} last={i === nPack - 1} />
      ))}
    </View>
  );
}

function DataLine({
  row,
  packs,
  zebra,
  totalWidth,
}: {
  row: InventoryPdfRowData;
  packs: number[];
  zebra: boolean;
  totalWidth: number;
}): ReactElement {
  const nPack = packs.length;
  const genLast = nPack === 0;
  return (
    <View
      wrap={false}
      style={[pdf.tbodyRow, { width: totalWidth }, zebra ? pdf.zebra : { backgroundColor: "#ffffff" }]}
    >
      <View style={cellStyle(COL.NO, { last: false, justify: "center" })}>
        <Text style={[pdf.td, { textAlign: "center", width: "100%" }]}>{row.index}</Text>
      </View>
      <View style={cellStyle(COL.NAME, { last: false })}>
        <Text style={pdf.td}>{row.name}</Text>
      </View>
      <View style={cellStyle(COL.CAT, { last: false })}>
        <Text style={[pdf.td, { fontWeight: "bold" }]}>{row.categoryLabel}</Text>
      </View>
      <View style={cellStyle(COL.GEN, { last: genLast })}>
        <Text style={pdf.td}>{row.geneticsLabel || "—"}</Text>
      </View>
      {packs.map((p, i) => {
        const c = row.byPack[p] ?? { stock: 0, cost: 0, price: 0 };
        return <PackData key={p} stock={c.stock} price={c.price} last={i === nPack - 1} />;
      })}
    </View>
  );
}

function CategoryLine({ label, widthPt }: { label: string; widthPt: number }): ReactElement {
  return (
    <View wrap={false} style={[pdf.catRow, { width: widthPt }]}>
      <Text style={pdf.catText}>{label}</Text>
    </View>
  );
}

function FooterBlock({
  packs,
  showCost,
  ft,
}: {
  packs: number[];
  showCost: boolean;
  ft: PackFooterTotalsPdf;
}): ReactElement {
  return (
    <View style={pdf.summary} wrap={false}>
      <Text style={pdf.sumTitle}>รวมทั้งหมด (Total)</Text>
      <Text style={pdf.sumLine}>
        สายพันธุ์ {ft.totalStrains} · สต็อกรวม {ft.totalStockAll}
      </Text>
      {showCost ? (
        <Text style={pdf.sumLine}>มูลค่าทุนรวม ฿{ft.grandCostValue.toLocaleString("th-TH")}</Text>
      ) : null}
      <Text style={[pdf.sumLine, { color: PRICE_GREEN }]}>
        มูลค่าขายรวม ฿{ft.grandPriceValue.toLocaleString("th-TH")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
        {packs.map((p) => (
          <Text key={p} style={{ fontSize: 6, color: "#475569", width: "24%", marginBottom: 2 }}>
            {p}pk Stk {ft.perPackStock[p] ?? 0}
            {showCost ? ` · ฿${(ft.perPackCostValue[p] ?? 0).toLocaleString("th-TH")}` : ""} · ฿
            {(ft.perPackPriceValue[p] ?? 0).toLocaleString("th-TH")}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function InventoryPdfDocument({
  rows,
  breederName,
  logoMainSrc,
  breederLogoSrc,
  websiteLine = "www.smileseedbank.com",
  qrCodeDataUri,
  packs,
  showCost: _showCost,
  showFooter,
  footerTotals,
}: InventoryPdfDocumentProps): ReactElement {
  const tw = tableInnerWidthPt(packs.length);
  const body: ReactElement[] = [];
  let prev: string | undefined;
  let z = 0;
  for (const row of rows) {
    const ck = (row.categoryLabel || "").trim() || "—";
    if (prev !== ck) {
      body.push(<CategoryLine key={`c-${row.productId}-${ck}`} label={ck} widthPt={tw} />);
      prev = ck;
    }
    body.push(
      <DataLine
        key={row.productId}
        row={row}
        packs={packs}
        zebra={z % 2 === 0}
        totalWidth={tw}
      />
    );
    z += 1;
  }

  return (
    <Document title={`${breederName} — Inventory`} author="Smile Seed Bank">
      <Page size="A4" style={pdf.page} wrap>
        <View fixed style={pdf.fixedTop}>
          <View style={[pdf.headerRow, { width: tw }]}>
            <View style={pdf.headerSide} />
            <View style={[pdf.headerCenter, { width: tw - 90 }]}>
              {logoMainSrc ? <Image src={logoMainSrc} style={pdf.logo} /> : null}
              <Text style={{ fontSize: 12, fontWeight: "bold", color: "#047857" }}>Smile Seed Bank</Text>
              <Text style={pdf.brandUrl}>{websiteLine}</Text>
            </View>
            <View style={pdf.headerSide}>
              {qrCodeDataUri ? <Image src={qrCodeDataUri} style={pdf.qrImg} /> : null}
            </View>
          </View>
          <View style={pdf.breederBlock}>
            {breederLogoSrc ? <Image src={breederLogoSrc} style={pdf.breederLogo} /> : null}
            <Text style={pdf.breederName}>{breederName}</Text>
          </View>
          <View style={[pdf.greenDivider, { width: tw }]} />
          <Text style={pdf.docTitle}>Price list / รายการสต็อก</Text>
          <TableHeaderRow packs={packs} totalWidth={tw} />
        </View>

        <View style={{ flexDirection: "column", width: tw, marginTop: 0 }}>{body}</View>

        {showFooter && rows.length > 0 ? (
          <FooterBlock packs={packs} showCost={_showCost} ft={footerTotals} />
        ) : null}

        <Text style={pdf.pageNum} fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </Page>
    </Document>
  );
}
