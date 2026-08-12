"use client";

import { GacpHero } from "./GacpHero";
import { GacpTrustGrid } from "./GacpTrustGrid";
import { GacpFeaturedStrains } from "./GacpFeaturedStrains";
import { GacpInquiryForm } from "./GacpInquiryForm";

export function GacpLandingClient() {
  return (
    <div className="wholesale-b2b min-h-screen bg-white text-slate-900">
      <GacpHero />
      <GacpTrustGrid />
      <GacpFeaturedStrains />
      <GacpInquiryForm />
    </div>
  );
}
