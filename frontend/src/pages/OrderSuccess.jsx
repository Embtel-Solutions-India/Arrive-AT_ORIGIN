import { useEffect, useState, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import SEO from "../components/seo/SEO";
import { useCart } from "../context/CartContext";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { apiUrl } from "../utils/api";
import { getEbookPdfUrl, getEbookDownloadFilename } from "../utils/ebookUtils";

const shell = "mx-auto w-full max-w-[760px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.05] tracking-[-0.015em]";

function OrderSuccess() {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const { autoLogin } = useCustomerAuth();
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [readingBook, setReadingBook] = useState(null);
  const verifiedRef = useRef(false);

  // Fetch full verified order details and authenticate customer
  const loadOrderDetails = async () => {
    if (!orderNumber) return;
    try {
      const res = await fetch(apiUrl(`/public/orders/${encodeURIComponent(orderNumber)}`));
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setOrderData(json.data);
        if (json.data.customer && json.data.customerToken) {
          autoLogin(json.data.customer, json.data.customerToken);
        }
      }
    } catch (err) {
      console.warn("Failed to load order status:", err);
    }
  };

  useEffect(() => {
    // Clear cart immediately upon successful order landing
    clearCart();

    const sessionId = searchParams.get("session_id");
    if (sessionId && !verifiedRef.current) {
      verifiedRef.current = true;
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
            const msg = json.message || "";
            if (!msg.includes("duplicate key") && !msg.includes("E11000") && !msg.includes("already verified")) {
              setVerifyError(msg);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to verify Stripe book session", err);
        })
        .finally(() => {
          setVerifying(false);
          loadOrderDetails();
        });
    } else {
      // In all cases, load verified order status directly by orderNumber
      loadOrderDetails();
    }
  }, [orderNumber, searchParams]);

  const customerToken = orderData?.customerToken || "";
  const customerEmail = orderData?.customerInfo?.email || orderData?.customer?.email || "";
  const ebooks = orderData?.ebooks || [];
  const hasEbooks = orderData?.hasEbooks || ebooks.length > 0;

  // Seamless auto-auth links for the user
  const accountBooksUrl = `/account?tab=ebooks${
    customerToken ? `&token=${encodeURIComponent(customerToken)}` : ""
  }${customerEmail ? `&email=${encodeURIComponent(customerEmail)}` : ""}`;

  const accountOrderUrl = `/account?tab=orders&order=${encodeURIComponent(orderNumber || "")}${
    customerToken ? `&token=${encodeURIComponent(customerToken)}` : ""
  }${customerEmail ? `&email=${encodeURIComponent(customerEmail)}` : ""}`;

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.6]">
      <SEO
        title="Order Confirmation | Soul Body Healing Center"
        description="Your order has been confirmed successfully."
        noindex={true}
      />
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

          {/* Order Summary Strip */}
          <div className="rounded-2xl border border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] p-6 my-8 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(237,231,218,0.1)] pb-3">
              <span className="text-xs text-dim">Order Number</span>
              <span className="font-mono font-bold text-halo text-base">{orderNumber}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[rgba(237,231,218,0.1)] pb-3">
              <span className="text-xs text-dim">Payment Status</span>
              <span className="text-xs font-semibold text-emerald-400">
                {orderData?.paymentStatus === "PAID"
                  ? "Paid & Confirmed"
                  : "Paid via Stripe Gateway"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-dim">Fulfillment</span>
              <span className="text-xs text-vellum">
                {hasEbooks
                  ? "Instant E-Book Access Assigned to Your Account"
                  : "1–2 business days via Priority Mail"}
              </span>
            </div>
          </div>

          {/* Digital E-Book Library Callout (Always active & functional) */}
          <div className="rounded-2xl border border-[rgba(232,206,140,0.35)] bg-[rgba(232,206,140,0.08)] p-5 sm:p-6 mb-8 text-left backdrop-blur-sm shadow-[0_0_25px_rgba(232,206,140,0.12)]">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📖</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-base font-bold text-halo">E-Book Soft Copy Ready in Your Account</h3>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[0.68rem] font-bold px-2.5 py-0.5">
                    Instant Soft Copy
                  </span>
                </div>
                <p className="text-xs text-vellum/90 leading-relaxed mb-4">
                  Purchased digital editions and e-book PDFs are automatically assigned to your account. You can read online anytime or download the PDF file directly.
                </p>

                {/* Display Specific E-Books with Direct Read and Download Buttons */}
                {ebooks.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {ebooks.map((bk, idx) => {
                      const directPdf = getEbookPdfUrl(bk.pdfUrl || bk.readUrl || bk.downloadUrl, bk.slug || bk.title);
                      const readUrl = directPdf || bk.readUrl || "";
                      const downloadUrl = directPdf || bk.downloadUrl || "";
                      const hasPdf = Boolean(directPdf || bk.hasPdf);
                      const downloadFilename = getEbookDownloadFilename(bk.slug || bk.title);

                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[rgba(232,206,140,0.2)] bg-black/30"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {bk.coverImage && (
                              <img
                                src={bk.coverImage}
                                alt={bk.title}
                                className="h-12 w-9 rounded object-cover border border-white/10 shrink-0 shadow"
                              />
                            )}
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-vellum truncate">{bk.title}</h4>
                              <span className="text-[0.72rem] text-dim">{bk.format} • {bk.authorName}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {hasPdf ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setReadingBook({ title: bk.title, readUrl, slug: bk.slug })}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-halo px-3.5 py-2 text-xs font-bold text-void hover:bg-white transition-all shadow-[0_0_12px_rgba(201,168,106,0.3)] cursor-pointer"
                                >
                                  <span>📖 Read Now</span>
                                </button>
                                {downloadUrl && (
                                  <a
                                    href={downloadUrl}
                                    download={downloadFilename}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(237,231,218,0.2)] bg-white/5 px-3 py-2 text-xs font-semibold text-vellum hover:text-halo hover:border-halo transition-colors no-underline"
                                  >
                                    <span>⬇ Download</span>
                                  </a>
                                )}
                              </>
                            ) : (
                              <span className="text-[0.72rem] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1">
                                ⏳ PDF Being Prepared
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Primary Button to Open User Account Library */}
                <div className="pt-2">
                  <Link
                    to={accountBooksUrl}
                    className="inline-flex items-center gap-2 rounded-full bg-halo px-5 py-2.5 text-xs sm:text-sm font-bold text-void hover:bg-white transition-all shadow-[0_0_18px_rgba(201,168,106,0.35)] no-underline cursor-pointer"
                  >
                    <span>📖 Open &quot;My Books&quot; in User Account →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-[#A9B0C2] mb-8 leading-relaxed max-w-md mx-auto">
            Your user account has been automatically created. You can track this order, view receipts, and manage all your digital publications directly in your User Account.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={accountOrderUrl}
              className="rounded-full bg-halo px-6 py-3 text-xs font-bold text-void hover:bg-white transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(201,168,106,0.3)] no-underline cursor-pointer"
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

      {/* Online E-Book Reader Modal (In-Page on Order Success) */}
      {readingBook && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md p-2 sm:p-5">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-t-2xl border-t border-x border-[rgba(232,206,140,0.3)] bg-[#0E1630] px-5 py-3 shadow-2xl">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl">📖</span>
              <div className="min-w-0">
                <span className="text-[0.68rem] uppercase tracking-widest text-halo font-bold block">
                  Digital E-Book Reader • Arrive at Origin
                </span>
                <h2 className="text-sm sm:text-base font-semibold text-vellum truncate">
                  {readingBook.title}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={readingBook.readUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs text-dim hover:text-vellum hover:border-vellum transition-colors no-underline"
              >
                ↗ Full Tab
              </a>
              <button
                type="button"
                onClick={() => setReadingBook(null)}
                className="rounded-full bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs text-vellum hover:text-white transition-colors cursor-pointer font-semibold"
                title="Close Reader"
              >
                ✕ Close Reader
              </button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-6xl flex-1 rounded-b-2xl border-b border-x border-[rgba(232,206,140,0.3)] bg-[#070B18] overflow-hidden shadow-2xl relative">
            <iframe
              src={readingBook.readUrl}
              title={readingBook.title}
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderSuccess;
