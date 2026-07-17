import type { Metadata } from "next";
import { LineLiffEntryClient } from "@/components/storefront/LineLiffEntryClient";
import { getLiffId, LIFF_DEFAULT_REDIRECT } from "@/lib/line-liff-config";
import { safeNextPath } from "@/lib/safe-redirect-path";

export const metadata: Metadata = {
  title: "เข้าสู่ร้าน | Smile Seed Bank",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LineLiffEntryPage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : undefined;
  const nextPath = safeNextPath(firstParam(sp?.next) ?? null) ?? LIFF_DEFAULT_REDIRECT;

  return <LineLiffEntryClient liffId={getLiffId()} nextPath={nextPath} />;
}
