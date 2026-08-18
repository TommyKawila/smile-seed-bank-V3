import { B2B_BREEDER_SG, B2B_BREEDER_SGF, type B2BQuoteLineItem } from "@/types/b2b-quote";

export type B2BQuoteChannel = "gf" | "sg";

export function parseB2BQuoteChannel(raw: string | null | undefined): B2BQuoteChannel | null {
  if (raw === "gf" || raw === "sg") return raw;
  return null;
}

export function channelBreeder(channel: B2BQuoteChannel): string {
  return channel === "gf" ? B2B_BREEDER_SGF : B2B_BREEDER_SG;
}

export function draftHasMixedBreeders(items: Pick<B2BQuoteLineItem, "breederName">[]): boolean {
  const breeders = new Set(
    items
      .map((it) => (it.breederName ?? "").trim())
      .filter(Boolean)
  );
  return breeders.size > 1;
}

export function draftViolatesChannel(
  items: Pick<B2BQuoteLineItem, "breederName">[],
  channel: B2BQuoteChannel | null
): string | null {
  if (!channel) return null;
  const allowed = channelBreeder(channel);
  const bad = items.filter((it) => {
    const b = (it.breederName ?? "").trim();
    return b && b !== allowed;
  });
  if (bad.length) {
    return channel === "gf"
      ? "GF channel: remove Seeds Genetics lines before send/PDF."
      : "SG channel: remove SGF Seeds lines before send/PDF.";
  }
  if (draftHasMixedBreeders(items)) {
    return "Mixed breeders on one quote — split by channel.";
  }
  return null;
}

export function pasteTextHasWrongBreeder(text: string, channel: B2BQuoteChannel): boolean {
  const lower = text.toLowerCase();
  if (channel === "gf") {
    return lower.includes("seeds genetics");
  }
  return lower.includes("sgf seeds") || lower.includes("green future");
}
