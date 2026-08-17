import {
  B2B_BREEDER_SG,
  B2B_BREEDER_SGF,
  B2B_KNOWN_BREEDERS,
  type B2BQuoteLineItem,
} from "@/types/b2b-quote";

const SEP = " · ";

/** Invoice / PDF / email display: strain then breeder. */
export function formatB2BStrainLabel(strainName: string, breederName?: string | null): string {
  const strain = strainName.trim();
  const breeder = (breederName ?? "").trim();
  if (!strain) return "";
  if (!breeder) return strain;
  if (strain.endsWith(`${SEP}${breeder}`)) return strain;
  return `${strain}${SEP}${breeder}`;
}

export function parseB2BStrainLabel(stored: string): { strainName: string; breederName: string } {
  const raw = stored.trim();
  if (!raw) return { strainName: "", breederName: "" };
  for (const breeder of B2B_KNOWN_BREEDERS) {
    const suffix = `${SEP}${breeder}`;
    if (raw.endsWith(suffix)) {
      return { strainName: raw.slice(0, -suffix.length).trim(), breederName: breeder };
    }
  }
  const idx = raw.lastIndexOf(SEP);
  if (idx > 0) {
    const maybeBreeder = raw.slice(idx + SEP.length).trim();
    if (maybeBreeder && maybeBreeder.length <= 40 && !maybeBreeder.includes("€")) {
      return { strainName: raw.slice(0, idx).trim(), breederName: maybeBreeder };
    }
  }
  return { strainName: raw, breederName: "" };
}

export function normalizeBreederLabel(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  if (lower === "green-future" || lower === "green future" || lower === "sgf seeds" || lower === "sgf") {
    return B2B_BREEDER_SGF;
  }
  if (lower === "seeds-genetics" || lower === "seeds genetics" || lower === "sg") {
    return B2B_BREEDER_SG;
  }
  return s;
}

export function lineItemDisplayName(it: Pick<B2BQuoteLineItem, "strainName" | "breederName">): string {
  return formatB2BStrainLabel(it.strainName, it.breederName);
}
