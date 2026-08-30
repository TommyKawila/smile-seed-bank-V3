/** Private partner PDFs — watermarked samples only via `/api/wholesale/lot-test-sample`. */
export const LOT_TEST_SAMPLE_FILES: Record<string, string> = {
  AF22: "SEED_COA_AF22_GF.pdf",
};

export function resolveLotTestSampleFile(code: string): string | null {
  return LOT_TEST_SAMPLE_FILES[code.trim().toUpperCase()] ?? null;
}
