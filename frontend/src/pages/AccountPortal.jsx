import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import Reveal from "../components/landing/Reveal";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { currencyService } from "../services/currencyService";

const shell = "mx-auto w-full max-w-[1140px] px-[clamp(20px,4vw,48px)]";
const heading = "font-display font-light leading-[1.05] tracking-[-0.015em]";

function AccountPortal() {
  const { customer, isAuthenticated, portalData, loading, login, signup, forgotPassword, resetPassword, logout } = useCustomerAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetToken = searchParams.get("token") || "";
  const urlMode = searchParams.get("mode");
  const isResetFlow = urlMode === "reset" && !!resetToken;

  const urlTab = searchParams.get("tab");
  const urlOrder = searchParams.get("order") || "";
  const urlBooking = searchParams.get("booking") || "";
  const urlEmail = searchParams.get("email") || "";

  const initialTab =
    urlTab === "orders" || !!urlOrder
      ? "orders"
      : urlTab === "sessions" || !!urlBooking
      ? "sessions"
      : "sessions";

  const [activeTab, setActiveTab] = useState(initialTab); // "sessions" | "orders" | "profile"
  const [authMode, setAuthMode] = useState(isResetFlow ? "reset" : "login"); // "login" | "signup" | "forgot" | "reset"

  useEffect(() => {
    if (urlMode === "reset" && resetToken) {
      navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`, { replace: true });
    }
  }, [urlMode, resetToken, navigate]);

  useEffect(() => {
    if (urlTab === "orders" || urlOrder) {
      setActiveTab("orders");
    } else if (urlTab === "sessions" || urlBooking) {
      setActiveTab("sessions");
    }
  }, [urlTab, urlOrder, urlBooking]);

  // Login form state
  const [emailInput, setEmailInput] = useState(urlEmail || "");
  const [passwordInput, setPasswordInput] = useState("");

  useEffect(() => {
    if (urlEmail && !emailInput) {
      setEmailInput(urlEmail);
    }
  }, [urlEmail]);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Reset password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setFormError("Please enter your email address");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      await login(emailInput.trim(), passwordInput.trim());
    } catch (err) {
      setFormError(err.message || "Failed to sign in. Please verify your email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signupName.trim()) {
      setFormError("Please enter your full name");
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes("@")) {
      setFormError("Please enter a valid email address");
      return;
    }
    if (signupPassword.length < 6) {
      setFormError("Password must be at least 6 characters long");
      return;
    }
    if (signupPassword !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      await signup({
        name: signupName.trim(),
        email: signupEmail.trim(),
        phone: signupPhone.trim(),
        password: signupPassword,
      });
    } catch (err) {
      setFormError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes("@")) {
      setFormError("Please enter a valid email address");
      return;
    }
    setIsSubmitting(true);
    setFormError("");
    setSuccessMsg("");
    try {
      const msg = await forgotPassword(forgotEmail.trim());
      setSuccessMsg(msg || "A password reset link has been dispatched to your email.");
    } catch (err) {
      setFormError(err.message || "Failed to process request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setFormError("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFormError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    setFormError("");
    setSuccessMsg("");
    try {
      await resetPassword(resetToken, newPassword);
      setSearchParams({});
      setSuccessMsg("Your password has been successfully reset! Welcome back.");
    } catch (err) {
      setFormError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sessions = portalData?.sessions || [];
  const orders = portalData?.orders || [];
  const stats = portalData?.stats || { sessionsCount: 0, ordersCount: 0, totalSpent: 0 };

  useEffect(() => {
    if (urlOrder && orders.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`order-${urlOrder}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 200);
    } else if (urlBooking && sessions.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`booking-${urlBooking}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 200);
    }
  }, [urlOrder, urlBooking, orders.length, sessions.length, activeTab]);

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.62] selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />

      <main className="py-[clamp(48px,6vw,96px)]">
        <div className={shell}>
          {(!isAuthenticated || isResetFlow) ? (
            /* ========================================================= */
            /* Unauthenticated View: 2 Options (Log In vs Sign Up)       */
            /* ========================================================= */
            <Reveal className="mx-auto max-w-lg">
              <div className="rounded-3xl border border-[rgba(232,206,140,0.25)] bg-[#0E1630]/90 p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(232,206,140,0.3)] bg-[rgba(232,206,140,0.1)] text-halo shadow-[0_0_20px_rgba(232,206,140,0.2)]">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>

                <span className="text-[0.72rem] font-bold tracking-widest text-halo uppercase">
                  User Account
                </span>

                {/* Tab Switcher - only when in login or signup mode */}
                {(authMode === "login" || authMode === "signup") && (
                  <div className="my-5 flex rounded-2xl bg-white/5 p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setFormError("");
                        setSuccessMsg("");
                      }}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        authMode === "login"
                          ? "bg-halo text-void shadow-md"
                          : "text-dim hover:text-vellum"
                      }`}
                    >
                      Log In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("signup");
                        setFormError("");
                        setSuccessMsg("");
                      }}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        authMode === "signup"
                          ? "bg-halo text-void shadow-md"
                          : "text-dim hover:text-vellum"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                )}

                {authMode === "login" ? (
                  /* Option 1: Log In */
                  <>
                    {urlOrder && (
                      <div className="mb-5 rounded-2xl border border-[rgba(232,206,140,0.3)] bg-[rgba(232,206,140,0.08)] p-4 text-left">
                        <div className="flex items-center gap-1.5 text-halo text-xs font-bold uppercase tracking-wider mb-1">
                          <span>📦 Tracking Order #{urlOrder}</span>
                        </div>
                        <p className="text-xs text-vellum/90">
                          Sign in below to view your real-time fulfillment status, tracking link, and receipt.
                        </p>
                      </div>
                    )}
                    {urlBooking && !urlOrder && (
                      <div className="mb-5 rounded-2xl border border-[rgba(232,206,140,0.3)] bg-[rgba(232,206,140,0.08)] p-4 text-left">
                        <div className="flex items-center gap-1.5 text-halo text-xs font-bold uppercase tracking-wider mb-1">
                          <span>✦ Appointment #{urlBooking}</span>
                        </div>
                        <p className="text-xs text-vellum/90">
                          Sign in below to view your scheduled consultation date, time, and session access link.
                        </p>
                      </div>
                    )}

                    <h1 className={`${heading} text-2xl sm:text-3xl text-vellum mb-2`}>
                      Welcome Back
                    </h1>
                    <p className="text-[0.86rem] text-dim mb-6 leading-relaxed">
                      Sign in to view your scheduled sessions, book orders, and profile details.
                    </p>

                    <form onSubmit={handleSignIn} className="space-y-4 text-left">
                      <div>
                        <label htmlFor="portal-email" className="block text-xs font-semibold text-vellum mb-1.5">
                          Email Address *
                        </label>
                        <input
                          id="portal-email"
                          type="email"
                          placeholder="e.g. client@example.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          required
                          className="w-full rounded-xl border border-[rgba(237,231,218,0.18)] bg-white/5 px-4 py-2.5 text-sm text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="portal-password" className="block text-xs font-semibold text-vellum">
                            Password
                          </label>
                          <span className="text-[0.72rem] text-dim">
                            (Optional if booked previously)
                          </span>
                        </div>
                        <input
                          id="portal-password"
                          type="password"
                          placeholder="••••••••"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          className="w-full rounded-xl border border-[rgba(237,231,218,0.18)] bg-white/5 px-4 py-2.5 text-sm text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                        />
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[0.72rem] text-dim/75">
                            Leave empty if booked without password
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode("forgot");
                              setFormError("");
                              setSuccessMsg("");
                            }}
                            className="text-[0.75rem] text-halo hover:underline cursor-pointer font-medium"
                          >
                            Forgot password?
                          </button>
                        </div>
                      </div>

                      {formError && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                          ⚠️ {formError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full border border-halo bg-halo py-3 text-sm font-bold text-void hover:bg-white hover:border-white transition-all shadow-[0_4px_20px_rgba(232,206,140,0.3)] disabled:opacity-60 cursor-pointer"
                      >
                        {isSubmitting ? "Signing in…" : "Log In to My Account"}
                      </button>
                    </form>

                    <p className="mt-5 text-xs text-dim">
                      Don't have an account yet?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("signup");
                          setFormError("");
                        }}
                        className="text-halo font-semibold hover:underline cursor-pointer"
                      >
                        Create an account →
                      </button>
                    </p>
                  </>
                ) : authMode === "signup" ? (
                  /* Option 2: Sign Up */
                  <>
                    <h1 className={`${heading} text-2xl sm:text-3xl text-vellum mb-2`}>
                      Create Your Account
                    </h1>
                    <p className="text-[0.86rem] text-dim mb-6 leading-relaxed">
                      Create a client account to manage your wellness sessions and book orders.
                    </p>

                    <form onSubmit={handleSignUp} className="space-y-4 text-left">
                      <div>
                        <label htmlFor="signup-name" className="block text-xs font-semibold text-vellum mb-1.5">
                          Full Name *
                        </label>
                        <input
                          id="signup-name"
                          type="text"
                          placeholder="Your Name"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          required
                          className="w-full rounded-xl border border-[rgba(237,231,218,0.18)] bg-white/5 px-4 py-2.5 text-sm text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="signup-email" className="block text-xs font-semibold text-vellum mb-1.5">
                          Email Address *
                        </label>
                        <input
                          id="signup-email"
                          type="email"
                          placeholder="client@example.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          className="w-full rounded-xl border border-[rgba(237,231,218,0.18)] bg-white/5 px-4 py-2.5 text-sm text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="signup-phone" className="block text-xs font-semibold text-vellum mb-1.5">
                          Phone Number (Optional)
                        </label>
                        <input
                          id="signup-phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          className="w-full rounded-xl border border-[rgba(237,231,218,0.18)] bg-white/5 px-4 py-2.5 text-sm text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="signup-pass" className="block text-xs font-semibold text-vellum mb-1.5">
                            Password *
                          </label>
                          <input
                            id="signup-pass"
                            type="password"
                            placeholder="Min 6 characters"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full rounded-xl border border-[rgba(237,231,218,0.18)] bg-white/5 px-3.5 py-2.5 text-sm text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                          />
                        </div>

                        <div>
                          <label htmlFor="signup-confirm" className="block text-xs font-semibold text-vellum mb-1.5">
                            Confirm Password *
                          </label>
                          <input
                            id="signup-confirm"
                            type="password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full rounded-xl border border-[rgba(237,231,218,0.18)] bg-white/5 px-3.5 py-2.5 text-sm text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                          />
                        </div>
                      </div>

                      {formError && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                          ⚠️ {formError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full border border-halo bg-halo py-3 text-sm font-bold text-void hover:bg-white hover:border-white transition-all shadow-[0_4px_20px_rgba(232,206,140,0.3)] disabled:opacity-60 cursor-pointer"
                      >
                        {isSubmitting ? "Creating Account…" : "Create Client Account"}
                      </button>
                    </form>

                    <p className="mt-5 text-xs text-dim">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("login");
                          setFormError("");
                          setSuccessMsg("");
                        }}
                        className="text-halo font-semibold hover:underline cursor-pointer"
                      >
                        Sign in here →
                      </button>
                    </p>
                  </>
                ) : authMode === "forgot" ? (
                  /* Option 3: Forgot Password */
                  <>
                    <h1 className={`${heading} text-2xl sm:text-3xl text-vellum mb-2 mt-2`}>
                      Reset Your Password
                    </h1>
                    <p className="text-[0.86rem] text-dim mb-6 leading-relaxed">
                      Enter your registered email address and we'll dispatch a secure reset link to your inbox.
                    </p>

                    {successMsg ? (
                      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-5 text-left mb-6">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">✉️</span>
                          <div>
                            <h4 className="text-sm font-bold text-emerald-300 mb-1">Reset Link Dispatched</h4>
                            <p className="text-xs text-emerald-200/90 leading-relaxed">
                              {successMsg}
                            </p>
                            <p className="text-[0.75rem] text-dim mt-2">
                              Please check your inbox (and spam folder). The link will remain active for 1 hour.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotPassword} className="space-y-4 text-left">
                        <div>
                          <label htmlFor="forgot-email" className="block text-xs font-semibold text-vellum mb-1.5">
                            Account Email Address *
                          </label>
                          <input
                            id="forgot-email"
                            type="email"
                            placeholder="e.g. client@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                            className="w-full rounded-xl border border-[rgba(237,231,218,0.18)] bg-white/5 px-4 py-2.5 text-sm text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                          />
                        </div>

                        {formError && (
                          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                            ⚠️ {formError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full rounded-full border border-halo bg-halo py-3 text-sm font-bold text-void hover:bg-white hover:border-white transition-all shadow-[0_4px_20px_rgba(232,206,140,0.3)] disabled:opacity-60 cursor-pointer"
                        >
                          {isSubmitting ? "Sending Reset Link…" : "Send Password Reset Link"}
                        </button>
                      </form>
                    )}

                    <div className="mt-6 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("login");
                          setFormError("");
                          setSuccessMsg("");
                        }}
                        className="text-xs text-halo font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        ← Return to Log In
                      </button>
                    </div>
                  </>
                ) : (
                  /* Option 4: Reset Password (via URL Token) */
                  <>
                    <h1 className={`${heading} text-2xl sm:text-3xl text-vellum mb-2 mt-2`}>
                      Set New Password
                    </h1>
                    <p className="text-[0.86rem] text-dim mb-6 leading-relaxed">
                      Choose a new secure password for your client account.
                    </p>

                    {successMsg ? (
                      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-5 text-left mb-6">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">✓</span>
                          <div>
                            <h4 className="text-sm font-bold text-emerald-300 mb-1">Success!</h4>
                            <p className="text-xs text-emerald-200/90 leading-relaxed">
                              {successMsg}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleResetPassword} className="space-y-4 text-left">
                        <div>
                          <label htmlFor="reset-pass" className="block text-xs font-semibold text-vellum mb-1.5">
                            New Password * (Min 6 characters)
                          </label>
                          <input
                            id="reset-pass"
                            type="password"
                            placeholder="New secure password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full rounded-xl border border-[rgba(237,231,218,0.18)] bg-white/5 px-4 py-2.5 text-sm text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                          />
                        </div>

                        <div>
                          <label htmlFor="reset-confirm" className="block text-xs font-semibold text-vellum mb-1.5">
                            Confirm New Password *
                          </label>
                          <input
                            id="reset-confirm"
                            type="password"
                            placeholder="Re-enter new password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full rounded-xl border border-[rgba(237,231,218,0.18)] bg-white/5 px-4 py-2.5 text-sm text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                          />
                        </div>

                        {formError && (
                          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                            ⚠️ {formError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full rounded-full border border-halo bg-halo py-3 text-sm font-bold text-void hover:bg-white hover:border-white transition-all shadow-[0_4px_20px_rgba(232,206,140,0.3)] disabled:opacity-60 cursor-pointer"
                        >
                          {isSubmitting ? "Updating Password…" : "Update Password & Sign In"}
                        </button>
                      </form>
                    )}

                    <div className="mt-6 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("login");
                          setFormError("");
                          setSuccessMsg("");
                        }}
                        className="text-xs text-halo font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        ← Return to Log In
                      </button>
                    </div>
                  </>
                )}

                <div className="mt-6 pt-5 border-t border-white/10 text-xs text-dim">
                  Looking to schedule a new appointment?{" "}
                  <Link to="/schedule" className="text-halo hover:underline">
                    Book a consultation
                  </Link>
                </div>
              </div>
            </Reveal>
          ) : (
            /* ========================================================= */
            /* Authenticated View: Full Client Portal & History          */
            /* ========================================================= */
            <div>
              {/* Profile Header Card */}
              <div className="rounded-3xl border border-[rgba(232,206,140,0.2)] bg-[#0E1630]/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-halo/15 border border-halo/30 text-halo font-display text-2xl font-semibold">
                      {customer?.name ? customer.name.slice(0, 2).toUpperCase() : "SB"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.7rem] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          ✦ Active Account
                        </span>
                      </div>
                      <h1 className={`${heading} text-2xl sm:text-3xl text-vellum mt-1`}>
                        {customer?.name || "Account Member"}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-dim mt-0.5">
                        <span>✉️ {customer?.email}</span>
                        {customer?.phone && <span>• 📞 {customer.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                      to="/schedule"
                      className="flex-1 sm:flex-none text-center rounded-full bg-halo px-5 py-2.5 text-xs font-bold text-void hover:bg-white transition-colors"
                    >
                      + Book New Session
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="rounded-full border border-[rgba(237,231,218,0.2)] px-4 py-2.5 text-xs text-dim hover:text-vellum hover:border-vellum transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/10">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left">
                    <span className="block text-[0.72rem] text-dim uppercase tracking-wider">Booked Sessions</span>
                    <span className="font-display text-xl sm:text-2xl text-halo font-semibold">
                      {stats.sessionsCount}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left">
                    <span className="block text-[0.72rem] text-dim uppercase tracking-wider">Book Store Orders</span>
                    <span className="font-display text-xl sm:text-2xl text-vellum font-semibold">
                      {stats.ordersCount}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left">
                    <span className="block text-[0.72rem] text-dim uppercase tracking-wider">Total Health Investment</span>
                    <span className="font-display text-xl sm:text-2xl text-emerald-400 font-semibold">
                      ${stats.totalSpent} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-[rgba(237,231,218,0.12)] pb-3 mb-6 overflow-x-auto whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setActiveTab("sessions")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === "sessions"
                      ? "bg-halo text-void shadow-sm"
                      : "text-dim hover:text-vellum hover:bg-white/5"
                  }`}
                >
                  <span>✦ Booked Sessions ({sessions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === "orders"
                      ? "bg-halo text-void shadow-sm"
                      : "text-dim hover:text-vellum hover:bg-white/5"
                  }`}
                >
                  <span>📦 Book Orders ({orders.length})</span>
                </button>
              </div>

              {/* Tab 1: Booked Sessions / Consultations */}
              {activeTab === "sessions" && (
                <div className="space-y-4">
                  {loading && sessions.length === 0 ? (
                    <div className="py-12 text-center text-dim text-sm">Loading your sessions…</div>
                  ) : sessions.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center">
                      <span className="text-4xl block mb-2">🧘‍♀️</span>
                      <h3 className="font-display text-xl text-vellum mb-1">No Consultations Scheduled Yet</h3>
                      <p className="text-sm text-dim max-w-md mx-auto mb-6">
                        You have not scheduled any sessions yet. Book a 1-on-1 metaphysical consultation or comprehensive healing series today.
                      </p>
                      <Link
                        to="/schedule"
                        className="inline-block rounded-full bg-halo px-6 py-2.5 text-xs font-bold text-void hover:bg-white transition-colors"
                      >
                        Explore Consultation Packages
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sessions.map((sess) => {
                        const isTarget = !!urlBooking && (sess.bookingNumber === urlBooking || sess._id === urlBooking);
                        return (
                        <div
                          key={sess._id}
                          id={`booking-${sess.bookingNumber}`}
                          className={`rounded-2xl p-5 backdrop-blur-md shadow-md flex flex-col justify-between transition-all ${
                            isTarget
                              ? "border-2 border-halo bg-[#0E1630] ring-4 ring-halo/20 shadow-[0_0_25px_rgba(232,206,140,0.3)]"
                              : "border border-[rgba(232,206,140,0.18)] bg-[#0E1630]/80"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                {isTarget && (
                                  <span className="inline-block rounded-full bg-halo text-void px-2.5 py-0.5 font-bold text-[0.68rem] uppercase tracking-wider mb-1">
                                    🎯 Selected Booking
                                  </span>
                                )}
                                <span className="text-[0.7rem] font-bold text-halo uppercase tracking-wider block">
                                  {sess.packageName}
                                </span>
                                <h3 className="font-semibold text-lg text-vellum">{sess.meetingType}</h3>
                              </div>
                              <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[0.72rem] font-bold text-emerald-300">
                                ✓ {sess.paymentStatus}
                              </span>
                            </div>

                            <div className="space-y-2 rounded-xl bg-black/30 border border-white/5 p-3.5 text-xs mb-4">
                              <div className="flex justify-between">
                                <span className="text-dim">Appointment Time:</span>
                                <span className="font-medium text-vellum">
                                  📅 {sess.appointmentDate} at {sess.appointmentTime}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-dim">Format:</span>
                                <span className="text-vellum">
                                  {sess.meetingMode === "ONLINE_ZOOM"
                                    ? "🌐 Online Video (Zoom/Meet)"
                                    : "🏛️ In-Person Sanctuary (Fremont, CA)"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-dim">Booking Ref:</span>
                                <span className="font-mono text-halo font-bold">{sess.bookingNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-dim">Fee:</span>
                                <span className="font-semibold text-emerald-400">${sess.price} USD</span>
                              </div>
                              {sess.notes && (
                                <div className="pt-2 border-t border-white/5 text-dim">
                                  <span className="font-medium text-vellum">Session Focus: </span>
                                  {sess.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10 text-dim">
                            <span>Dr. Alka Chopra Madan</span>
                            <span className="text-halo">Confirmed Session</span>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Book Store Orders */}
              {activeTab === "orders" && (
                <div className="space-y-4">
                  {loading && orders.length === 0 ? (
                    <div className="py-12 text-center text-dim text-sm">Loading your orders…</div>
                  ) : orders.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center">
                      <span className="text-4xl block mb-2">📚</span>
                      <h3 className="font-display text-xl text-vellum mb-1">No Book Orders Found</h3>
                      <p className="text-sm text-dim max-w-md mx-auto mb-6">
                        Explore our spiritual literature, Concept Clearing guides, and metaphysic publications.
                      </p>
                      <Link
                        to="/books"
                        className="inline-block rounded-full bg-halo px-6 py-2.5 text-xs font-bold text-void hover:bg-white transition-colors"
                      >
                        Browse Book Store
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((ord) => {
                        const isTarget = !!urlOrder && (ord.orderNumber === urlOrder || ord._id === urlOrder);
                        return (
                        <div
                          key={ord._id}
                          id={`order-${ord.orderNumber}`}
                          className={`rounded-2xl p-5 backdrop-blur-md transition-all ${
                            isTarget
                              ? "border-2 border-halo bg-[#0E1630] ring-4 ring-halo/20 shadow-[0_0_30px_rgba(232,206,140,0.25)]"
                              : "border border-[rgba(237,231,218,0.14)] bg-[#0E1630]/80"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isTarget && (
                                <span className="rounded-full bg-halo text-void px-2.5 py-0.5 font-bold text-[0.7rem] uppercase tracking-wider animate-pulse">
                                  🎯 Tracked Order
                                </span>
                              )}
                              <div>
                                <span className="text-dim">Order # </span>
                                <span className="font-mono font-bold text-halo">{ord.orderNumber}</span>
                                <span className="text-dim ml-2">
                                  • {new Date(ord.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-0.5 font-bold text-[0.72rem]">
                                {ord.orderStatus.replace("_", " ")}
                              </span>
                              <span className="font-bold text-vellum text-sm">
                                {currencyService.formatPrice(ord.total, ord.currency || "USD")}
                              </span>
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="divide-y divide-white/5">
                            {ord.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between py-2 text-xs">
                                <div className="flex items-center gap-3">
                                  {item.coverImage ? (
                                    <img
                                      src={item.coverImage}
                                      alt={item.title}
                                      className="h-10 w-8 object-cover rounded shadow"
                                    />
                                  ) : (
                                    <div className="h-10 w-8 rounded bg-white/5 flex items-center justify-center text-dim">
                                      📖
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium text-vellum text-sm block">{item.title}</span>
                                    <span className="text-dim">
                                      Format: {item.format || "Paperback"} • Qty: {item.quantity}
                                    </span>
                                  </div>
                                </div>
                                <span className="font-medium text-vellum">
                                  {currencyService.formatPrice(item.price * item.quantity, ord.currency || "USD")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default AccountPortal;
