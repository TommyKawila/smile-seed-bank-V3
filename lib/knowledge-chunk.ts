export type ChunkOptions = {
  size?: number;
  overlap?: number;
};

/**
 * Split text into ~800–1000 character chunks with small overlap.
 * Defaults: size 900, overlap 100.
 */
export function chunkText(
  text: string,
  opts: ChunkOptions = {}
): string[] {
  const size = opts.size ?? 900;
  const overlap = opts.overlap ?? 100;
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];
  if (cleaned.length <= size) return [cleaned];

  const chunks: string[] = [];
  let start = 0;
  while (start < cleaned.length) {
    let end = Math.min(start + size, cleaned.length);
    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end);
      const breakAt = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf(" ")
      );
      if (breakAt > size * 0.5) {
        end = start + breakAt + 1;
      }
    }
    const piece = cleaned.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= cleaned.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}
