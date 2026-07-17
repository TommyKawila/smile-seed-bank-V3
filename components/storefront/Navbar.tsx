"use client";

import { useState, useEffect, useRef } from "react";
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
import { subscribeScrollYBeyond } from "@/lib/subscribe-scroll-y-beyond";
import { CART_HIT_EVENT } from "@/lib/cart-fly-events";
import { GeneticsSeedsNav } from "@/components/storefront/GeneticsSeedsNav";

function LanguageToggle({
  locale,
  setLocale,
  groupLabel,
  thLabel,
  enLabel,
  className,
}: {
  locale: string;
  setLocale: (l: "th" | "en") => void;
  groupLabel: string;
  thLabel: string;
  enLabel: string;
  className?: string;
}) {
  const btn = (active: boolean) =>
    cn(
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tracking-wide transition-all sm:text-[11px]",
      active
        ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30"
        : "border border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-primary"
    );

  return (
    <div className={cn("flex items-center gap-1.5", className)} role="group" aria-label={groupLabel}>
      <button
        type="button"
        aria-label={thLabel}
        aria-pressed={locale === "th"}
        onClick={() => setLocale("th")}
        className={btn(locale === "th")}
      >
        TH
      </button>
      <button
        type="button"
        aria-label={enLabel}
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
        className={btn(locale === "en")}
      >
        ENG
      </button>
    </div>
  );
}

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
  /** V4: always dark glass nav on storefront */
  const solidLightNav = true;
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
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const navLinkClass =
    "text-sm font-medium tracking-wide text-foreground/75 transition-colors hover:text-primary";

  const navLinkActive = "text-primary";

  const isHomeActive = pathname === "/";
  const isBlogActive = isMagazineSection;
  const isSeedsActive =
    isCatalogPath ||
    pathname === "/breeders" ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/breeders/");

  const iconBtnClass =
    "rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary";

  return (
    <>
      <header className="no-print fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur-md transition-all duration-300">
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Leaf className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="max-w-[9rem] truncate text-base font-bold tracking-tight text-foreground sm:max-w-none">
                  Smile Seed Bank
                </span>
              </>
            )}
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-7 md:flex lg:gap-8">
            <Link href="/" className={cn(navLinkClass, isHomeActive && navLinkActive)}>
              {homeLabel}
            </Link>
            <GeneticsSeedsNav
              navLinkClass={cn(navLinkClass, isSeedsActive && navLinkActive)}
              solidLightNav={solidLightNav}
              mode="desktop"
            />
            <Link href="/blog" className={cn(navLinkClass, isBlogActive && navLinkActive)}>
              {blogLabel}
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
            <LanguageToggle
              locale={locale}
              setLocale={setLocale}
              groupLabel={t("เลือกภาษาเว็บไซต์", "Choose site language")}
              thLabel={t("เปลี่ยนเป็นภาษาไทย", "Switch site language to Thai")}
              enLabel={t("เปลี่ยนเป็นภาษาอังกฤษ", "Switch site language to English")}
            />

            {searchMounted ? (
              <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} triggerClassName={iconBtnClass} />
            ) : (
              <button
                type="button"
                className={cn(iconBtnClass, "flex h-10 w-10 items-center justify-center")}
                aria-label={t("ค้นหา", "Search")}
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" strokeWidth={1.75} />
              </button>
            )}
            {/* User — Avatar dropdown or Login link */}
            <div className="relative" ref={userMenuRef}>
              {signedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary transition-colors hover:bg-primary/25"
                    aria-label={t("เปิดเมนูโปรไฟล์", "Open profile menu")}
                  >
                    {displayInitial}
                  </button>
                  {userMenuOpen ? (
                      <div
                        className="absolute right-0 top-12 z-50 w-48 animate-in fade-in slide-in-from-top-2 zoom-in-95 overflow-hidden rounded-2xl border border-border bg-popover shadow-lg duration-150"
                      >
                        <div className="border-b border-border px-4 py-3">
                          <p className="truncate text-xs font-semibold text-foreground">{customer?.full_name ?? t("ลูกค้า", "Customer")}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{displayEmail}</p>
                        </div>
                        <Link
                          href="/profile?tab=orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                        >
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {t("ออเดอร์ของฉัน", "My Orders")}
                        </Link>
                        <Link
                          href="/profile?tab=profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          {t("ข้อมูลส่วนตัว", "Profile")}
                        </Link>
                        <button
                          type="button"
                          aria-label={t("ออกจากระบบ", "Sign Out")}
                          onClick={() => { void signOut().then(() => { router.push("/"); setUserMenuOpen(false); }); }}
                          className="flex w-full items-center gap-2.5 border-t border-border px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/30"
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
                  <User className="h-5 w-5" />
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
                <ShoppingCart className="h-5 w-5" />
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
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen ? (
            <div
              className="border-t border-border bg-background px-4 pb-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-200 sm:px-6 md:hidden"
            >
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "block py-3 text-base font-medium tracking-wide transition-colors hover:text-primary",
                  isHomeActive ? "text-primary" : "text-foreground/85"
                )}
              >
                {homeLabel}
              </Link>
              <GeneticsSeedsNav
                navLinkClass={cn(navLinkClass, isSeedsActive && navLinkActive)}
                solidLightNav={solidLightNav}
                mode="mobile"
                onNavigate={() => setMenuOpen(false)}
              />
              <Link
                href="/blog"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "block py-3 text-base font-medium tracking-wide transition-colors hover:text-primary",
                  isBlogActive ? "text-primary" : "text-foreground/85"
                )}
              >
                {blogLabel}
              </Link>
              {/* Auth Links — Mobile */}
              <div className="mt-3 border-t border-border pt-3">
                {signedIn ? (
                  <div className="flex items-center justify-between">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 text-sm font-medium text-foreground"
                    >
                      <User className="h-4 w-4 text-primary" />
                      {t("โปรไฟล์ของฉัน", "My Profile")}
                    </Link>
                    <button
                      type="button"
                      aria-label={t("ออกจากระบบ", "Sign Out")}
                      onClick={() => void signOut()}
                      className="text-xs text-red-400"
                    >
                      {t("ออกจากระบบ", "Sign Out")}
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium text-primary"
                  >
                    <User className="h-4 w-4" />
                    {t("เข้าสู่ระบบ / สมัครสมาชิก", "Sign In / Register")}
                  </Link>
                )}
              </div>
              <div className="mt-2 border-t border-border pt-3">
                <LanguageToggle
                  locale={locale}
                  setLocale={setLocale}
                  groupLabel={t("เลือกภาษาเว็บไซต์", "Choose site language")}
                  thLabel={t("เปลี่ยนเป็นภาษาไทย", "Switch site language to Thai")}
                  enLabel={t("เปลี่ยนเป็นภาษาอังกฤษ", "Switch site language to English")}
                />
              </div>
            </div>
        ) : null}
      </header>

      {/* CartSheet */}
      {cartSheetMounted ? <CartSheet open={isOpen} onClose={closeCart} /> : null}

    </>
  );
}
