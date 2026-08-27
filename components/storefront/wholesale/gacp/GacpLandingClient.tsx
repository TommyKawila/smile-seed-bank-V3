"use client";

import { GacpHero } from "./GacpHero";
import { GacpTrustGrid } from "./GacpTrustGrid";
import { GacpFeaturedStrains } from "./GacpFeaturedStrains";
import { GacpInquiryForm } from "./GacpInquiryForm";
import { GfGateNoticeBanner } from "../GfGateNoticeBanner";
import { WholesaleComplianceNotice } from "../WholesaleComplianceNotice";

export function GacpLandingClient() {
  return (
    <div className="wholesale-b2b min-h-screen bg-white text-slate-900">
      <GacpHero />
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <GfGateNoticeBanner />
        </div>
      </div>
      <GacpTrustGrid />
      <WholesaleComplianceNotice />
      <GacpFeaturedStrains />
      <GacpInquiryForm />
    </div>
  );
}
