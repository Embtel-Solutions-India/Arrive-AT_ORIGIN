import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { CurrencySelector } from "../currency/CurrencySelector";

const navLinks = [
  { href: "/#threshold", label: "The meta-human" },
  { href: "/#frameworks", label: "Frameworks" },
  { href: "/#practice", label: "Practice" },
  { to: "/books", label: "Book Store" },
  { to: "/blog", label: "Blog" },
  { href: "/#about", label: "About" },
];

function SiteNav() {
  const [open, setOpen] = useState(false);
  const { totalItems, setCartOpen } = useCart();
  const { customer, isAuthenticated } = useCustomerAuth();
  const location = useLocation();

  // Automatically close mobile menu on route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search, location.hash]);

  // Lock body scroll when mobile menu is open
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
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(237,231,218,0.08)] bg-void/90 backdrop-blur-[16px] backdrop-saturate-[1.3]">
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
            <svg className="h-4.5 w-4.5 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-halo text-[0.65rem] sm:text-[0.7rem] font-bold text-void shadow-sm">
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
            title={isAuthenticated ? `Account: ${customer?.name}` : "Client Account Portal"}
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
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[rgba(237,231,218,0.22)] bg-white/[0.04] text-vellum lg:hidden flex-shrink-0 cursor-pointer hover:border-halo hover:bg-white/10 transition-colors"
          >
            {open ? (
              <svg className="w-5 h-5 text-halo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Three Lines Icon */
              <svg className="w-5 h-5 text-vellum" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Mobile & Tablet Full Navigation Drawer (When Three Lines Icon Is Tapped)  */}
      {/* ========================================================================= */}
      {open && (
        <div className="lg:hidden">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <div
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[340px] sm:max-w-[380px] flex-col border-l border-[rgba(232,206,140,0.2)] bg-[#070B18] shadow-2xl transition-transform"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* Drawer Top Bar */}
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5 bg-[#0B1022]">
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 34 34" aria-hidden="true">
                  <circle cx="17" cy="17" r="16" fill="none" stroke="#C9992E" strokeWidth="1" />
                  <circle cx="17" cy="17" r="10" fill="none" stroke="#E8CE8C" strokeWidth="1" opacity=".7" />
                  <circle cx="17" cy="17" r="3" fill="#E8CE8C" />
                </svg>
                <span className="font-display text-sm font-medium text-vellum">Navigation Menu</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-dim hover:text-vellum hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
              {/* 1. Account Option Card (Prominently at the top as requested) */}
              <div className="rounded-2xl border border-[rgba(232,206,140,0.25)] bg-[#0E1630] p-3.5 shadow-md">
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between no-underline group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-halo/15 border border-halo/30 text-halo text-base">
                      👤
                    </div>
                    <div className="min-w-0">
                      <span className="text-[0.88rem] font-semibold text-vellum block truncate group-hover:text-halo transition-colors">
                        {isAuthenticated ? (customer?.name || "Client Account") : "Account & Sign In"}
                      </span>
                      <span className="text-[0.72rem] text-dim block truncate">
                        {isAuthenticated ? (customer?.email || "View portal & bookings") : "Track orders, appointments & profile"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-halo shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                    {isAuthenticated ? "Portal →" : "Sign In →"}
                  </span>
                </Link>
              </div>

              {/* 2. All Page Navigation Buttons */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2 space-y-1">
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
                      className="flex items-center justify-between rounded-xl px-3.5 py-3 text-[0.92rem] font-medium text-vellum hover:bg-white/5 hover:text-halo transition-colors no-underline"
                    >
                      <span>{link.label}</span>
                      <span className="text-dim text-xs">→</span>
                    </Tag>
                  );
                })}
              </div>

              {/* 3. Book a Session Primary Action */}
              <Link
                to="/schedule"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-halo py-3 text-sm font-bold text-void no-underline shadow-[0_4px_16px_rgba(232,206,140,0.3)] transition-transform active:scale-[0.98]"
              >
                ✦ Book a Consultation Session
              </Link>

              {/* 4. Currency Selector Option */}
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-vellum">
                <span className="text-dim font-medium">Currency Display</span>
                <CurrencySelector />
              </div>

              {/* 5. Shopping Cart Drawer Trigger */}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setCartOpen(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-semibold text-vellum hover:border-halo cursor-pointer transition-colors"
              >
                <span>🛒 View Shopping Cart</span>
                {totalItems > 0 && (
                  <span className="rounded-full bg-halo px-2 py-0.2 text-[0.68rem] font-bold text-void">
                    {totalItems} items
                  </span>
                )}
              </button>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-white/10 bg-[#0B1022] p-4 flex items-center justify-between text-xs text-dim">
              <span>Arrive at Origin</span>
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
