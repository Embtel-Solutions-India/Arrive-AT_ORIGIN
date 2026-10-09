import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import Reveal from "../components/landing/Reveal";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { apiUrl } from "../utils/api";

const shell = "mx-auto w-full max-w-[1240px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.02] tracking-[-0.015em]";

// Predefined consultation packages & meetings (each with distinct pricing)
const DEFAULT_PACKAGES = [
  {
    id: "silver-single",
    name: "Silver - Single Consultation",
    meetingType: "1-on-1 Metaphysical Diagnostic & Counsel",
    sessionsCount: 1,
    duration: "1 Session",
    price: 250,
    currency: "USD",
    badge: "Starter",
    description: "Start your wellness journey – book a single 1-on-1 deep metaphysical session with Dr. Alka Chopra Madan.",
    features: [
      "Initial energetic & subconscious assessment",
      "Concept Clearing technique introduction",
      "Actionable holistic alignment roadmap",
      "Private session summary & recommendations",
    ],
  },
  {
    id: "relationship-alignment",
    name: "Relationship & Spiritual Harmony",
    meetingType: "Couples & Family Metaphysical Alignment",
    sessionsCount: 1,
    duration: "1 Session",
    price: 350,
    currency: "USD",
    badge: "Spiritual Alignment",
    description: "Specialized joint spiritual counsel, clearing relational conditioning and emotional discord.",
    features: [
      "Joint or family counsel",
      "Harmonization of interpersonal field",
      "Conflict clearing & meta-human communication",
      "Guided Living from Origin practices",
    ],
  },
  {
    id: "stress-grief-intensive",
    name: "Grief & Trauma Release Intensive",
    meetingType: "Emotional Freedom & Stress Alleviation",
    sessionsCount: 2,
    duration: "2 Sessions",
    price: 600,
    currency: "USD",
    badge: "Intensive",
    description: "Targeted metaphysical release of chronic grief, traumatic memory weight, and subconscious tension.",
    features: [
      "Two dedicated deep-dive sessions",
      "Somatic & metaphysical grief release",
      "Nervous system recalibration",
      "Direct follow-up check-in",
    ],
  },
  {
    id: "gold-package",
    name: "Gold - Wellness Series",
    meetingType: "5-Session Holistic Transformation Sequence",
    sessionsCount: 5,
    duration: "5 Sessions",
    price: 1250,
    currency: "USD",
    badge: "Most Popular",
    featured: true,
    description: "Boost your well-being with a comprehensive package of five curated metaphysical sessions.",
    features: [
      "Five scheduled transformation sessions",
      "Full Arrive at Origin (AAO) curriculum",
      "Ongoing personal energetic monitoring",
      "Priority scheduling & email support",
    ],
  },
  {
    id: "platinum-mastery",
    name: "Platinum - Life Transformation Experience",
    meetingType: "10-Session Comprehensive Metaphysical Mastery",
    sessionsCount: 10,
    duration: "10 Sessions",
    price: 2500,
    currency: "USD",
    badge: "Total Transformation",
    description: "Dive into a deeply transformative experience with ten sessions for total life calibration and spiritual freedom.",
    features: [
      "Ten scheduled transformation sessions",
      "Complete concept clearing & meta-human mastery",
      "Direct phone / priority access for urgent counsel",
      "Personalized meditation & contemplation roadmap",
    ],
  },
];

const TIME_SLOTS = [
  "10:00 AM PST",
  "11:30 AM PST",
  "02:00 PM PST",
  "04:00 PM PST",
  "05:30 PM PST",
];

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

function Schedule() {
  const { autoLogin } = useCustomerAuth();
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [razorpayKeyId, setRazorpayKeyId] = useState(
    import.meta.env.VITE_RAZORPAY_KEY_ID || ""
  );

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(DEFAULT_PACKAGES[0]);

  // Form Fields
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(getTomorrowDate());
  const [appointmentTime, setAppointmentTime] = useState(TIME_SLOTS[0]);
  const [meetingMode, setMeetingMode] = useState("ONLINE_ZOOM");
  const [notes, setNotes] = useState("");

  // Booking / Payment Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const discount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const finalPrice = Math.max(0, Number((selectedPackage.price - discount).toFixed(2)));

  useEffect(() => {
    window.scrollTo(0, 0);

    // Fetch dynamic packages from backend API
    fetch(apiUrl("/public/consultations/packages"))
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.packages?.length) {
          setPackages(json.data.packages);
          if (json.data.razorpayKeyId) {
            setRazorpayKeyId(json.data.razorpayKeyId);
          }
        }
      })
      .catch(() => {
        // Fallback to default packages
      });
  }, []);

  const openBookingModal = (pkg) => {
    setSelectedPackage(pkg);
    setErrorMsg("");
    setConfirmedBooking(null);
    setCouponInput("");
    setAppliedCoupon(null);
    setCouponError("");
    setCouponSuccess("");
    setIsModalOpen(true);
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setCouponSuccess("");
      setCouponError("Package changed. Please re-apply your coupon code.");
    }
  };

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const res = await fetch(apiUrl("/public/coupons/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          context: "CONSULTATION",
          amount: selectedPackage.price,
          currency: selectedPackage.currency || "USD",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Invalid coupon code");
      }

      setAppliedCoupon(json.data);
      const symbol = (selectedPackage.currency === "INR" || json.data.currency === "INR") ? "₹" : "$";
      setCouponSuccess(`Coupon ${json.data.code} applied! -${symbol}${Number(json.data.discountAmount).toFixed(2)} off`);
      setCouponInput("");
    } catch (err) {
      setCouponError(err.message || "Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess("");
    setCouponError("");
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim() || !appointmentDate || !appointmentTime) {
      setErrorMsg("Please complete all required fields (Name, Email, Date, Time).");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Initialize booking & create Razorpay order on backend
      const res = await fetch(apiUrl("/public/consultations/book"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim().toLowerCase(),
          clientPhone: clientPhone.trim(),
          appointmentDate,
          appointmentTime,
          meetingMode,
          notes: notes.trim(),
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Unable to initiate consultation booking.");
      }

      const orderData = json.data;

      // 2. Ensure Razorpay checkout script is available
      if (typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay payment gateway is loading. Please try again in a moment.");
      }

      // 3. Configure and open Razorpay Checkout modal
      const options = {
        key: orderData.keyId || razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency || "USD",
        name: "Soul Body Healing Center",
        description: `${selectedPackage.name} (${selectedPackage.meetingType})`,
        image: "/favicon.svg",
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: clientName,
          email: clientEmail,
          contact: clientPhone,
        },
        theme: {
          color: "#C9992E", // Gold brand accent
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        handler: async function (response) {
          try {
            setLoading(true);
            // 4. Verify payment signature on backend
            const verifyRes = await fetch(apiUrl("/public/consultations/verify-payment"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingNumber: orderData.bookingNumber,
              }),
            });

            const verifyJson = await verifyRes.json();
            if (!verifyRes.ok || !verifyJson.success) {
              throw new Error(verifyJson.message || "Payment signature verification failed.");
            }

            setConfirmedBooking(verifyJson.data.booking);
            if (verifyJson.data.customer && verifyJson.data.customerToken) {
              autoLogin(verifyJson.data.customer, verifyJson.data.customerToken);
            }
          } catch (verifyErr) {
            setErrorMsg(verifyErr.message || "Payment verification failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setErrorMsg(response.error?.description || "Payment was declined. Please try again.");
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred during booking.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.62] font-normal selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />

      <main id="top" className="py-[clamp(56px,8vw,110px)]">
        <div className={shell}>
          {/* Header Section */}
          <Reveal className="mb-[clamp(36px,5vw,64px)] max-w-[68ch]">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-[0.8rem] font-semibold text-halo tracking-wider uppercase mb-4">
              ✦ Online Video or In-Person Fremont Sanctuary
            </span>
            <h1 className={`${heading} mb-[0.34em] text-[clamp(2.4rem,6vw,4.6rem)]`}>
              Schedule a <span className="text-halo">Consultation</span>
            </h1>
            <p className="mb-5 border-l-4 border-gold pl-4 text-[1.1rem] text-[#C6CBD8]">
              “True healing begins when we embrace the power of our mind, body, and spirit in unison.”
            </p>
            <p className="text-[#C6CBD8]">
              Embark on your journey towards inner harmony, mental clarity, and spiritual resonance.
              Choose from our curated 1-on-1 consultations or comprehensive multi-session series.
              Every meeting is priced accordingly and processed through our verified, secure Razorpay gateway.
            </p>
          </Reveal>

          {/* Consultation Packages Grid */}
          <Reveal className="grid grid-cols-1 gap-[clamp(20px,3vw,32px)] md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <article
                key={pkg.id || pkg.name}
                className={`relative flex flex-col justify-between rounded-3xl border p-[clamp(24px,3vw,36px)] transition-all duration-300 hover:-translate-y-1.5 ${
                  pkg.featured
                    ? "border-halo bg-[rgba(232,206,140,0.08)] shadow-[0_12px_40px_-10px_rgba(232,206,140,0.18)]"
                    : "border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] hover:border-gold/50"
                }`}
              >
                {pkg.badge && (
                  <div className="absolute top-5 right-5">
                    <span
                      className={`inline-block rounded-full px-3 py-0.5 text-[0.72rem] font-bold tracking-wider uppercase ${
                        pkg.featured
                          ? "bg-halo text-void"
                          : "border border-gold/40 bg-gold/10 text-halo"
                      }`}
                    >
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <div>
                  <h2 className="mb-1 text-[1.3rem] font-semibold text-vellum">{pkg.name}</h2>
                  <p className="text-[0.82rem] font-medium text-halo/90 mb-4">{pkg.meetingType}</p>

                  <div className="mb-5 border-y border-[rgba(237,231,218,0.14)] py-4">
                    <div className="flex items-baseline gap-2">
                      <span className={`${heading} text-[clamp(2.2rem,3.8vw,3.2rem)] font-normal text-vellum`}>
                        ${pkg.price}
                      </span>
                      <span className="text-[0.9rem] text-dim">{pkg.currency || "USD"}</span>
                    </div>
                    <span className="inline-block text-[0.85rem] text-halo">
                      {pkg.duration || `${pkg.sessionsCount} Session(s)`}
                    </span>
                  </div>

                  <p className="mb-6 text-[0.92rem] text-[#A9B0C2] leading-relaxed">{pkg.description}</p>

                  {pkg.features && (
                    <ul className="mb-8 space-y-2.5 text-[0.84rem] text-[#C6CBD8]">
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="text-halo mt-0.5">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openBookingModal(pkg)}
                  className={`mt-auto inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full px-[24px] text-[0.95rem] font-bold cursor-pointer transition-all duration-200 ${
                    pkg.featured
                      ? "border border-halo bg-halo text-void hover:bg-white hover:border-white shadow-[0_4px_20px_rgba(232,206,140,0.3)]"
                      : "border border-gold/70 bg-transparent text-vellum hover:bg-gold hover:text-void"
                  }`}
                >
                  <span>Book Meeting • ${pkg.price}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </article>
            ))}
          </Reveal>

          {/* Contact and FAQ note */}
          <div className="mt-14 rounded-2xl border border-[rgba(237,231,218,0.1)] bg-[rgba(237,231,218,0.02)] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-[70ch]">
              <h3 className="font-display text-[1.2rem] text-vellum mb-1">Need a custom counsel or corporate session?</h3>
              <p className="text-[0.9rem] text-dim">
                Sessions are held online worldwide (Zoom / Google Meet) or in-person at our sanctuary in Fremont, CA.
                For inquiries or emergency scheduling, connect directly with our support desk.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[0.9rem]">
              <a
                href="tel:+15108308771"
                className="rounded-full border border-gold/40 px-5 py-2.5 text-halo hover:border-halo transition-colors"
              >
                📞 +1 (510) 830-8771
              </a>
              <a
                href="mailto:info@soulbodyhealingcenter.com"
                className="rounded-full border border-[rgba(237,231,218,0.2)] px-5 py-2.5 text-vellum hover:border-vellum transition-colors"
              >
                ✉️ Email Us
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* Interactive Consultation Booking Modal with Real-time Razorpay Checkout   */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#070B18]/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[rgba(232,206,140,0.25)] bg-[#0E1630] p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close booking modal"
              className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(237,231,218,0.15)] bg-white/5 text-dim hover:text-vellum hover:bg-white/10 transition-colors cursor-pointer"
            >
              ✕
            </button>

            {confirmedBooking ? (
              /* Booking Success Confirmation View */
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.3)]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>

                <span className="text-[0.75rem] font-bold tracking-widest text-emerald-400 uppercase">
                  Payment Verified via Razorpay
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-vellum mt-1 mb-2">
                  Consultation Confirmed!
                </h2>
                <p className="text-[0.92rem] text-dim max-w-[50ch] mx-auto mb-6">
                  Thank you, <strong className="text-vellum">{confirmedBooking.clientName}</strong>. Your appointment has
                  been officially registered and scheduled with Dr. Alka Chopra Madan.
                </p>

                {/* Confirmed Details Card */}
                <div className="mx-auto max-w-lg rounded-2xl border border-[rgba(237,231,218,0.12)] bg-[#070B18]/70 p-5 text-left text-[0.88rem] space-y-3 mb-6">
                  <div className="flex justify-between border-b border-white/10 pb-2.5">
                    <span className="text-dim">Booking Reference:</span>
                    <span className="font-mono font-bold text-halo">{confirmedBooking.bookingNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2.5">
                    <span className="text-dim">Meeting Package:</span>
                    <span className="text-vellum font-medium">{confirmedBooking.packageName}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2.5">
                    <span className="text-dim">Date & Time:</span>
                    <span className="text-vellum font-medium">
                      {confirmedBooking.appointmentDate} at {confirmedBooking.appointmentTime}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2.5">
                    <span className="text-dim">Meeting Format:</span>
                    <span className="text-vellum font-medium">
                      {confirmedBooking.meetingMode === "ONLINE_ZOOM"
                        ? "🌐 Online Video (Zoom/Meet)"
                        : "🏛️ In-Person Sanctuary (Fremont, CA)"}
                    </span>
                  </div>
                  {confirmedBooking.couponCode && (
                    <div className="flex justify-between border-b border-white/10 pb-2.5">
                      <span className="text-dim">Coupon Applied:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {confirmedBooking.couponCode}
                        {confirmedBooking.discount ? ` (-$${confirmedBooking.discount})` : ""}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-dim">Amount Paid:</span>
                    <span className="font-bold text-emerald-400">${confirmedBooking.price} USD</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gold/20 bg-gold/5 text-[0.84rem] text-dim mb-6 text-left">
                  <p className="font-semibold text-halo mb-1">✦ What happens next:</p>
                  <p className="mb-2">
                    A private calendar invitation with session access details has been dispatched to{" "}
                    <strong className="text-vellum">{confirmedBooking.clientEmail}</strong>. Please ensure you are in a quiet,
                    grounded space 5 minutes before your scheduled start.
                  </p>
                  <p className="text-emerald-300/90 text-[0.8rem] pt-2 border-t border-gold/15">
                    ✨ Your client account has been automatically created! You can view and manage your booked sessions anytime.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/account"
                    className="w-full sm:w-auto rounded-full bg-halo px-7 py-3 text-[0.92rem] font-bold text-void hover:bg-white transition-colors cursor-pointer text-center"
                  >
                    View in My Account & Sessions →
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedBooking(null);
                      setIsModalOpen(false);
                    }}
                    className="w-full sm:w-auto rounded-full border border-[rgba(237,231,218,0.2)] px-6 py-3 text-[0.92rem] text-vellum hover:border-halo transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedBooking(null);
                      setClientName("");
                      setClientEmail("");
                      setClientPhone("");
                      setNotes("");
                    }}
                    className="w-full sm:w-auto rounded-full border border-[rgba(237,231,218,0.15)] px-5 py-3 text-[0.86rem] text-dim hover:text-vellum transition-colors cursor-pointer"
                  >
                    Book Another
                  </button>
                </div>
              </div>
            ) : (
              /* Booking & Payment Form */
              <div>
                <div className="mb-6">
                  <span className="text-[0.72rem] font-bold tracking-widest text-halo uppercase">
                    Soul Body Healing Center
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl text-vellum mt-1">
                    Book Consultation Meeting
                  </h2>
                  <p className="text-[0.88rem] text-dim mt-1">
                    Select your preferred meeting format, date, and complete payment via Razorpay.
                  </p>
                </div>

                <form onSubmit={handleProceedToPayment} className="space-y-5">
                  {/* Meeting Package Selector (Every meeting has a different price!) */}
                  <div>
                    <label className="block text-[0.82rem] font-semibold text-vellum mb-2">
                      1. Select Meeting / Consultation Package (Priced Accordingly):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {packages.map((pkg) => {
                        const isSelected = selectedPackage.id === pkg.id;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => handleSelectPackage(pkg)}
                            className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "border-halo bg-halo/10 shadow-[0_0_15px_rgba(232,206,140,0.15)]"
                                : "border-[rgba(237,231,218,0.12)] bg-white/5 hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[0.88rem] text-vellum">{pkg.name}</span>
                              <span className="font-bold text-halo text-[0.92rem]">${pkg.price}</span>
                            </div>
                            <span className="text-[0.76rem] text-dim mt-0.5">{pkg.duration}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Meeting Mode (Online vs In-Person) */}
                  <div>
                    <label className="block text-[0.82rem] font-semibold text-vellum mb-2">
                      2. Session Format:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setMeetingMode("ONLINE_ZOOM")}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-[0.86rem] font-medium transition-colors cursor-pointer ${
                          meetingMode === "ONLINE_ZOOM"
                            ? "border-halo bg-halo/15 text-halo"
                            : "border-[rgba(237,231,218,0.12)] text-dim hover:text-vellum"
                        }`}
                      >
                        <span>🌐 Online Video Session</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeetingMode("IN_PERSON_FREMONT")}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-[0.86rem] font-medium transition-colors cursor-pointer ${
                          meetingMode === "IN_PERSON_FREMONT"
                            ? "border-halo bg-halo/15 text-halo"
                            : "border-[rgba(237,231,218,0.12)] text-dim hover:text-vellum"
                        }`}
                      >
                        <span>🏛️ Fremont Sanctuary</span>
                      </button>
                    </div>
                  </div>

                  {/* Date & Time Slot */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="booking-date" className="block text-[0.82rem] font-semibold text-vellum mb-1.5">
                        3. Appointment Date:
                      </label>
                      <input
                        id="booking-date"
                        type="date"
                        min={getTomorrowDate()}
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        required
                        className="w-full rounded-xl border border-[rgba(237,231,218,0.15)] bg-white/5 px-3.5 py-2.5 text-[0.88rem] text-vellum focus:border-halo focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[0.82rem] font-semibold text-vellum mb-1.5">
                        4. Preferred Time Slot:
                      </label>
                      <select
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full rounded-xl border border-[rgba(237,231,218,0.15)] bg-[#070B18] px-3.5 py-2.5 text-[0.88rem] text-vellum focus:border-halo focus:outline-none"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="space-y-3 pt-1">
                    <label className="block text-[0.82rem] font-semibold text-vellum">
                      5. Your Contact Information:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Your Full Name *"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          required
                          className="w-full rounded-xl border border-[rgba(237,231,218,0.15)] bg-white/5 px-3.5 py-2.5 text-[0.88rem] text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="Email Address *"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          required
                          className="w-full rounded-xl border border-[rgba(237,231,218,0.15)] bg-white/5 px-3.5 py-2.5 text-[0.88rem] text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="tel"
                          placeholder="Phone / WhatsApp (Optional)"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full rounded-xl border border-[rgba(237,231,218,0.15)] bg-white/5 px-3.5 py-2.5 text-[0.88rem] text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Focus areas (e.g. grief, stress, purpose)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full rounded-xl border border-[rgba(237,231,218,0.15)] bg-white/5 px-3.5 py-2.5 text-[0.88rem] text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Promo / Coupon Code Section */}
                  <div className="rounded-2xl border border-[rgba(237,231,218,0.12)] bg-[#070B18]/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[0.82rem] font-semibold text-vellum flex items-center gap-1.5">
                        <span>🎟️</span>
                        <span>Have a Promo or Coupon Code?</span>
                      </label>
                      {appliedCoupon && (
                        <span className="text-[0.7rem] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          COUPON APPLIED
                        </span>
                      )}
                    </div>

                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-300 text-[0.85rem]">
                              {appliedCoupon.code}
                            </span>
                            <span className="text-emerald-400 font-semibold">
                              (-${discount.toFixed(2)})
                            </span>
                          </div>
                          {appliedCoupon.description && (
                            <p className="text-[0.72rem] text-dim truncate mt-0.5">
                              {appliedCoupon.description}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[0.76rem] text-red-400 hover:text-red-300 ml-3 font-semibold cursor-pointer shrink-0"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. WELCOME10, HEALING50"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                            className="flex-1 rounded-xl border border-[rgba(237,231,218,0.15)] bg-white/5 px-3.5 py-2 text-xs font-mono uppercase text-vellum placeholder-dim/40 focus:border-halo focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponInput.trim()}
                            className="rounded-xl border border-halo bg-halo/15 px-4 py-2 text-xs font-semibold text-halo hover:bg-halo hover:text-void transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                          >
                            {couponLoading ? "Checking…" : "Apply Code"}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[0.76rem] text-red-400 mt-2 flex items-center gap-1">
                            <span>⚠️</span> {couponError}
                          </p>
                        )}
                        {couponSuccess && (
                          <p className="text-[0.76rem] text-emerald-400 mt-2 flex items-center gap-1">
                            <span>✓</span> {couponSuccess}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Summary & Price Display */}
                  <div className="rounded-2xl border border-[rgba(232,206,140,0.2)] bg-[#070B18]/70 p-4 space-y-2">
                    <div className="flex items-center justify-between text-[0.88rem] text-dim">
                      <span>Selected Meeting:</span>
                      <span className="text-vellum font-medium">{selectedPackage.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[0.88rem] text-dim">
                      <span>Sessions Included:</span>
                      <span>{selectedPackage.duration || `${selectedPackage.sessionsCount} Session${selectedPackage.sessionsCount > 1 ? "s" : ""}`}</span>
                    </div>
                    <div className="flex items-center justify-between text-[0.88rem] text-dim">
                      <span>Standard Package Price:</span>
                      <span className={appliedCoupon ? "line-through text-dim" : "text-vellum"}>
                        ${selectedPackage.price} {selectedPackage.currency || "USD"}
                      </span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-[0.88rem] text-emerald-400">
                        <span className="flex items-center gap-1">
                          <span>Coupon Discount ({appliedCoupon.code}):</span>
                        </span>
                        <span className="font-semibold">-${discount.toFixed(2)} USD</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[1.05rem]">
                      <span className="font-semibold text-vellum">Total Fee to Pay:</span>
                      <div className="text-right">
                        <span className="font-bold text-halo text-[1.25rem]">
                          ${finalPrice.toFixed(2)} {selectedPackage.currency || "USD"}
                        </span>
                        {discount > 0 && (
                          <span className="block text-[0.72rem] text-emerald-400 font-medium">
                            You save ${discount.toFixed(2)}!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Error Announcement */}
                  {errorMsg && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-[0.84rem] text-red-300">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  {/* Pay with Razorpay Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full border border-halo bg-halo py-3.5 px-6 font-bold text-void text-[0.95rem] hover:bg-white hover:border-white transition-all shadow-[0_4px_24px_rgba(232,206,140,0.35)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin text-void" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Processing Razorpay Portal…</span>
                        </>
                      ) : (
                        <>
                          <span>Pay ${finalPrice.toFixed(2)} via Razorpay & Confirm</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                        </>
                      )}
                    </button>
                    <div className="mt-2.5 flex items-center justify-center gap-2 text-[0.74rem] text-dim">
                      <span>🔒 256-bit Encrypted Checkout</span>
                      <span>•</span>
                      <span>Verified Razorpay Gateway</span>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

export default Schedule;
