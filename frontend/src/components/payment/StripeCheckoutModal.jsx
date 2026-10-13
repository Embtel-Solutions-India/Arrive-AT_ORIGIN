import React, { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

// Cache Stripe instance promise per publishable key
const stripePromiseCache = new Map();

function getStripePromise(publishableKey) {
  const key = publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromiseCache.has(key)) {
    stripePromiseCache.set(key, loadStripe(key));
  }
  return stripePromiseCache.get(key);
}

/**
 * Modern In-Page Popup Modal for Stripe Embedded Checkout.
 * Uses pure @stripe/stripe-js DOM mounting directly into a container ref,
 * completely avoiding React version conflicts or hook dispatcher issues.
 */
export default function StripeCheckoutModal({
  isOpen,
  onClose,
  clientSecret,
  publishableKey,
  title = "Secure Checkout",
  subtitle = "Complete your payment safely with Stripe",
  amount,
  currency = "USD",
  itemSummary,
}) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Close on ESC key & prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Mount Stripe Embedded Checkout via pure Stripe.js
  useEffect(() => {
    if (!isOpen || !clientSecret) return;

    let checkoutInstance = null;
    let isMounted = true;
    setLoading(true);
    setError("");

    async function initCheckout() {
      try {
        const resolvedKey = publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        const stripe = await getStripePromise(resolvedKey);
        if (!stripe || !isMounted) return;

        // Support both createEmbeddedCheckoutPage and initEmbeddedCheckout
        const initFn =
          typeof stripe.createEmbeddedCheckoutPage === "function"
            ? stripe.createEmbeddedCheckoutPage
            : typeof stripe.initEmbeddedCheckout === "function"
            ? stripe.initEmbeddedCheckout
            : null;

        if (!initFn) {
          throw new Error("Embedded checkout is not available in the loaded Stripe.js library.");
        }

        checkoutInstance = await initFn.call(stripe, {
          fetchClientSecret: () => Promise.resolve(clientSecret),
        });

        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = "";
          checkoutInstance.mount(containerRef.current);
          setLoading(false);
        } else if (checkoutInstance) {
          checkoutInstance.destroy();
        }
      } catch (err) {
        console.error("Failed to initialize Stripe embedded checkout:", err);
        if (isMounted) {
          setError(err?.message || "Failed to initialize payment form.");
          setLoading(false);
        }
      }
    }

    // Short tick to ensure DOM node is rendered
    const timer = setTimeout(() => {
      initCheckout();
    }, 40);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (checkoutInstance) {
        try {
          checkoutInstance.destroy();
        } catch (_) {}
      }
    };
  }, [isOpen, clientSecret, publishableKey]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[94vh] flex flex-col bg-[#070b18] border border-[#e8ce8c]/35 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden text-[#ede7da]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-[#0d142b]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8ce8c]/15 border border-[#e8ce8c]/30 flex items-center justify-center text-[#e8ce8c] shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-wide text-[#ede7da]">
                  {title}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  256-Bit SSL
                </span>
              </div>
              <p className="text-xs text-[#8a93a8] line-clamp-1">
                {itemSummary || subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {amount !== undefined && amount !== null && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-[#8a93a8] font-semibold">Total</span>
                <span className="text-base font-bold text-[#e8ce8c]">
                  ${Number(amount).toFixed(2)} {currency.toUpperCase()}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close checkout modal"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8a93a8] hover:text-[#ede7da] hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#e8ce8c]/40 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Amount Bar */}
        {amount !== undefined && amount !== null && (
          <div className="sm:hidden flex items-center justify-between px-5 py-2 bg-[#0a0f22] border-b border-white/5 text-xs">
            <span className="text-[#8a93a8]">Amount Due:</span>
            <span className="font-bold text-[#e8ce8c]">
              ${Number(amount).toFixed(2)} {currency.toUpperCase()}
            </span>
          </div>
        )}

        {/* Modal Body / Embedded Checkout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#090d1f]">
          {loading && (
            <div className="min-h-[380px] flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-[#e8ce8c]/20 border-t-[#e8ce8c] animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#e8ce8c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#ede7da]">Opening Secure Stripe Payment...</p>
                <p className="text-xs text-[#8a93a8] mt-1">Connecting to Stripe encrypted gateway</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm mb-4">
              <p className="font-semibold">Payment Error</p>
              <p className="text-xs mt-1 text-rose-300/80">{error}</p>
            </div>
          )}

          <div
            className={`bg-white rounded-xl shadow-inner p-3 sm:p-5 text-gray-900 min-h-[440px] ${
              loading ? "hidden" : "block"
            }`}
          >
            <div ref={containerRef} id="stripe-checkout-mount" className="w-full" />
          </div>
        </div>

        {/* Modal Footer / Trust Badges */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#070b18] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8a93a8]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#e8ce8c]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <span>Payments encrypted & processed directly by Stripe</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#ede7da]/60 font-semibold tracking-wider uppercase text-[10px]">Cards • Apple Pay • Google Pay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
