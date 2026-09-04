/** Locked facts from Green Future GF/SSB/2026-0904 (4 Sep 2026, v1.2) */

export const GF_0904 = {
  refCode: "GF/SSB/2026-0904",
  issuedOn: "2026-09-04",
  version: "1.2",
  signatory: "Yevhen Karasov",
  packagingSamplesReceived: 12,
  quotationConfirmed: {
    strains: 5,
    pouchesPerStrain: 4,
    seedsPerPouch: 50,
    seedCount: 1_000,
    sealedUnits: 20,
    option: 1,
    coa: "official_coa_to_follow_later",
    currency: "THB",
    validityDays: 14,
    quotationDoesNotReserveStock: true,
  },
  attachedQuotationV01: {
    invoiceNo: "20102618",
    issuedOn: "2026-08-26",
    validUntil: "2026-09-09",
    isUpdatedOption1: false,
    stillIncludesAf102CoaLine: true,
    seedSubtotalThb: 44_210,
    coaSubtotalThb: 8_327.36,
    totalThb: 52_537.36,
    advanceThb: 26_268.68,
  },
  traceability: {
    stayPreviewUntilFirstLotImportedAndWrittenLiveApproval: true,
    publicAndRestrictedTiersAccepted: true,
    disclaimerPendingJuliaEnThCheck: true,
    firstShipment: "signed_lot_pdf_plus_csv",
    lotNumberMustMatch: ["pouch_label", "pdf", "import_file", "lookup"],
    restrictedAccess: "qr_token_and_authorised_account_if_practical",
    ssbMustNotModifyOrSignPrimaryPdf: true,
    auditLogYears: 3,
  },
  photos: {
    perImageWrittenApproval: true,
    recommendGfWatermark: true,
    itemCWording:
      "Seed production/processing area within the GACP-certified production facility.",
  },
  leadRegistration: {
    principleAccepted: true,
    carveOutPriorGfRelations: true,
    carveOutIndependentContactBeforeRegistration: true,
    complianceCommsWithSsbCopiedOk: true,
    detailsInDistributionAgreement: true,
    noBypassDuringProtectionPeriod: true,
  },
  labelV2: {
    regulatoryGateAccepted: true,
    sendPdfNotLoginLink: true,
    physicalLabelTestPendingPrintedMockup: true,
    dateField: "collection_only",
    version: "V.2.1",
  },
} as const;

/** SSB operating lock — 4 Sep 2026. See `lib/green-future-po-gate.ts`. */
export const SSB_GF_PO_LOCK = {
  noTransferUntilPackLabelAuthorityAndMarketReady: true,
  marketReadyRequires: [
    "traceability_system_ready",
    "b2b_gacp_page_with_conditions",
    "claim_verified_by_both_parties",
    "one_customer_order_on_pilot_strain",
  ],
  customerDepositThenGfAdvance: "50_then_50",
  poQtyCoveredByCustomerDeposits: true,
} as const;
