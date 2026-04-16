"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Menu, X, Leaf, Search, User, LogOut, Package } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/use-auth";
import { CartSheet } from "./CartSheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [scrolled, setScrolled] = useState(false);
  /** White sticky bar: home, blog, product detail, commerce flows, or scrolled inner pages. */
  const solidLightNav =
    isHomePage || isMagazineSection || isProductDetail || isJournalCommerce || scrolled;
  const { itemCount, isOpen, openCart, closeCart } = useCartContext();
  const { locale, toggle, t } = useLanguage();
  const { settings } = useSiteSettings();
  const { user, customer, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    setSearchQuery("");
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  };

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [searchOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/", label: t("หน้าแรก", "Home") },
    { href: "/shop", label: t("ร้านค้า", "Shop") },
    { href: "/shop?category=Seeds", label: t("เมล็ดพันธุ์", "Seeds") },
    { href: "/blog", label: t("Smile Seed Blog", "Smile Seed Blog") },
  ];

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
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:h-28 sm:px-8">
          {/* Logo — aligned to nav link cap height */}
          <Link href="/" className="flex shrink-0 items-center self-center leading-none">
            {settings.logo_main_url ? (
              <Image
                src={settings.logo_main_url}
                alt="Smile Seed Bank"
                width={224}
                height={77}
                className="h-11 w-auto max-w-[200px] object-contain object-left sm:h-[3.5rem] sm:max-w-none"
                unoptimized
                priority
              />
            ) : (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-bold tracking-tight text-zinc-900">
                  Smile Seed Bank
                </span>
              </>
            )}
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-7 md:flex lg:gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggle}
              className="flex items-center overflow-hidden rounded-sm border border-zinc-200/90 bg-white text-[11px] font-semibold text-zinc-700 shadow-sm transition-colors hover:border-emerald-300/80"
              aria-label="Switch language"
            >
              <span
                className={cn(
                  "px-2.5 py-1.5 transition-colors",
                  locale === "th"
                    ? "bg-emerald-700/95 text-white"
                    : "text-zinc-500 hover:text-zinc-800"
                )}
              >
                TH
              </span>
              <span
                className={cn(
                  "px-2.5 py-1.5 transition-colors",
                  locale === "en"
                    ? "bg-emerald-700/95 text-white"
                    : "text-zinc-500 hover:text-zinc-800"
                )}
              >
                EN
              </span>
            </button>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className={`relative flex h-10 w-10 items-center justify-center ${iconBtnClass}`}
              aria-label={t("ค้นหา", "Search")}
            >
              <Search className="h-5 w-5 text-zinc-800" />
            </button>

            {/* User — Avatar dropdown or Login link */}
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-900 transition-colors hover:bg-emerald-100"
                    aria-label="Profile"
                  >
                    {(customer?.full_name ?? user.email ?? "U").charAt(0).toUpperCase()}
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-lg"
                      >
                        <div className="border-b border-zinc-100 px-4 py-3">
                          <p className="truncate text-xs font-semibold text-zinc-800">{customer?.full_name ?? t("ลูกค้า", "Customer")}</p>
                          <p className="truncate text-[11px] text-zinc-400">{user.email}</p>
                        </div>
                        <Link
                          href="/account?tab=orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                        >
                          <Package className="h-4 w-4 text-zinc-400" />
                          {t("ออเดอร์ของฉัน", "My Orders")}
                        </Link>
                        <Link
                          href="/account?tab=profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                        >
                          <User className="h-4 w-4 text-zinc-400" />
                          {t("ข้อมูลส่วนตัว", "Profile")}
                        </Link>
                        <button
                          onClick={() => { void signOut().then(() => { router.push("/"); setUserMenuOpen(false); }); }}
                          className="flex w-full items-center gap-2.5 border-t border-zinc-100 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          {t("ออกจากระบบ", "Sign Out")}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
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

            {/* Cart Button */}
            <button
              onClick={openCart}
              className={`relative flex h-10 w-10 items-center justify-center ${iconBtnClass}`}
              aria-label={t("ตะกร้าสินค้า", "Cart")}
            >
              <ShoppingCart className="h-5 w-5 text-zinc-800" />
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </motion.span>
              )}
            </button>

            {/* Hamburger — Mobile only */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`flex h-10 w-10 items-center justify-center md:hidden ${iconBtnClass}`}
              aria-label={t("เมนู", "Menu")}
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
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-base font-normal tracking-wide text-zinc-800 hover:text-emerald-900"
                >
                  {link.label}
                </Link>
              ))}
              {/* Auth Links — Mobile */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                {user ? (
                  <div className="flex items-center justify-between">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 text-sm font-medium text-zinc-800"
                    >
                      <User className="h-4 w-4 text-emerald-800" />
                      {t("โปรไฟล์ของฉัน", "My Profile")}
                    </Link>
                    <button onClick={() => void signOut()} className="text-xs text-red-600">
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
              <div className="mt-2 border-t border-gray-100 pt-2">
                <button
                  onClick={toggle}
                  className="flex items-center gap-2 text-sm font-medium text-zinc-600"
                >
                  <span className={locale === "th" ? "font-bold text-emerald-800" : ""}>
                    ภาษาไทย
                  </span>
                  <span className="text-zinc-300">|</span>
                  <span className={locale === "en" ? "font-bold text-emerald-800" : ""}>
                    English
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* CartSheet */}
      <CartSheet open={isOpen} onClose={closeCart} />

      {/* Search overlay */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-md border-zinc-200 bg-white/95 shadow-xl backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="sr-only">{t("ค้นหา", "Search")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearchSubmit} className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("ค้นหาสินค้าหรือแบรนด์ที่คุณชอบ...", "Search products or brands you like...")}
                className="pl-9 bg-white/80"
              />
            </div>
            <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
              {t("ค้นหา", "Search")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
