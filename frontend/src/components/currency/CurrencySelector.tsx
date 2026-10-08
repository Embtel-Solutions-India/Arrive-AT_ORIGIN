import { useState, useRef, useEffect } from "react";
import { useCurrency } from "../../context/CurrencyContext";

interface CurrencySelectorProps {
  className?: string;
  compact?: boolean;
}

export function CurrencySelector({ className = "", compact = false }: CurrencySelectorProps) {
  const {
    currency,
    symbol,
    isManual,
    detectedCountry,
    setCurrency,
    resetToAutoDetect,
  } = useCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const autoSuggestedCurrency = detectedCountry === "IN" ? "INR" : "USD";

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select currency"
        className="flex items-center gap-1.5 rounded-full border border-[rgba(237,231,218,0.2)] bg-white/5 px-2.5 sm:px-3 py-1.5 text-[0.8rem] sm:text-[0.82rem] font-medium text-vellum hover:border-halo hover:bg-white/10 transition-all cursor-pointer select-none"
      >
        <span className="text-sm leading-none" role="img" aria-label={currency}>
          {currency === "INR" ? "🇮🇳" : "🇺🇸"}
        </span>
        <span className="font-semibold text-halo">{currency}</span>
        <span className="text-dim/80 font-mono text-[0.72rem] hidden xs:inline">({symbol})</span>
        {!isManual && (
          <span
            title={`Auto-detected via IP (${detectedCountry})`}
            className="text-[0.62rem] uppercase font-semibold text-emerald-400/90 bg-emerald-500/10 px-1 py-0.2 rounded"
          >
            Auto
          </span>
        )}
        <svg
          className={`h-3 w-3 text-dim transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-56 sm:w-64 rounded-2xl border border-[rgba(232,206,140,0.22)] bg-[#0C1124] p-2 text-vellum shadow-[0_16px_40px_rgba(0,0,0,0.65)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-dim border-b border-white/5 mb-1 flex items-center justify-between">
            <span>Select Currency</span>
            <span className="text-[0.62rem] text-halo font-mono">Location-Based</span>
          </div>

          {/* Option: USD */}
          <button
            type="button"
            role="option"
            aria-selected={currency === "USD" && isManual}
            onClick={() => {
              setCurrency("USD");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
              currency === "USD" && isManual
                ? "bg-halo/20 text-white font-semibold border border-halo/30"
                : "hover:bg-white/10 text-vellum"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base leading-none">🇺🇸</span>
              <div>
                <span className="font-bold text-white block">USD ($)</span>
                <span className="text-[0.68rem] text-dim block">United States Dollar</span>
              </div>
            </div>
            {currency === "USD" && isManual && (
              <span className="text-halo text-sm font-bold">✓</span>
            )}
          </button>

          {/* Option: INR */}
          <button
            type="button"
            role="option"
            aria-selected={currency === "INR" && isManual}
            onClick={() => {
              setCurrency("INR");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer mt-1 ${
              currency === "INR" && isManual
                ? "bg-halo/20 text-white font-semibold border border-halo/30"
                : "hover:bg-white/10 text-vellum"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base leading-none">🇮🇳</span>
              <div>
                <span className="font-bold text-white block">INR (₹)</span>
                <span className="text-[0.68rem] text-dim block">Indian Rupee</span>
              </div>
            </div>
            {currency === "INR" && isManual && (
              <span className="text-halo text-sm font-bold">✓</span>
            )}
          </button>

          {/* Divider */}
          <div className="my-1.5 border-t border-white/10" />

          {/* Option: Auto Detect */}
          <button
            type="button"
            role="option"
            aria-selected={!isManual}
            onClick={() => {
              resetToAutoDetect();
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
              !isManual
                ? "bg-emerald-500/15 text-emerald-200 font-semibold border border-emerald-500/30"
                : "hover:bg-white/10 text-vellum"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base leading-none">🌐</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white block">Auto Detect</span>
                  <span className="text-[0.65rem] text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded font-mono">
                    IP: {detectedCountry}
                  </span>
                </div>
                <span className="text-[0.68rem] text-dim block">
                  Defaults to {autoSuggestedCurrency}
                </span>
              </div>
            </div>
            {!isManual && (
              <span className="text-emerald-400 text-sm font-bold">✓</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
