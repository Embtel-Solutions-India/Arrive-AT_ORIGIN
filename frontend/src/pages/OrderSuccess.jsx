import { Link, useParams } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";

const shell = "mx-auto w-full max-w-[700px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.05] tracking-[-0.015em]";

function OrderSuccess() {
  const { orderNumber } = useParams();

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.6]">
      <ScrollProgress />
      <SiteNav />
      <main className="py-[clamp(64px,10vw,120px)] text-center">
        <div className={shell}>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-3xl">
            ✓
          </div>

          <span className="text-xs uppercase tracking-widest text-halo font-semibold mb-2 block">
            Thank you for your order
          </span>
          <h1 className={`${heading} text-[clamp(2.4rem,5vw,3.6rem)] text-vellum mb-4`}>
            Order Confirmed
          </h1>

          <div className="rounded-2xl border border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] p-6 my-8 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(237,231,218,0.1)] pb-3">
              <span className="text-xs text-dim">Order Number</span>
              <span className="font-mono font-bold text-halo text-base">{orderNumber}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[rgba(237,231,218,0.1)] pb-3">
              <span className="text-xs text-dim">Payment Status</span>
              <span className="text-xs font-semibold text-emerald-400">Paid (Recorded in MongoDB)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-dim">Estimated Dispatch</span>
              <span className="text-xs text-vellum">1–2 business days via Priority Mail</span>
            </div>
          </div>

          <p className="text-sm text-[#A9B0C2] mb-8 leading-relaxed max-w-md mx-auto">
            Your client account has been automatically created. You can track this order, view receipts, and manage all your sessions directly in your Account Portal.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/account"
              className="rounded-full bg-halo px-6 py-3 text-xs font-bold text-void hover:bg-white transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(201,168,106,0.3)] no-underline"
            >
              View in My Account & Orders →
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
