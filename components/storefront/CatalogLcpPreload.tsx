/**
 * Single LCP preload for catalog grid (must match ProductCard listing thumb URL).
 */
export function CatalogLcpPreload({ href }: { href: string | null | undefined }) {
  if (!href) return null;
  return <link rel="preload" as="image" href={href} fetchPriority="high" />;
}
