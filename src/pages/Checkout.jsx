import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import { useCart } from "../context/CartContext";
import { useCustomerAuth } from "../context/CustomerAuthContext";

const shell = "mx-auto w-full max-w-[1100px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.05] tracking-[-0.015em]";
const money = (n) => `$${(n || 0).toFixed(2)}`;

function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { autoLogin } = useCustomerAuth();

  const shipping = subtotal >= 50 ? 0 : 5;
  const tax = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));

  // Customer & Shipping Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("United States");
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!name || !email || !street || !city || !state || !postalCode) {
      setErrorMsg("Please fill in all required shipping and contact fields.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Your cart is empty.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      if (paymentMethod === "Razorpay") {
        // 1. Create Razorpay order on backend
        const rzpRes = await fetch("/api/public/orders/razorpay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity, format: i.format })),
            customerInfo: { name, email, phone },
          }),
        });

        const rzpData = await rzpRes.json();
        if (!rzpRes.ok || !rzpData.success) {
          throw new Error(rzpData.message || "Failed to initialize Razorpay order.");
        }

        const { razorpayOrderId, amount, currency, keyId } = rzpData.data;

        if (typeof window.Razorpay === "undefined") {
          throw new Error("Razorpay gateway is initializing. Please try again in a few seconds.");
        }

        const options = {
          key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TkLddG9htwxQbf",
          amount,
          currency: currency || "USD",
          name: "Soul Body Healing Center",
          description: "Online Book Store Order",
          image: "/favicon.svg",
          order_id: razorpayOrderId,
          prefill: { name, email, contact: phone },
          theme: { color: "#C9992E" },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
          handler: async function (response) {
            try {
              setLoading(true);
              const res = await fetch("/api/public/orders/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customerInfo: { name, email, phone },
                  items: items.map((i) => ({
                    bookId: i.bookId,
                    quantity: i.quantity,
                    format: i.format,
                  })),
                  shippingAddress: { street, city, state, postalCode, country },
                  paymentMethod: "Razorpay",
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });

              const json = await res.json();
              if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to process order.");
              }

              if (json.data?.customer && json.data?.customerToken) {
                autoLogin(json.data.customer, json.data.customerToken);
              }

              clearCart();
              navigate(`/order-success/${json.data.orderNumber}`);
            } catch (postErr) {
              setErrorMsg(postErr.message || "Failed to finalize order.");
            } finally {
              setLoading(false);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          setErrorMsg(response.error?.description || "Payment failed.");
          setLoading(false);
        });
        rzp.open();
        return;
      }

      // Default simulated flow
      const res = await fetch("/api/public/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerInfo: { name, email, phone },
          items: items.map((i) => ({
            bookId: i.bookId,
            quantity: i.quantity,
            format: i.format,
          })),
          shippingAddress: { street, city, state, postalCode, country },
          paymentMethod,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to process order.");
      }

      if (json.data?.customer && json.data?.customerToken) {
        autoLogin(json.data.customer, json.data.customerToken);
      }

      clearCart();
      navigate(`/order-success/${json.data.orderNumber}`);
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred during checkout.");
    } finally {
      if (paymentMethod !== "Razorpay") {
        setLoading(false);
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-svh bg-void text-vellum">
        <ScrollProgress />
        <SiteNav />
        <main className="py-24 text-center">
          <div className={shell}>
            <span className="text-4xl mb-3 block">🛒</span>
            <h1 className={`${heading} text-3xl mb-3`}>Your cart is currently empty</h1>
            <p className="text-dim mb-6 text-sm">Add publications to your bag before proceeding to checkout.</p>
            <Link
              to="/books"
              className="inline-block rounded-full bg-halo px-6 py-3 text-sm font-bold text-void hover:bg-white transition-colors"
            >
              Browse Book Store
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.6] selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />
      <main className="py-[clamp(48px,6vw,96px)]">
        <div className={shell}>
          <div className="mb-8 border-b border-[rgba(237,231,218,0.12)] pb-6">
            <h1 className={`${heading} text-[clamp(2.2rem,4vw,3.2rem)] text-vellum`}>
              Secure Checkout
            </h1>
            <p className="text-sm text-dim mt-1">Direct author shipment from Soul Body Healing Center.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
            {/* Left Form: Contact & Shipping (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Contact Information */}
              <div className="rounded-2xl border border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] p-6 sm:p-8">
                <h2 className={`${heading} text-xl text-vellum mb-4`}>1. Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#C6CBD8] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maya Thompson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-[rgba(237,231,218,0.2)] bg-black/40 px-3.5 py-2.5 text-sm text-vellum placeholder:text-dim focus:border-halo focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#C6CBD8] mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="maya@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-[rgba(237,231,218,0.2)] bg-black/40 px-3.5 py-2.5 text-sm text-vellum placeholder:text-dim focus:border-halo focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#C6CBD8] mb-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-[rgba(237,231,218,0.2)] bg-black/40 px-3.5 py-2.5 text-sm text-vellum placeholder:text-dim focus:border-halo focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-2xl border border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] p-6 sm:p-8">
                <h2 className={`${heading} text-xl text-vellum mb-4`}>2. Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#C6CBD8] mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 742 Evergreen Terrace"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full rounded-xl border border-[rgba(237,231,218,0.2)] bg-black/40 px-3.5 py-2.5 text-sm text-vellum placeholder:text-dim focus:border-halo focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#C6CBD8] mb-1">City *</label>
                      <input
                        type="text"
                        required
                        placeholder="San Francisco"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full rounded-xl border border-[rgba(237,231,218,0.2)] bg-black/40 px-3.5 py-2.5 text-sm text-vellum placeholder:text-dim focus:border-halo focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#C6CBD8] mb-1">State / Province *</label>
                      <input
                        type="text"
                        required
                        placeholder="CA"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full rounded-xl border border-[rgba(237,231,218,0.2)] bg-black/40 px-3.5 py-2.5 text-sm text-vellum placeholder:text-dim focus:border-halo focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#C6CBD8] mb-1">Postal Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="94107"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full rounded-xl border border-[rgba(237,231,218,0.2)] bg-black/40 px-3.5 py-2.5 text-sm text-vellum placeholder:text-dim focus:border-halo focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#C6CBD8] mb-1">Country</label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full rounded-xl border border-[rgba(237,231,218,0.2)] bg-black/40 px-3.5 py-2.5 text-sm text-vellum focus:outline-none"
                      >
                        <option value="United States" className="bg-[#14161f]">United States</option>
                        <option value="Canada" className="bg-[#14161f]">Canada</option>
                        <option value="United Kingdom" className="bg-[#14161f]">United Kingdom</option>
                        <option value="Australia" className="bg-[#14161f]">Australia</option>
                        <option value="International" className="bg-[#14161f]">Other International</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-2xl border border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] p-6 sm:p-8">
                <h2 className={`${heading} text-xl text-vellum mb-4`}>3. Payment Authorization</h2>
                
                <div className="space-y-3 mb-4">
                  <label
                    onClick={() => setPaymentMethod("Razorpay")}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === "Razorpay"
                        ? "border-halo bg-halo/10"
                        : "border-[rgba(237,231,218,0.12)] bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "Razorpay"}
                      onChange={() => setPaymentMethod("Razorpay")}
                      className="mt-1 accent-halo"
                    />
                    <div>
                      <div className="font-semibold text-vellum text-sm flex items-center gap-2">
                        <span>Razorpay Gateway (Cards, UPI, Netbanking)</span>
                        <span className="text-[0.7rem] bg-halo/20 text-halo px-2 py-0.5 rounded-full font-bold">
                          Test Key: rzp_test_TkLdd...
                        </span>
                      </div>
                      <p className="text-xs text-dim mt-0.5">
                        Interactive checkout window powered by Razorpay. Test cards and UPI simulated flows supported.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setPaymentMethod("Credit Card (Visa ···· 4242)")}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod !== "Razorpay"
                        ? "border-halo bg-halo/10"
                        : "border-[rgba(237,231,218,0.12)] bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod !== "Razorpay"}
                      onChange={() => setPaymentMethod("Credit Card (Visa ···· 4242)")}
                      className="mt-1 accent-halo"
                    />
                    <div>
                      <div className="font-semibold text-vellum text-sm">Instant Card Simulation (Visa ···· 4242)</div>
                      <p className="text-xs text-dim mt-0.5">
                        Direct 1-click test checkout simulated in local test environment.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="rounded-xl border border-halo/30 bg-halo/5 p-3.5 text-xs text-[#E0C9A6] space-y-1">
                  <p className="font-semibold">🔒 End-to-End SSL Encrypted</p>
                  <p className="text-dim">
                    Real orders and customer analytics will instantly populate in the Soul Body Admin Portal.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Summary: Cart Items & Totals (5 cols) */}
            <div className="lg:col-span-5 sticky top-28 space-y-6">
              <div className="rounded-2xl border border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] p-6 sm:p-8">
                <h3 className={`${heading} text-xl text-vellum mb-4`}>Order Summary</h3>

                {/* Items */}
                <div className="divide-y divide-[rgba(237,231,218,0.08)] max-h-64 overflow-y-auto mb-4">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-3">
                      <img
                        src={it.coverImage}
                        alt={it.title}
                        className="h-12 w-9 rounded object-cover border border-white/10 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-vellum truncate">{it.title}</h4>
                        <p className="text-[0.7rem] text-dim">
                          {it.format} · Qty: {it.quantity}
                        </p>
                      </div>
                      <div className="text-xs font-semibold text-vellum">
                        {money(it.price * it.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation */}
                <div className="border-t border-[rgba(237,231,218,0.1)] pt-4 space-y-2 text-xs text-[#A9B0C2]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-white">{money(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "FREE" : money(shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Sales Tax (5%)</span>
                    <span>{money(tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[rgba(237,231,218,0.1)] pt-3 text-base font-bold text-white">
                    <span>Total Due</span>
                    <span className="text-halo">{money(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full rounded-full bg-halo py-3.5 text-center text-sm font-bold text-void hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Processing Order…" : `Place Order · ${money(total)}`}
                </button>

                <p className="mt-3 text-center text-[0.7rem] text-dim">
                  By clicking Place Order, you confirm your shipping address and order details.
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Checkout;
