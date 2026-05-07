/**
 * Spreadsheet parsing for admin bulk-seeds only.
 * PapaParse and ExcelJS are loaded dynamically so they are not bundled with unrelated routes.
 */
import { matrixToParsedRows, recordsToParsedRows, type ParsedBulkRow } from "@/lib/bulk-seeds/parse-import";

export type { ParsedBulkRow };

export async function parseBulkSeedSpreadsheetFile(file: File): Promise<ParsedBulkRow[]> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "csv") {
    const Papa = (await import("papaparse")).default;
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.replace(/^\ufeff/, "").trim(),
        complete: (res) => {
          const recs = (res.data ?? []).filter((r) =>
            Object.values(r).some((v) => String(v ?? "").trim() !== "")
          ) as Record<string, unknown>[];
          resolve(recordsToParsedRows(recs));
        },
        error: (err) => reject(err),
      });
    });
  }

  if (ext === "xlsx" || ext === "xlsm") {
    const ExcelJS = (await import("exceljs")).default;
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const sheet = wb.worksheets[0];
    if (!sheet) return [];
    const matrix: string[][] = [];

    function cellStr(v: unknown): string {
      if (v == null) return "";
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      if (typeof v === "string") return v;
      if (typeof v === "object" && v !== null) {
        const o = v as Record<string, unknown>;
        if (typeof o.text === "string") return o.text;
        if (typeof o.result === "number") return String(o.result);
        if (typeof o.result === "string") return o.result;
      }
      return "";
    }

    sheet.eachRow({ includeEmpty: true }, (row) => {
      const raw = row.values as unknown[];
      if (!raw?.length) return;
      matrix.push(raw.slice(1).map(cellStr));
    });
    if (matrix.length < 2) return [];
    const headers = matrix[0].map((h) => String(h ?? ""));
    return matrixToParsedRows(headers, matrix.slice(1));
  }

  throw new Error("Use .csv or .xlsx");
}
