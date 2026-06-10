import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  isPaymentApprovalEligibleOrder,
  isSlipUploadEligibleOrder,
} from "@/lib/order-status-guards";
import {
  createReceiptDownloadQuery,
  verifyReceiptDownloadQuery,
} from "@/lib/receipt-download-token";

test("receipt download tokens fail closed when secret is missing", () => {
  const previous = process.env.RECEIPT_DOWNLOAD_SECRET;
  delete process.env.RECEIPT_DOWNLOAD_SECRET;
  try {
    const orderNumber = "SSB-1234";
    const e = String(Math.floor(Date.now() / 1000) + 3600);
    const t = createHmac("sha256", "ssb-receipt-token-v1-set-RECEIPT_DOWNLOAD_SECRET")
      .update(`${orderNumber}:${e}`)
      .digest("hex");

    assert.deepEqual(createReceiptDownloadQuery(orderNumber), { t: "", e: "" });
    assert.equal(verifyReceiptDownloadQuery(orderNumber, t, e), false);
  } finally {
    if (previous === undefined) delete process.env.RECEIPT_DOWNLOAD_SECRET;
    else process.env.RECEIPT_DOWNLOAD_SECRET = previous;
  }
});

test("receipt download tokens verify only with configured secret", () => {
  const previous = process.env.RECEIPT_DOWNLOAD_SECRET;
  process.env.RECEIPT_DOWNLOAD_SECRET = "configured-secret";
  try {
    const orderNumber = "SSB-5678";
    const query = createReceiptDownloadQuery(orderNumber);
    assert.ok(query.t);
    assert.ok(query.e);
    assert.equal(verifyReceiptDownloadQuery(orderNumber, query.t, query.e), true);
  } finally {
    if (previous === undefined) delete process.env.RECEIPT_DOWNLOAD_SECRET;
    else process.env.RECEIPT_DOWNLOAD_SECRET = previous;
  }
});

test("slip upload guard rejects terminal and already-paid orders", () => {
  assert.equal(isSlipUploadEligibleOrder("PENDING", "pending"), true);
  assert.equal(isSlipUploadEligibleOrder("PENDING_INFO", "pending"), true);
  assert.equal(isSlipUploadEligibleOrder("PENDING_PAYMENT", "unpaid"), true);
  assert.equal(isSlipUploadEligibleOrder("CANCELLED", "pending"), false);
  assert.equal(isSlipUploadEligibleOrder("VOIDED", "pending"), false);
  assert.equal(isSlipUploadEligibleOrder("PENDING", "paid"), false);
});

test("payment approval guard accepts only unpaid awaiting-verification orders", () => {
  assert.equal(isPaymentApprovalEligibleOrder("AWAITING_VERIFICATION", "pending"), true);
  assert.equal(isPaymentApprovalEligibleOrder("AWAITING_VERIFICATION", "paid"), false);
  assert.equal(isPaymentApprovalEligibleOrder("SHIPPED", "paid"), false);
  assert.equal(isPaymentApprovalEligibleOrder("COMPLETED", "paid"), false);
  assert.equal(isPaymentApprovalEligibleOrder("PENDING", "pending"), false);
});
