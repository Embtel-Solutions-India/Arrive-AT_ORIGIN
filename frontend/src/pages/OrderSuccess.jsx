import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import { useCart } from "../context/CartContext";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { apiUrl } from "../utils/api";

const shell = "mx-auto w-full max-w-[700px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.05] tracking-[-0.015em]";

function OrderSuccess() {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const { autoLogin } = useCustomerAuth();
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    // Clear cart immediately upon successful order landing
    clearCart();

    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      setVerifying(true);
      let pendingData = {};
      try {
        const raw = localStorage.getItem("aao_pending_order");
        if (raw) pendingData = JSON.parse(raw);
      } catch (_) {}

      fetch(apiUrl("/public/orders/stripe/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          orderNumber,
          ...pendingData,
        }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            if (json.data.customer && json.data.customerToken) {
              autoLogin(json.data.customer, json.data.customerToken);
            }
            try {
              localStorage.removeItem("aao_pending_order");
            } catch (_) {}
          } else {
            setVerifyError(json.message || "Payment verification note");
          }
        })
        .catch((err) => {
          console.error("Failed to verify Stripe book session", err);
        })
        .finally(() => {
          setVerifying(false);
        });
    }
  }, [orderNumber, searchParams, clearCart, autoLogin]);

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.6]">
      <ScrollProgress />
      <SiteNav />
      <main className="py-[clamp(64px,10vw,120px)] text-center">
        <div className={shell}>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-3xl shadow-[0_0_24px_rgba(52,211,153,0.3)]">
            ✓
          </div>

          <span className="text-xs uppercase tracking-widest text-halo font-semibold mb-2 block">
            Thank you for your order
          </span>
          <h1 className={`${heading} text-[clamp(2.4rem,5vw,3.6rem)] text-vellum mb-4`}>
            Order Confirmed
          </h1>

          {verifying && (
            <div className="inline-flex items-center gap-2 rounded-full border border-halo/40 bg-halo/10 px-4 py-1.5 text-xs text-halo mb-4">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Finalizing verified Stripe payment…</span>
            </div>
          )}

          {verifyError && (
            <p className="text-xs text-amber-400 mb-4">{verifyError}</p>
          )}

          <div className="rounded-2xl border border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] p-6 my-8 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(237,231,218,0.1)] pb-3">
              <span className="text-xs text-dim">Order Number</span>
              <span className="font-mono font-bold text-halo text-base">{orderNumber}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[rgba(237,231,218,0.1)] pb-3">
              <span className="text-xs text-dim">Payment Status</span>
              <span className="text-xs font-semibold text-emerald-400">Paid via Stripe Gateway</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-dim">Estimated Dispatch</span>
              <span className="text-xs text-vellum">1–2 business days via Priority Mail</span>
            </div>
          </div>

          <p className="text-sm text-[#A9B0C2] mb-8 leading-relaxed max-w-md mx-auto">
            Your user account has been automatically created. You can track this order, view receipts, and manage all your sessions directly in your User Account.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={`/account?tab=orders&order=${encodeURIComponent(orderNumber || "")}`}
              className="rounded-full bg-halo px-6 py-3 text-xs font-bold text-void hover:bg-white transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(201,168,106,0.3)] no-underline"
            >
              Track in User Account →
            </Link>
            <Link
              to="/books"
              className="rounded-full border border-[rgba(237,231,218,0.25)] px-6 py-3 text-xs font-semibold text-vellum hover:border-halo transition-colors no-underline"
            >
              Return to Book Store
            </Link>
            <Link
              to="/"
              className="rounded-full border border-transparent px-5 py-3 text-xs font-semibold text-[#A9B0C2] hover:text-white transition-colors no-underline"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default OrderSuccess;
