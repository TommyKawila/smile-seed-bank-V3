"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Menu from "lucide-react/dist/esm/icons/menu";
import Package from "lucide-react/dist/esm/icons/package";
import Search from "lucide-react/dist/esm/icons/search";
import ShoppingCart from "lucide-react/dist/esm/icons/shopping-cart";
import User from "lucide-react/dist/esm/icons/user";
import X from "lucide-react/dist/esm/icons/x";
import { useCartContext } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth, useStorefrontSignedIn } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAV_LOGO_INTRINSIC, NAV_LOGO_SIZES } from "@/lib/storefront-nav-logo";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import { subscribeScrollYBeyond } from "@/lib/subscribe-scroll-y-beyond";
import { CART_HIT_EVENT } from "@/lib/cart-fly-events";

const CartSheet = dynamic(
  () => import("./CartSheet").then((m) => ({ default: m.CartSheet })),
  { ssr: false }
);

const SearchCommand = dynamic(
  () =>
    import("@/components/header/search-command").then((m) => ({
      default: m.SearchCommand,
    })),
  { ssr: false }
);

type SeedsNavShellProps = {
  navLinkClass: string;
  solidLightNav: boolean;
  label: string;
  onIntent: () => void;
  onOpenMenu: () => void;
};

type BreederSeedsNavComponent = ComponentType<{
  navLinkClass: string;
  solidLightNav: boolean;
  initialOpen?: boolean;
  autoFocusButton?: boolean;
  onNavigate?: () => void;
  mode: "desktop" | "mobile";
}>;

function SeedsNavShell({ navLinkClass, solidLightNav, label, onIntent, onOpenMenu }: SeedsNavShellProps) {
  return (
    <Link
      href="/seeds"
      onFocus={onIntent}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === " ") {
          event.preventDefault();
          onOpenMenu();
        }
      }}
      className={cn(
        navLinkClass,
        "inline-flex items-center gap-1",
        solidLightNav ? "text-zinc-800" : "text-zinc-600"
      )}
    >
      {label}
      <ChevronDown className="h-3.5 w-3.5 opacity-60" strokeWidth={1.75} aria-hidden />
    </Link>
  );
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const isMagazineSection = pathname === "/blog" || pathname.startsWith("/blog/");
  const isProductDetail = pathname.startsWith("/product/");
  const isHomePage = pathname === "/";
  const isJournalCommerce =
    pathname === "/profile" ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/payment/");
  const isCatalogPath =
    pathname === "/shop" ||
    pathname.startsWith("/shop") ||
    pathname === "/seeds" ||
    pathname.startsWith("/seeds/");
  const [scrolled, setScrolled] = useState(false);
  /** White sticky bar: home, blog, product detail, commerce flows, catalog, or scrolled inner pages. */
  const solidLightNav =
    isHomePage ||
    isMagazineSection ||
    isProductDetail ||
    isJournalCommerce ||
    isCatalogPath ||
    scrolled;
  const { itemCount, isOpen, openCart, closeCart } = useCartContext();
  const { locale, setLocale, t } = useLanguage();
  const { settings } = useSiteSettings();
  const { user, customer, signOut, sessionHint } = useAuth();
  const signedIn = useStorefrontSignedIn();
  const displayEmail = user?.email ?? sessionHint?.email ?? null;
  const displayInitial = (customer?.full_name ?? displayEmail ?? "U").charAt(0).toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartHitWobble, setCartHitWobble] = useState(false);
  const [cartSheetMounted, setCartSheetMounted] = useState(false);
  const [searchMounted, setSearchMounted] = useState(false);
  const [seedsNavMounted, setSeedsNavMounted] = useState(false);
  const [seedsNavOpenOnMount, setSeedsNavOpenOnMount] = useState(false);
  const [seedsNavFocusOnMount, setSeedsNavFocusOnMount] = useState(false);
  const [BreederSeedsNav, setBreederSeedsNav] = useState<BreederSeedsNavComponent | null>(null);
  const seedsNavLoadingRef = useRef<Promise<void> | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const preloadSeedsNav = useCallback(() => {
    if (BreederSeedsNav) return Promise.resolve();
    if (seedsNavLoadingRef.current) return seedsNavLoadingRef.current;

    const loading = import("@/components/storefront/BreederDropdownMenu")
      .then((m) => {
        setBreederSeedsNav(() => m.BreederSeedsNav);
      })
      .finally(() => {
        seedsNavLoadingRef.current = null;
      });

    seedsNavLoadingRef.current = loading;
    return loading;
  }, [BreederSeedsNav]);

  const mountSeedsNav = useCallback((openOnMount = false, focusOnMount = false) => {
    setSeedsNavMounted(true);
    setSeedsNavOpenOnMount(openOnMount);
    setSeedsNavFocusOnMount(focusOnMount);
    void preloadSeedsNav();
  }, [preloadSeedsNav]);

  useEffect(() => {
    if (menuOpen) mountSeedsNav();
  }, [menuOpen, mountSeedsNav]);

  useEffect(() => {
    if (isOpen) setCartSheetMounted(true);
  }, [isOpen]);

  useEffect(() => {
    if (searchOpen) setSearchMounted(true);
  }, [searchOpen]);

  // Close user menu on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    let unsub = () => {};
    const bootRaf = requestAnimationFrame(() => {
      unsub = subscribeScrollYBeyond(12, setScrolled);
    });
    return () => {
      cancelAnimationFrame(bootRaf);
      unsub();
    };
  }, []);

  useEffect(() => {
    let clearT: number | undefined;
    const onHit = () => {
      if (clearT) window.clearTimeout(clearT);
      setCartHitWobble(true);
      clearT = window.setTimeout(() => setCartHitWobble(false), 480);
    };
    window.addEventListener(CART_HIT_EVENT, onHit);
    return () => {
      window.removeEventListener(CART_HIT_EVENT, onHit);
      if (clearT) window.clearTimeout(clearT);
    };
  }, []);

  const homeLabel = t("หน้าแรก", "Home");
  const blogLabel = t("คลังความรู้สายเขียว", "Knowledge vault");
  const seedsLabel = t("เมล็ดพันธุ์", "Seeds");

  const navLinkClass = solidLightNav
    ? "text-sm font-normal tracking-[0.06em] text-zinc-800 transition-colors hover:text-emerald-900"
    : "text-sm font-normal tracking-[0.06em] text-zinc-600 transition-colors hover:text-primary";

  const iconBtnClass = "rounded-full transition-colors hover:bg-zinc-100";

  return (
    <>
      <header
        className={`no-print fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          solidLightNav
            ? "border-b border-gray-100 bg-white shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 w-full min-w-0 max-w-7xl flex-row flex-nowrap items-center justify-between gap-2 px-4 sm:h-28 sm:gap-3 sm:px-5 lg:gap-4 lg:px-8">
          {/* Logo — aligned to nav link cap height */}
          <Link href="/" className="flex min-w-0 shrink-0 items-center self-center leading-none">
            {settings.logo_main_url ? (
              <Image
                src={settings.logo_main_url}
                alt="Smile Seed Bank"
                width={NAV_LOGO_INTRINSIC.width}
                height={NAV_LOGO_INTRINSIC.height}
                priority={true}
                fetchPriority="high"
                sizes={NAV_LOGO_SIZES}
                className="h-11 w-auto max-w-[min(152px,46vw)] shrink-0 object-contain object-left sm:h-14 sm:max-w-[12.5rem] lg:max-w-[14rem]"
              />
            ) : (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <span className="max-w-[9rem] truncate text-base font-bold tracking-tight text-zinc-900 sm:max-w-none">
                  Smile Seed Bank
                </span>
              </>
            )}
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-7 md:flex lg:gap-8">
            <Link href="/" className={navLinkClass}>
              {homeLabel}
            </Link>
            <div
              className="hidden md:block"
              onMouseEnter={() => mountSeedsNav(true)}
              onMouseLeave={() => {
                setSeedsNavOpenOnMount(false);
                setSeedsNavFocusOnMount(false);
              }}
              onFocusCapture={preloadSeedsNav}
            >
              {seedsNavMounted && BreederSeedsNav ? (
                <BreederSeedsNav
                  navLinkClass={navLinkClass}
                  solidLightNav={solidLightNav}
                  initialOpen={seedsNavOpenOnMount}
                  autoFocusButton={seedsNavFocusOnMount}
                  mode="desktop"
                />
              ) : (
                <SeedsNavShell
                  navLinkClass={navLinkClass}
                  solidLightNav={solidLightNav}
                  label={seedsLabel}
                  onIntent={preloadSeedsNav}
                  onOpenMenu={() => mountSeedsNav(true, true)}
                />
              )}
            </div>
            <Link href="/blog" className={navLinkClass}>
              {blogLabel}
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
            {/* Language Toggle — two targets so each control has a unique accessible name */}
            <div
              className="flex overflow-hidden rounded-sm border border-zinc-200/90 bg-white text-[11px] font-semibold text-zinc-700 shadow-sm transition-colors hover:border-emerald-300/80"
              role="group"
              aria-label={t("เลือกภาษาเว็บไซต์", "Choose site language")}
            >
              <button
                type="button"
                aria-label={t("เปลี่ยนเป็นภาษาไทย", "Switch site language to Thai")}
                onClick={() => setLocale("th")}
                className={cn(
                  "px-2.5 py-1.5 transition-colors",
                  locale === "th"
                    ? "bg-emerald-700/95 text-white"
                    : "text-zinc-500 hover:text-zinc-800"
                )}
              >
                TH
              </button>
              <button
                type="button"
                aria-label={t("เปลี่ยนเป็นภาษาอังกฤษ", "Switch site language to English")}
                onClick={() => setLocale("en")}
                className={cn(
                  "px-2.5 py-1.5 transition-colors",
                  locale === "en"
                    ? "bg-emerald-700/95 text-white"
                    : "text-zinc-500 hover:text-zinc-800"
                )}
              >
                EN
              </button>
            </div>

            {searchMounted ? (
              <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} triggerClassName={iconBtnClass} />
            ) : (
              <button
                type="button"
                className={cn(iconBtnClass, "flex h-10 w-10 items-center justify-center")}
                aria-label={t("ค้นหา", "Search")}
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5 text-zinc-700" strokeWidth={1.75} />
              </button>
            )}
            {/* User — Avatar dropdown or Login link */}
            <div className="relative" ref={userMenuRef}>
              {signedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-900 transition-colors hover:bg-emerald-100"
                    aria-label={t("เปิดเมนูโปรไฟล์", "Open profile menu")}
                  >
                    {displayInitial}
                  </button>
                  {userMenuOpen ? (
                      <div
                        className="absolute right-0 top-12 z-50 w-48 animate-in fade-in slide-in-from-top-2 zoom-in-95 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-lg duration-150"
                      >
                        <div className="border-b border-zinc-100 px-4 py-3">
                          <p className="truncate text-xs font-semibold text-zinc-800">{customer?.full_name ?? t("ลูกค้า", "Customer")}</p>
                          <p className="truncate text-[11px] text-zinc-400">{displayEmail}</p>
                        </div>
                        <Link
                          href="/profile?tab=orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                        >
                          <Package className="h-4 w-4 text-zinc-400" />
                          {t("ออเดอร์ของฉัน", "My Orders")}
                        </Link>
                        <Link
                          href="/profile?tab=profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                        >
                          <User className="h-4 w-4 text-zinc-400" />
                          {t("ข้อมูลส่วนตัว", "Profile")}
                        </Link>
                        <button
                          type="button"
                          aria-label={t("ออกจากระบบ", "Sign Out")}
                          onClick={() => { void signOut().then(() => { router.push("/"); setUserMenuOpen(false); }); }}
                          className="flex w-full items-center gap-2.5 border-t border-zinc-100 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          {t("ออกจากระบบ", "Sign Out")}
                        </button>
                      </div>
                    ) : null}
                </>
              ) : (
                <Link
                  href="/login"
                  className={`flex h-10 w-10 items-center justify-center ${iconBtnClass}`}
                  aria-label={t("เข้าสู่ระบบ", "Sign In")}
                >
                  <User className="h-5 w-5 text-zinc-800" />
                </Link>
              )}
            </div>

            {/* Cart Button — badge is on button; icon animates so badge stays pinned */}
            <button
              id="ssb-nav-cart-button"
              type="button"
              onClick={openCart}
              className={`relative flex h-10 w-10 items-center justify-center ${iconBtnClass}`}
              aria-label={t("เปิดตะกร้าสินค้า", "Open shopping cart")}
            >
              <span
                className={cn(
                  "inline-flex origin-center will-change-transform",
                  cartHitWobble
                    ? "motion-reduce:animate-none animate-cart-hit"
                    : itemCount > 0 && "motion-reduce:animate-none animate-cart-nod"
                )}
                aria-hidden
              >
                <ShoppingCart className="h-5 w-5 text-zinc-800" />
              </span>
              {itemCount > 0 && (
                <span
                  key={itemCount}
                  className="pointer-events-none absolute -right-0.5 -top-0.5 z-10 flex h-5 w-5 animate-in zoom-in-50 fade-in items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20 duration-200"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>

            {/* Hamburger — Mobile only */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              className={`flex h-10 w-10 items-center justify-center md:hidden ${iconBtnClass}`}
              aria-label={
                menuOpen ? t("ปิดเมนู", "Close menu") : t("เปิดเมนู", "Open menu")
              }
            >
              {menuOpen ? (
                <X className="h-5 w-5 text-zinc-800" />
              ) : (
                <Menu className="h-5 w-5 text-zinc-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen ? (
            <div
              className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-200 sm:px-6 md:hidden"
            >
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-base font-normal tracking-wide text-zinc-800 hover:text-emerald-900"
              >
                {homeLabel}
              </Link>
              {seedsNavMounted && BreederSeedsNav ? (
                <BreederSeedsNav
                  navLinkClass={navLinkClass}
                  solidLightNav={solidLightNav}
                  mode="mobile"
                  onNavigate={() => setMenuOpen(false)}
                />
              ) : (
                <Link
                  href="/seeds"
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-gray-100 py-3 text-base font-normal tracking-wide text-zinc-800 hover:text-emerald-900"
                >
                  {seedsLabel}
                </Link>
              )}
              <Link
                href="/blog"
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-base font-normal tracking-wide text-zinc-800 hover:text-emerald-900"
              >
                {blogLabel}
              </Link>
              {/* Auth Links — Mobile */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                {signedIn ? (
                  <div className="flex items-center justify-between">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 text-sm font-medium text-zinc-800"
                    >
                      <User className="h-4 w-4 text-emerald-800" />
                      {t("โปรไฟล์ของฉัน", "My Profile")}
                    </Link>
                    <button
                      type="button"
                      aria-label={t("ออกจากระบบ", "Sign Out")}
                      onClick={() => void signOut()}
                      className="text-xs text-red-600"
                    >
                      {t("ออกจากระบบ", "Sign Out")}
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium text-emerald-800"
                  >
                    <User className="h-4 w-4" />
                    {t("เข้าสู่ระบบ / สมัครสมาชิก", "Sign In / Register")}
                  </Link>
                )}
              </div>
              {/* Language toggle inside mobile menu */}
              <div
                className="mt-2 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2"
                role="group"
                aria-label={t("เลือกภาษาเว็บไซต์", "Choose site language")}
              >
                <button
                  type="button"
                  onClick={() => setLocale("th")}
                  className={cn(
                    "text-sm font-medium text-zinc-600 underline-offset-2 hover:underline",
                    locale === "th" && "font-bold text-emerald-800"
                  )}
                  aria-label={t("เปลี่ยนเป็นภาษาไทย", "Switch site language to Thai")}
                >
                  ภาษาไทย
                </button>
                <span className="text-zinc-300" aria-hidden>
                  |
                </span>
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  className={cn(
                    "text-sm font-medium text-zinc-600 underline-offset-2 hover:underline",
                    locale === "en" && "font-bold text-emerald-800"
                  )}
                  aria-label={t("เปลี่ยนเป็นภาษาอังกฤษ", "Switch site language to English")}
                >
                  English
                </button>
              </div>
            </div>
        ) : null}
      </header>

      {/* CartSheet */}
      {cartSheetMounted ? <CartSheet open={isOpen} onClose={closeCart} /> : null}

    </>
  );
}
