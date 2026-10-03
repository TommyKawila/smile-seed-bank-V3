"use client";

import { useEffect } from "react";

/** Legacy URL — canonical wholesale page is /wholesale */
export default function GacpWholesaleRedirectPage() {
  useEffect(() => {
    window.location.replace("/wholesale");
  }, []);

  return null;
}
