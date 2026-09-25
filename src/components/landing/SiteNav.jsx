import { useState } from "react";

const navLinks = [
  { href: "#threshold", label: "The meta-human" },
  { href: "#metaphysics", label: "Metaphysics" },
  { href: "#frameworks", label: "Frameworks" },
  { href: "#practice", label: "Practice" },
  { href: "#books", label: "Books" },
  { href: "#about", label: "About" },
];

function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(237,231,218,0.08)] bg-void/72 backdrop-blur-[14px] backdrop-saturate-[1.2]">
      <div className="relative mx-auto flex min-h-[72px] w-full max-w-[1240px] items-center gap-7 px-[clamp(20px,5vw,64px)]">
        <a href="#top" className="mr-auto flex items-center gap-3 font-display text-[1.05rem] tracking-[0.01em] text-vellum no-underline">
          <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" className="flex-none">
            <circle cx="17" cy="17" r="16" fill="none" stroke="#C9992E" strokeWidth="1" />
            <circle cx="17" cy="17" r="10" fill="none" stroke="#E8CE8C" strokeWidth="1" opacity=".7" />
            <circle cx="17" cy="17" r="3" fill="#E8CE8C" />
          </svg>
          <span>
            Dr. Alka Chopra Madan
            <small className="block font-text text-[0.68rem] tracking-[0.14em] text-dim">Soul Body Healing Center</small>
          </span>
        </a>

        <nav
          aria-label="Main"
          className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col items-stretch border-b border-[rgba(237,231,218,0.12)] bg-ink py-2 md:static md:flex md:flex-row md:items-center md:gap-[26px] md:border-0 md:bg-transparent md:py-0`}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-[rgba(237,231,218,0.07)] px-[clamp(20px,5vw,64px)] py-[14px] text-[0.9rem] text-dim no-underline transition-colors duration-200 hover:text-vellum md:border-transparent md:px-0 md:py-0 md:pb-[3px] md:hover:border-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#begin"
          className="hidden rounded-full bg-halo px-5 py-[11px] text-[0.9rem] font-bold tracking-[0.01em] text-void no-underline transition-all duration-200 hover:-translate-y-px hover:bg-white md:inline-flex"
        >
          Book a conversation
        </a>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-[rgba(237,231,218,0.25)] px-3 py-[9px] font-text text-[0.85rem] text-vellum md:hidden"
        >
          Menu
        </button>
      </div>
    </header>
  );
}

export default SiteNav;
