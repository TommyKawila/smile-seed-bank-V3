/** Supabase asset handshake hints for next/image remote URLs (server-only helper for root layout head). */
export function SupabaseStoragePreconnect() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  let origin: string;
  try {
    origin = new URL(raw).origin;
  } catch {
    return null;
  }
  return (
    <>
      <link rel="preconnect" href={origin} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={origin} />
    </>
  );
}
