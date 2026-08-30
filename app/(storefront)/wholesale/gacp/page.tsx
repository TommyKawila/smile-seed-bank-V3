"use client";

import { useEffect } from "react";

/** Legacy URL — canonical wholesale page is /wholesale#documents */
export default function GacpWholesaleRedirectPage() {
  useEffect(() => {
    window.location.replace("/wholesale#documents");
  }, []);

  return null;
}
