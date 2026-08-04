"use client";

import { useCallback, useState } from "react";
import { CurrencyToggle } from "./CurrencyToggle";
import { FloatingQuoteBar } from "./FloatingQuoteBar";
import { RfqModal } from "./RfqModal";
import { StrainPricingGrid } from "./StrainPricingGrid";
import { TrustCompliance } from "./TrustCompliance";
import { WholesaleHero } from "./WholesaleHero";
import type { QuoteCartLine, RfqFormState, WholesaleCurrency } from "./types";
import { WHOLESALE_PUBLIC_MOQ } from "@/lib/wholesale-public-pricing";

const emptyForm: RfqFormState = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  paymentMethod: "THB_BANK",
  requireGacp: false,
  message: "",
};

export function WholesalePageClient() {
  const [currency, setCurrency] = useState<WholesaleCurrency>("THB");
  const [cart, setCart] = useState<QuoteCartLine[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<RfqFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successQuoteNumber, setSuccessQuoteNumber] = useState<string | null>(
    null
  );

  const addToQuote = useCallback(
    (strainId: string, name: string, quantity: number) => {
      const qty = Math.max(WHOLESALE_PUBLIC_MOQ, Math.floor(quantity));
      setCart((prev) => {
        const idx = prev.findIndex((l) => l.strainId === strainId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: qty };
          return next;
        }
        return [...prev, { strainId, name, quantity: qty }];
      });
      setModalOpen(false);
      setSuccessQuoteNumber(null);
    },
    []
  );

  const openRfq = () => {
    setSuccessQuoteNumber(null);
    setSubmitError(null);
    setModalOpen(true);
  };

  const scrollToCatalog = () => {
    document.getElementById("rfq")?.scrollIntoView({ behavior: "smooth" });
  };

  const submitRfq = async () => {
    setSubmitError(null);
    if (!cart.length) {
      setSubmitError("Add at least one strain to your quote.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wholesale/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          currency,
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

  return (
    <div className="wholesale-b2b min-h-screen bg-white text-slate-900">
      <WholesaleHero onRequestCatalog={scrollToCatalog} />

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm font-medium text-slate-600">
            Catalog · interactive tier calculator
          </p>
          <CurrencyToggle currency={currency} onChange={setCurrency} />
        </div>
      </div>

      <StrainPricingGrid currency={currency} onAdd={addToQuote} />
      <TrustCompliance />

      <FloatingQuoteBar itemCount={cart.length} onOpen={openRfq} />

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
      />
    </div>
  );
}
