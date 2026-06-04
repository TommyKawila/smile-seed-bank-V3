import { isStorefrontCatalogPath } from "@/lib/catalog-navigation";

const STORAGE_KEY = "ssb:catalog-return";

/** Persist last catalog list URL for product «back» (SPA-safe). */
export function saveCatalogReturnPath(pathWithSearch: string): void {
  if (typeof sessionStorage === "undefined") return;
  const path = pathWithSearch.trim();
  if (!path || !path.startsWith("/")) return;
  const pathname = path.split("?")[0]?.split("#")[0] ?? "";
  if (!isStorefrontCatalogPath(pathname)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    /* quota / private mode */
  }
}

export function clearCatalogReturnPath(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Call before navigating to PDP from a catalog grid (SPA-safe). */
export function touchCatalogReturnFromWindow(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (!isStorefrontCatalogPath(pathname)) return;
  saveCatalogReturnPath(search ? `${pathname}${search}` : pathname);
}

export function readCatalogReturnPath(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)?.trim();
    if (!raw || !raw.startsWith("/")) return null;
    const pathname = raw.split("?")[0]?.split("#")[0] ?? "";
    if (!isStorefrontCatalogPath(pathname)) return null;
    return raw;
  } catch {
    return null;
  }
}

function isBlogArticlePath(pathname: string): boolean {
  return pathname === "/blog" || pathname.startsWith("/blog/");
}

/** Resolve product back link — catalog session wins over stale document.referrer. */
export function resolveProductListBackPath(opts: {
  currentPathname: string;
  documentReferrer: string;
}): string | null {
  let refPath: string | null = null;
  let refSearch = "";
  if (opts.documentReferrer) {
    try {
      const u = new URL(opts.documentReferrer);
      if (typeof window !== "undefined" && u.origin === window.location.origin) {
        const path = u.pathname;
        if (
          !path.startsWith("/api") &&
          !path.startsWith("/admin") &&
          !path.startsWith("/_next") &&
          path !== opts.currentPathname &&
          !path.startsWith("/product/")
        ) {
          refPath = path;
          refSearch = u.search || "";
        }
      }
    } catch {
      refPath = null;
    }
  }

  const refFull = refPath ? refPath + refSearch : null;
  const stored = readCatalogReturnPath();

  if (refPath && isStorefrontCatalogPath(refPath)) return refFull;
  if (stored) return stored;
  if (refPath && isBlogArticlePath(refPath)) return refFull;
  return refFull;
}
