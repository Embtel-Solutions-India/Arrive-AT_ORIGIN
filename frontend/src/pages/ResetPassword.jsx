import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import Reveal from "../components/landing/Reveal";
import { useCustomerAuth } from "../context/CustomerAuthContext";

const shell = "mx-auto w-full max-w-[1140px] px-[clamp(20px,4vw,48px)]";
const heading = "font-display font-light leading-[1.05] tracking-[-0.015em]";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const { resetPassword } = useCustomerAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setFormError("Reset token is missing. Please use the complete link from your email.");
      return;
    }
    if (!password || password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setFormError(
        err.message || "Unable to reset password. The link may have expired or is invalid."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.62] selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />

      <main className="py-[clamp(48px,6vw,96px)]">
        <div className={shell}>
          <Reveal className="mx-auto max-w-lg">
            <div className="rounded-3xl border border-[rgba(232,206,140,0.25)] bg-[#0E1630]/90 p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center">
              {/* Icon badge */}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(232,206,140,0.3)] bg-[rgba(232,206,140,0.1)] text-halo shadow-[0_0_20px_rgba(232,206,140,0.2)]">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              </div>

              <span className="text-[0.72rem] font-bold tracking-widest text-halo uppercase">
                Account Security
              </span>

              <h1 className={`${heading} text-2xl sm:text-3xl text-vellum mb-2 mt-2`}>
                Reset Your Password
              </h1>

              {success ? (
                /* Success View */
                <div className="mt-6 text-left">
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-5 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">✓</span>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-300 mb-1">
                          Password Successfully Updated
                        </h4>
                        <p className="text-xs text-emerald-200/90 leading-relaxed">
                          Your new password is now active and your account session is authenticated. You can manage your appointments and book orders anytime.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => navigate("/account")}
                      className="w-full rounded-full border border-halo bg-halo py-3 text-sm font-bold text-void hover:bg-white hover:border-white transition-all shadow-[0_4px_20px_rgba(232,206,140,0.3)] cursor-pointer"
                    >
                      Proceed to My Account →
                    </button>
                    <Link
                      to="/books"
                      className="block text-center text-xs text-dim hover:text-vellum py-2"
                    >
                      Browse Book Store
                    </Link>
                  </div>
                </div>
              ) : !token ? (
                /* Missing Token View */
                <div className="mt-6 text-left">
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <h4 className="text-sm font-bold text-amber-300 mb-1">
                          Reset Link Incomplete
                        </h4>
                        <p className="text-xs text-amber-200/90 leading-relaxed">
                          No reset token was found in the link. Please open the full link from the email you received, or request a new password reset link.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/account"
                    className="block w-full text-center rounded-full border border-halo bg-halo py-3 text-sm font-bold text-void hover:bg-white hover:border-white transition-all shadow-[0_4px_20px_rgba(232,206,140,0.3)]"
                  >
                    Go to Account & Request Reset →
                  </Link>
                </div>
              ) : (
                /* Password Reset Form */
                <>
                  <p className="text-[0.86rem] text-dim mb-6 leading-relaxed">
                    Enter your new secure password below to regain access to your account.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="new-password"
                          className="block text-xs font-semibold text-vellum"
                        >
                          New Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[0.72rem] text-halo hover:underline cursor-pointer"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full rounded-xl border border-[rgba(237,231,218,0.18)] bg-white/5 px-4 py-2.5 text-sm text-vellum placeholder-dim/50 focus:border-halo focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="block text-xs font-semibold text-vellum mb-1.5"
                      >
                        Confirm New Password *
                      </label>
                      <input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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

                  <div className="mt-6 pt-4 border-t border-white/10 text-center">
                    <Link
                      to="/account"
                      className="text-xs text-halo font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      ← Back to Sign In
                    </Link>
                  </div>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
