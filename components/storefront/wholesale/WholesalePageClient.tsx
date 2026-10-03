"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { CurrencyToggle } from "./CurrencyToggle";
import { FloatingQuoteBar } from "./FloatingQuoteBar";
import { DepositOrderModal } from "./DepositOrderModal";
import { RfqModal } from "./RfqModal";
import {
  BulkOrderCalculator,
  type BulkOrderState,
} from "./BulkOrderCalculator";
import { GfGateNoticeBanner } from "./GfGateNoticeBanner";
import { GacpTrustGrid } from "./gacp/GacpTrustGrid";
import { WholesaleComplianceNotice } from "./WholesaleComplianceNotice";
import { TrustCompliance } from "./TrustCompliance";
import { WholesaleHero } from "./WholesaleHero";
import type { QuoteCartLine, RfqFormState, WholesaleCurrency } from "./types";
import type { WholesaleCatalogStrain } from "@/lib/wholesale-public-pricing";
import type { BulkPricingConfig } from "@/lib/wholesale-bulk-pricing";
import { isValidQty } from "@/lib/wholesale-bulk-pricing";
import { gfAcceptsPublicDeposits } from "@/lib/green-future-approved-marketing";
import { gfFulfillmentTier } from "@/lib/wholesale-fulfillment";

const emptyForm: RfqFormState = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  paymentMethod: "THB_BANK",
  coaMode: "none",
  buyExtraCoa: false,
  coaPackageA: 0,
  coaPackageB: 0,
  licenseStatus: "",
  licenseNumber: "",
  message: "",
};

export function WholesalePageClient({
  catalog,
  bulkPricing,
  heroImageUrl,
}: {
  catalog: WholesaleCatalogStrain[];
  bulkPricing: BulkPricingConfig;
  heroImageUrl: string;
}) {
  const { t } = useLanguage();
  const depositsOpen = gfAcceptsPublicDeposits();
  const [currency, setCurrency] = useState<WholesaleCurrency>("THB");
  const [cart, setCart] = useState<QuoteCartLine[]>([]);
  const [bulkState, setBulkState] = useState<BulkOrderState | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<RfqFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successQuoteNumber, setSuccessQuoteNumber] = useState<string | null>(
    null
  );
  const [successDepositThb, setSuccessDepositThb] = useState<number | null>(
    null
  );

  const openRfqFromCalc = (state: BulkOrderState) => {
    const validLines = state.lines.filter((l) =>
      isValidQty(l.quantity, bulkPricing, true)
    );
    if (!validLines.length) return;
    setBulkState(state);
    setCart(
      validLines.map((l) => ({
        strainId: l.strainId,
        name: l.name,
        quantity: l.quantity,
        fulfillmentTier:
          l.fulfillmentTier ?? gfFulfillmentTier(l.strainId),
      }))
    );
    setForm((f) => ({
      ...f,
      coaMode: state.coaMode,
      buyExtraCoa: state.buyExtra,
      coaPackageA: state.packageACount,
      coaPackageB: state.packageBCount,
    }));
    setSuccessQuoteNumber(null);
    setSuccessDepositThb(null);
    setSubmitError(null);
    setModalOpen(true);
  };

  const scrollToCatalog = () => {
    document.getElementById("rfq")?.scrollIntoView({ behavior: "smooth" });
  };

  const submitRfq = async () => {
    setSubmitError(null);
    if (!cart.length) {
      setSubmitError("Add at least one valid strain line.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wholesale/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          paymentMethod: form.paymentMethod,
          message: form.message,
          currency,
          coaMode: form.coaMode,
          buyExtraCoa: form.buyExtraCoa,
          coaPackageA: form.coaPackageA,
          coaPackageB: form.coaPackageB,
          licenseStatus: form.licenseStatus || undefined,
          licenseNumber: form.licenseNumber.trim() || undefined,
          lines: cart.map((l) => ({
            strainName: l.name,
            quantity: l.quantity,
          })),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        quoteNumber?: string;
      };
      if (!res.ok) {
        throw new Error(body.error || "Submit failed");
      }
      setSuccessQuoteNumber(body.quoteNumber ?? "—");
      setCart([]);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit RFQ"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitDeposit = async () => {
    setSubmitError(null);
    if (!cart.length) {
      setSubmitError("Add at least one valid strain line.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wholesale/deposit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          message: form.message,
          coaMode: form.coaMode,
          buyExtraCoa: form.buyExtraCoa,
          coaPackageA: form.coaPackageA,
          coaPackageB: form.coaPackageB,
          licenseStatus: form.licenseStatus || undefined,
          licenseNumber: form.licenseNumber.trim() || undefined,
          lines: cart.map((l) => ({
            varietyCode: l.strainId,
            strainName: l.name,
            quantity: l.quantity,
          })),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        reservationNumber?: string;
        depositThb?: number;
      };
      if (!res.ok) {
        throw new Error(body.error || "Submit failed");
      }
      setSuccessQuoteNumber(body.reservationNumber ?? "—");
      setSuccessDepositThb(body.depositThb ?? null);
      setCart([]);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit reservation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wholesale-b2b min-h-screen bg-white text-slate-900">
      <WholesaleHero
        onRequestCatalog={scrollToCatalog}
        heroImageUrl={heroImageUrl}
      />

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <GfGateNoticeBanner />
        </div>
      </div>

      <GacpTrustGrid />

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm font-medium text-slate-600">
            {t(
              `ออเดอร์ขายส่ง · คำนวณราคา THB แบบสด (EUR ≈ THB ÷ ${bulkPricing.eurThb})`,
              `Bulk order · live THB calculator (EUR ≈ THB ÷ ${bulkPricing.eurThb})`
            )}
          </p>
          <CurrencyToggle currency={currency} onChange={setCurrency} />
        </div>
      </div>

      <BulkOrderCalculator
        catalog={catalog}
        config={bulkPricing}
        currency={currency}
        pilotMode
        onStateChange={setBulkState}
        onRequestQuote={openRfqFromCalc}
      />
      <TrustCompliance />
      <WholesaleComplianceNotice />

      <FloatingQuoteBar
        itemCount={cart.length || (bulkState?.lines.length ?? 0)}
        onOpen={() => {
          if (bulkState) openRfqFromCalc(bulkState);
          else document.getElementById("rfq")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {depositsOpen ? (
        <DepositOrderModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          lines={cart}
          form={form}
          onFormChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          onRemoveLine={(strainId) =>
            setCart((prev) => prev.filter((l) => l.strainId !== strainId))
          }
          onSubmit={submitDeposit}
          submitting={submitting}
          submitError={submitError}
          successReservationNumber={successQuoteNumber}
          successDepositThb={successDepositThb}
          bulkPricing={bulkPricing}
        />
      ) : (
        <RfqModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          currency={currency}
          lines={cart}
          form={form}
          onFormChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          onRemoveLine={(strainId) =>
            setCart((prev) => prev.filter((l) => l.strainId !== strainId))
          }
          onSubmit={submitRfq}
          submitting={submitting}
          submitError={submitError}
          successQuoteNumber={successQuoteNumber}
          bulkPricing={bulkPricing}
          pilotMode
        />
      )}
    </div>
  );
}
