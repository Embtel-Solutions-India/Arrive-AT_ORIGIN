import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { CurrencySelector } from "../currency/CurrencySelector";

const navLinks = [
  { href: "/#threshold", label: "The meta-human" },
  { href: "/#frameworks", label: "Frameworks" },
  { href: "/#practice", label: "Practice" },
  { href: "/#healing-center", label: "Healing Center" },
  { to: "/books", label: "Book Store" },
  { to: "/blog", label: "Blog" },
  { href: "/#about", label: "About" },
];

function SiteNav() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreDropdownRef = useRef(null);
  const moreTimeoutRef = useRef(null);
  const { totalItems, setCartOpen } = useCart();
  const { customer, isAuthenticated } = useCustomerAuth();
  const location = useLocation();

  // Handlers for MORE dropdown with smooth hover grace period
  const handleMoreEnter = () => {
    if (moreTimeoutRef.current) {
      clearTimeout(moreTimeoutRef.current);
      moreTimeoutRef.current = null;
    }
    setMoreOpen(true);
  };

  const handleMoreLeave = () => {
    if (moreTimeoutRef.current) {
      clearTimeout(moreTimeoutRef.current);
    }
    moreTimeoutRef.current = setTimeout(() => {
      setMoreOpen(false);
    }, 220);
  };

  // Automatically close menus on route changes
  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
    if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current);
  }, [location.pathname, location.search, location.hash]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current);
    };
  }, []);

  // Close MORE dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target)) {
        if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current);
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Lock body scroll when mobile dropdown is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Dismiss on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setOpen(false);
        setMoreOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(237,231,218,0.08)] bg-void/95 backdrop-blur-[16px] backdrop-saturate-[1.3]">
      <div className="relative mx-auto flex min-h-[68px] sm:min-h-[74px] w-full max-w-[1280px] items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Title */}
        <a
          href="/#top"
          className="flex items-center gap-2.5 sm:gap-3 font-display text-[0.98rem] sm:text-[1.04rem] tracking-[0.01em] text-vellum no-underline flex-shrink-0 group"
          aria-label="Dr. Alka Chopra Madan - Home"
        >
          <svg width="32" height="32" viewBox="0 0 34 34" aria-hidden="true" className="flex-none transition-transform duration-300 group-hover:scale-105">
            <circle cx="17" cy="17" r="16" fill="none" stroke="#C9992E" strokeWidth="1" />
            <circle cx="17" cy="17" r="10" fill="none" stroke="#E8CE8C" strokeWidth="1" opacity=".7" />
            <circle cx="17" cy="17" r="3" fill="#E8CE8C" />
          </svg>
          <span className="whitespace-nowrap leading-tight">
            Dr. Alka Chopra Madan
            <small className="block font-text text-[0.63rem] sm:text-[0.66rem] tracking-[0.12em] text-dim">
              Soul Body Healing Center
            </small>
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Desktop Main Navigation"
          className="hidden lg:flex items-center gap-4 xl:gap-6 flex-shrink-0"
        >
          {navLinks.map((link) => {
            const Tag = link.to ? Link : "a";
            const target = link.to ? { to: link.to } : { href: link.href };
            return (
              <Tag
                key={link.label}
                {...target}
                className="whitespace-nowrap py-1 text-[0.88rem] xl:text-[0.91rem] text-dim no-underline transition-colors duration-200 hover:text-vellum"
              >
                {link.label}
              </Tag>
            );
          })}

          {/* MORE Dropdown Menu (Positioned immediately after About) */}
          <div
            className="relative flex-shrink-0"
            ref={moreDropdownRef}
            onMouseEnter={handleMoreEnter}
            onMouseLeave={handleMoreLeave}
          >
            <button
              type="button"
              onClick={() => {
                if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current);
                setMoreOpen((prev) => !prev);
              }}
              aria-expanded={moreOpen}
              aria-haspopup="true"
              aria-label="More navigation options"
              className="flex items-center gap-1 xl:gap-1.5 py-1 text-[0.88rem] xl:text-[0.91rem] font-bold tracking-wider uppercase text-dim hover:text-vellum transition-colors cursor-pointer select-none"
            >
              <span>MORE</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  moreOpen ? "rotate-180 text-halo" : "text-dim"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Dropdown Menu Container with zero-gap hover bridge */}
            {moreOpen && (
              <div
                className="absolute left-0 top-full pt-2 w-56 sm:w-64 z-50 animate-in fade-in duration-150"
                role="menu"
                onMouseEnter={handleMoreEnter}
                onMouseLeave={handleMoreLeave}
              >
                {/* Invisible hover bridge spanning between button and card */}
                <div className="absolute -top-3 left-0 right-0 h-4" aria-hidden="true" />

                {/* Dropdown Menu Card */}
                <div className="rounded-xl bg-white py-3 shadow-[0_14px_40px_rgba(0,0,0,0.38)] border border-gray-100/90">
                  <a
                    href="https://soulbodyclothing.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMoreOpen(false)}
                    className="block px-6 py-2.5 text-[0.92rem] font-semibold tracking-wider text-gray-900 uppercase hover:bg-gray-50 hover:text-amber-700 transition-colors no-underline"
                    role="menuitem"
                  >
                    SHOP
                  </a>
                  <a
                    href="https://www.youtube.com/@dr.alkachopramadan6837/videos"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMoreOpen(false)}
                    className="block px-6 py-2.5 text-[0.92rem] font-normal text-gray-900 hover:bg-gray-50 hover:text-amber-700 transition-colors no-underline"
                    role="menuitem"
                  >
                    YouTube Videos
                  </a>
                  <a
                    href="https://soulbodyhealingcenter.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMoreOpen(false)}
                    className="block px-6 py-2.5 text-[0.92rem] font-normal text-gray-900 hover:bg-gray-50 hover:text-amber-700 transition-colors no-underline"
                    role="menuitem"
                  >
                    Soul Body Healing Center
                  </a>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Action Group */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Desktop Only: "Book a session" Button */}
          <Link
            to="/schedule"
            className="hidden lg:inline-flex items-center justify-center whitespace-nowrap rounded-full bg-halo px-4 xl:px-5 py-2 text-[0.82rem] xl:text-[0.84rem] font-bold text-void no-underline transition-all duration-200 hover:bg-white shadow-sm flex-shrink-0"
          >
            Book a session
          </Link>

          {/* Desktop Only: Currency Selector */}
          <div className="hidden lg:inline-block">
            <CurrencySelector />
          </div>

          {/* Cart Button (Visible on both Mobile and Desktop) */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[rgba(237,231,218,0.2)] bg-white/5 text-vellum hover:border-halo hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
            title="Open shopping cart"
            aria-label="Shopping Cart"
          >
            <svg className="h-4.5 w-4.5 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-rose-500 text-[0.65rem] sm:text-[0.7rem] font-bold text-white shadow-sm">
                {totalItems}
              </span>
            )}
          </button>

          {/* Desktop Only: Account Button */}
          <Link
            to="/account"
            className={`hidden lg:inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.82rem] transition-all flex-shrink-0 no-underline ${
              isAuthenticated
                ? "border-halo/50 bg-halo/10 text-halo hover:bg-halo/20"
                : "border-[rgba(237,231,218,0.2)] bg-white/5 text-vellum hover:border-halo hover:bg-white/10"
            }`}
            title={isAuthenticated ? `Account: ${customer?.name}` : "User Account"}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className="font-medium">
              {isAuthenticated ? (customer?.name ? customer.name.split(" ")[0] : "Account") : "Account"}
            </span>
          </Link>

          {/* Mobile / Tablet THREE LINES (Hamburger Menu) Button */}
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((prev) => !prev)}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[rgba(237,231,218,0.25)] bg-white/5 text-vellum lg:hidden flex-shrink-0 cursor-pointer hover:border-halo hover:bg-white/10 transition-colors"
          >
            {open ? (
              <svg className="w-5 h-5 text-halo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Three Lines Hamburger Icon */
              <svg className="w-5 h-5 text-vellum" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Mobile & Tablet Full Width Dropdown Menu (Under the Header)              */}
      {/* ========================================================================= */}
      {open && (
        <div className="lg:hidden">
          {/* Backdrop below the header */}
          <div
            className="fixed inset-x-0 bottom-0 top-[68px] sm:top-[74px] z-40 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Dropdown Panel attached right below header */}
          <div
            className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-74px)] overflow-y-auto border-b border-[rgba(232,206,140,0.25)] bg-[#070B18]/98 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl space-y-4"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* 1. Account Option Card (Prominent at the top) */}
            <div className="rounded-2xl border border-[rgba(232,206,140,0.25)] bg-[#0E1630] p-3.5 shadow-md">
              <Link
                to="/account"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between no-underline group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-halo/15 border border-halo/30 text-halo text-base font-bold">
                    👤
                  </div>
                  <div className="min-w-0">
                    <span className="text-[0.92rem] font-semibold text-vellum block truncate group-hover:text-halo transition-colors">
                      {isAuthenticated ? (customer?.name || "User Account") : "User Account & Sign In"}
                    </span>
                    <span className="text-[0.74rem] text-dim block truncate">
                      {isAuthenticated ? (customer?.email || "View appointments & orders") : "View booked sessions, receipts & orders"}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-halo shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform">
                  {isAuthenticated ? "Account →" : "Sign In →"}
                </span>
              </Link>
            </div>

            {/* 2. All Page Navigation Buttons */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 space-y-1">
              <span className="px-3 pt-2 pb-1 text-[0.68rem] font-bold uppercase tracking-wider text-dim block">
                Explore Pages
              </span>
              {navLinks.map((link) => {
                const Tag = link.to ? Link : "a";
                const target = link.to ? { to: link.to } : { href: link.href };
                return (
                  <Tag
                    key={link.label}
                    {...target}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-[0.95rem] font-medium text-vellum hover:bg-white/5 hover:text-halo transition-colors no-underline border-b border-white/[0.04] last:border-b-0"
                  >
                    <span>{link.label}</span>
                    <span className="text-dim text-xs font-semibold">→</span>
                  </Tag>
                );
              })}
            </div>

            {/* More Options (SHOP & YouTube Videos) */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 space-y-1">
              <span className="px-3 pt-2 pb-1 text-[0.68rem] font-bold uppercase tracking-wider text-dim block">
                More
              </span>
              <a
                href="https://soulbodyclothing.com/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-[0.95rem] font-medium text-vellum hover:bg-white/5 hover:text-halo transition-colors no-underline border-b border-white/[0.04]"
              >
                <span className="font-semibold uppercase tracking-wider">SHOP</span>
                <span className="text-dim text-xs">↗</span>
              </a>
              <a
                href="https://www.youtube.com/@dr.alkachopramadan6837/videos"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-[0.95rem] font-medium text-vellum hover:bg-white/5 hover:text-halo transition-colors no-underline border-b border-white/[0.04]"
              >
                <span>YouTube Videos</span>
                <span className="text-dim text-xs">↗</span>
              </a>
              <a
                href="https://soulbodyhealingcenter.com/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-[0.95rem] font-medium text-vellum hover:bg-white/5 hover:text-halo transition-colors no-underline"
              >
                <span>Soul Body Healing Center</span>
                <span className="text-dim text-xs">↗</span>
              </a>
            </div>
            <Link
              to="/schedule"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-full bg-halo py-3 text-sm font-bold text-void no-underline shadow-[0_4px_16px_rgba(232,206,140,0.3)] hover:bg-white transition-all active:scale-[0.98]"
            >
              ✦ Book a Consultation Session
            </Link>

            {/* 4. Cart & Currency Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setCartOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-vellum hover:border-halo cursor-pointer transition-colors"
              >
                <span>🛒 Cart</span>
                {totalItems > 0 && (
                  <span className="rounded-full bg-halo px-1.5 py-0.2 text-[0.66rem] font-bold text-void">
                    {totalItems}
                  </span>
                )}
              </button>

              <div className="flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-vellum">
                <CurrencySelector />
              </div>
            </div>

            {/* 5. Admin Portal Link */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-dim">
              <span>Dr. Alka Chopra Madan</span>
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="text-halo/80 hover:text-halo font-medium no-underline hover:underline"
              >
                Admin Portal →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default SiteNav;
