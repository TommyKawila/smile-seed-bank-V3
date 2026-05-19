"use client";

/**
 * @deprecated Prefer server composition: `HomePageHeroClient` (SSR) + `dynamic(..., { ssr: false })` `HomePageBelowFoldHost` from `home-stream.tsx`.
 */
export { HomePageHeroClient } from "@/components/storefront/HomePageHeroClient";
export { HomePageBelowFoldHost } from "@/components/storefront/HomePageBelowFoldHost";
