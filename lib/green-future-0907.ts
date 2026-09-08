/** Locked facts from Green Future GF/SSB/2026-0907 (7 Sep 2026, v1.2) */

export const GF_0907 = {
  refCode: "GF/SSB/2026-0907",
  issuedOn: "2026-09-07",
  version: "1.2",
  signatory: "Yevhen Karasov",
  labelV21: {
    approved: true,
    sizeMm: "55×55",
    font: "Noto Sans Thai Condensed",
    physicalPrintTestSatisfactory: true,
    variableFields: ["variety", "lotNo", "testDate", "expiryDate"],
    readyForNextStage: true,
  },
  traceability: {
    approvedExceptOneWordingChange: true,
    oldWording:
      "Seeds are producer-packed and sealed (SGF SEEDS) — Smile Seed Bank does not open, repack, or relabel without prior written consent.",
    newWording:
      "Seeds are packed and sealed by SGF SEEDS, a licensed collector of controlled seeds for trade. Smile Seed Bank does not open, repack, or relabel them without prior written consent.",
    stayPreviewUntilFirstLotAndWrittenLive: true,
  },
  quotationOption1: {
    invoiceNo: "20102618",
    issuedOn: "2026-08-26",
    validUntil: "2026-09-09",
    isUpdatedOption1: true,
    strains: 5,
    seedsPerStrain: 200,
    pouchesPerStrain: 4,
    seedsPerPouch: 50,
    seedCount: 1_000,
    sealedUnits: 20,
    pricePerSeedThb: 44.21,
    seedSubtotalThb: 44_210,
    coaIncluded: false,
    retailPackagingUnits: 20,
    retailPackagingFree: true,
    advancePct: 50,
    advanceThb: 22_105,
    seedsFirstCoaLater: true,
    eurThbRate: 38.44,
    eurPerSeed: 1.15,
    /** GF verbal/LINE 8 Sep 2026 — new seed price after validity, not a simple extension */
    priceRevisedAfterExpiry: true,
    priceRevisionNotedOn: "2026-09-08",
  },
  photos: {
    previouslyProvidedWithWatermark: true,
    perImageWrittenApproval: true,
    receivedBySsbOn: "2026-09-08",
    count: 6,
  },
  gacpConsultation: {
    ssbMayProceed: true,
    sendAuthorityResponseToGf: true,
    /** Pouches + labels for seal test are at GF — SSB needs empty labelled mock pouches back for authority visit */
    labelledMockPouchReturn: {
      requestedOn: "2026-09-08",
      seedsInside: false,
      purpose: "Chiang Mai authority GACP cultivation-permit consultation",
      labelVersion: "V.2.1",
      pouchSource: "SSB sample pouches at GF for heat-seal test",
    },
  },
} as const;

export const GF_LABELLED_MOCK_POUCH_REQUEST_EN =
  "Please return to Smile Seed Bank a small set of mock-up pouches using our sample pouches, with Label V.2.1 printed and applied at the approved 55 × 55 mm position after your heat-seal test. The pouches do not need to contain real seeds — empty mock-ups are sufficient. We need these physical samples for consultation with the relevant authority on grower GACP cultivation applications.";

export const GF_LABELLED_MOCK_POUCH_REQUEST_TH =
  "กรุณาส่งคืน Smile Seed Bank ซอง mock-up จำนวนเล็กน้อย โดยใช้ซองตัวอย่างที่เราส่งไป ติดฉลาก V.2.1 ที่พิมพ์และวางตำแหน่ง 55 × 55 มม. ตามที่อนุมัติ หลังทดสอบ heat seal ด้านในไม่จำเป็นต้องใส่เมล็ดจริง — ซองเปล่าสำหรับ mock-up เพียงพอ เราต้องใช้ตัวอย่างจริงในการสอบถามหน่วยงานเรื่องการขออนุญาตปลูกในกรอบ GACP ของผู้ปลูก";
