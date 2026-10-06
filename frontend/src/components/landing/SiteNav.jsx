import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

const navLinks = [
  { href: "/#threshold", label: "The meta-human" },
  { href: "/#metaphysics", label: "Metaphysics" },
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

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(237,231,218,0.08)] bg-void/85 backdrop-blur-[14px] backdrop-saturate-[1.2]">
      <div className="relative mx-auto flex min-h-[72px] w-full max-w-[1280px] items-center justify-between gap-4 px-[clamp(16px,3.5vw,48px)]">
        {/* Brand Logo & Title */}
        <a
          href="/#top"
          className="flex items-center gap-3 font-display text-[1.02rem] tracking-[0.01em] text-vellum no-underline flex-shrink-0"
        >
          <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" className="flex-none">
            <circle cx="17" cy="17" r="16" fill="none" stroke="#C9992E" strokeWidth="1" />
            <circle cx="17" cy="17" r="10" fill="none" stroke="#E8CE8C" strokeWidth="1" opacity=".7" />
            <circle cx="17" cy="17" r="3" fill="#E8CE8C" />
          </svg>
          <span className="whitespace-nowrap leading-tight">
            Dr. Alka Chopra Madan
            <small className="block font-text text-[0.66rem] tracking-[0.14em] text-dim">
              Soul Body Healing Center
            </small>
          </span>
        </a>

        {/* Mobile / Tablet Drawer Backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Navigation Links */}
        <nav
          aria-label="Main"
          className={`${
            open ? "flex" : "hidden"
          } absolute inset-x-0 top-full z-50 flex-col items-stretch border-b border-[rgba(237,231,218,0.15)] bg-[#0B1022]/98 shadow-2xl py-5 px-6 lg:static lg:flex lg:flex-row lg:items-center lg:gap-3.5 xl:gap-6 lg:border-0 lg:bg-transparent lg:py-0 lg:px-0 lg:shadow-none flex-shrink-0`}
        >
          {navLinks.map((link) => {
            const Tag = link.to ? Link : "a";
            const target = link.to ? { to: link.to } : { href: link.href };
            return (
              <Tag
                key={link.label}
                {...target}
                onClick={() => setOpen(false)}
                className="whitespace-nowrap border-b border-[rgba(237,231,218,0.07)] py-3 text-[0.88rem] xl:text-[0.9rem] text-dim no-underline transition-colors duration-200 hover:text-vellum lg:border-transparent lg:py-0 lg:pb-[3px] lg:hover:border-gold"
              >
                {link.label}
              </Tag>
            );
          })}

          {/* Quick Actions in mobile / tablet drawer */}
          <div className="pt-4 lg:hidden border-t border-[rgba(237,231,218,0.1)] mt-3 space-y-2.5">
            <Link
              to="/schedule"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-full bg-halo py-2.5 text-[0.85rem] font-bold text-void no-underline shadow-sm"
            >
              Book a session
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCartOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(237,231,218,0.2)] bg-white/5 py-2 text-[0.85rem] font-medium text-vellum cursor-pointer hover:border-halo"
            >
              <span>🛒 Shopping Cart {totalItems > 0 ? `(${totalItems})` : ""}</span>
            </button>
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(237,231,218,0.2)] bg-white/5 py-2 text-[0.85rem] font-medium text-vellum no-underline hover:border-halo"
            >
              <span>👤 {isAuthenticated ? `My Account (${customer?.name ? customer.name.split(" ")[0] : "Client"})` : "Client Account & Orders"}</span>
            </Link>
          </div>
        </nav>

        {/* Action Group: Book a Session CTA, Cart, then Account */}
        <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 flex-shrink-0">
          {/* 1. "Book a session" Button */}
          <Link
            to="/schedule"
            className="hidden sm:inline-flex items-center justify-center whitespace-nowrap rounded-full bg-halo px-3.5 sm:px-4 md:px-5 py-2 sm:py-2.5 text-[0.82rem] sm:text-[0.84rem] font-bold tracking-[0.01em] text-void no-underline transition-all duration-200 hover:-translate-y-px hover:bg-white shadow-sm flex-shrink-0"
          >
            Book a session
          </Link>

          {/* 2. Cart Button */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex items-center justify-center rounded-full border border-[rgba(237,231,218,0.2)] bg-white/5 p-2 text-vellum hover:border-halo hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
            title="Open shopping cart"
            aria-label="Shopping Cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-halo text-[0.7rem] font-bold text-void">
                {totalItems}
              </span>
            )}
          </button>

          {/* 3. Account Option */}
          <Link
            to="/account"
            className={`flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1.5 text-[0.82rem] transition-all flex-shrink-0 ${
              isAuthenticated
                ? "border-halo/50 bg-halo/10 text-halo hover:bg-halo/20"
                : "border-[rgba(237,231,218,0.2)] bg-white/5 text-vellum hover:border-halo hover:bg-white/10"
            }`}
            title={isAuthenticated ? `Account: ${customer?.name}` : "Client Account Portal"}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className="hidden xs:inline sm:inline font-medium">
              {isAuthenticated ? (customer?.name ? customer.name.split(" ")[0] : "Account") : "Account"}
            </span>
          </Link>

          {/* Mobile / Tablet Hamburger Menu Button */}
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(237,231,218,0.25)] px-2.5 sm:px-3 py-[7px] sm:py-[9px] font-text text-[0.82rem] sm:text-[0.85rem] text-vellum lg:hidden flex-shrink-0 cursor-pointer hover:border-halo"
          >
            <span className="text-base leading-none">{open ? "✕" : "☰"}</span>
            <span>{open ? "Close" : "Menu"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default SiteNav;
